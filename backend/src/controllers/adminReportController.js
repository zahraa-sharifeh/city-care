const Report = require("../models/Report");
const Notification = require("../models/Notification");
const Department = require("../models/Department");
const { adminCanAccessReport, parseObjectId } = require("../services/reportAccess");
const { sendStatusEmail } = require("../services/mailer");
const { findDuplicateCandidates } = require("../services/duplicateDetection");
const { buildReportsPdfBuffer, buildSingleReportPdfBuffer } = require("../services/reportsExportPdf");

const STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const DUPLICATE_ACTIONS = ["MARK_DUPLICATE", "IGNORE_DUPLICATE"];
const STATUS_LABELS = {
  PENDING: "Submitted",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const DUPLICATE_LABELS = {
  PENDING_REVIEW: "Pending review",
  CONFIRMED_DUPLICATE: "Duplicate",
  NOT_DUPLICATE: "Not duplicate",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority || "";
}

function getDuplicateLabel(status) {
  return DUPLICATE_LABELS[status] || status || "Pending review";
}

function formatExportDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ageInDays(createdAt) {
  if (!createdAt) return "";
  const ms = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ms)) return "";
  return String(Math.max(0, Math.floor(ms / 86400000)));
}

function buildAdminScopeFilter(user) {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "DISTRICT_ADMIN") {
    if (!user.districtId) return null;
    return { districtId: user.districtId };
  }
  return null;
}

function normalizeDateBoundary(raw, endOfDay = false) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @returns {{ filter: object, error: string|null }}
 */
function buildAdminReportsListFilter(user, query) {
  const scope = buildAdminScopeFilter(user);
  if (scope === null) {
    return { filter: null, error: "District admin must be assigned to a district" };
  }

  const filter = { ...scope };
  if (query.status && STATUSES.includes(query.status)) {
    filter.status = query.status;
  }
  if (query.priority && PRIORITIES.includes(query.priority)) {
    filter.priority = query.priority;
  }
  if (query.category) {
    filter.category = String(query.category).trim();
  }
  if (user.role === "SUPER_ADMIN" && query.districtId) {
    const did = parseObjectId(query.districtId);
    if (did) filter.districtId = did;
  }
  if (query.departmentId) {
    if (query.departmentId === "unassigned") {
      filter.departmentId = null;
    } else {
      const departmentId = parseObjectId(query.departmentId);
      if (departmentId) filter.departmentId = departmentId;
    }
  }
  const dateFrom = normalizeDateBoundary(query.dateFrom, false);
  const dateTo = normalizeDateBoundary(query.dateTo, true);
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  const minAgeDays = parseInt(query.minAgeDays, 10);
  if (Number.isFinite(minAgeDays) && minAgeDays > 0 && minAgeDays <= 3650) {
    const cutoff = new Date(Date.now() - minAgeDays * 86400000);
    if (!filter.createdAt) filter.createdAt = {};
    if (filter.createdAt.$lte) {
      filter.createdAt.$lte = new Date(Math.min(new Date(filter.createdAt.$lte).getTime(), cutoff.getTime()));
    } else {
      filter.createdAt.$lte = cutoff;
    }
  }

  return { filter, error: null };
}

function describeExportFilters(query) {
  const parts = [];
  if (query.status && STATUSES.includes(query.status)) {
    parts.push(`Status: ${getStatusLabel(query.status)}`);
  }
  if (query.priority && PRIORITIES.includes(query.priority)) {
    parts.push(`Priority: ${getPriorityLabel(query.priority)}`);
  }
  if (query.category) parts.push(`Category: ${String(query.category).trim()}`);
  if (query.departmentId === "unassigned") parts.push("Department: Unassigned");
  if (query.dateFrom) parts.push(`From: ${query.dateFrom}`);
  if (query.dateTo) parts.push(`To: ${query.dateTo}`);
  const minAge = parseInt(query.minAgeDays, 10);
  if (Number.isFinite(minAge) && minAge > 0) parts.push(`Min age: ${minAge} days`);
  return parts;
}

function mapRowForExport(r) {
  const coords = r.location && Array.isArray(r.location.coordinates) ? r.location.coordinates : [];
  const lng = coords[0];
  const lat = coords[1];
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  return {
    created: formatExportDate(r.createdAt),
    ageDays: ageInDays(r.createdAt),
    status: getStatusLabel(r.status),
    priority: getPriorityLabel(r.priority),
    category: r.category || "",
    description: r.description || "",
    location: r.locationDescription || "",
    district: r.districtId?.name || "",
    governorate: r.governorateId?.name || "",
    department: r.departmentId?.name || "Unassigned",
    citizen: r.userId?.fullName || "",
    email: r.userId?.email || "",
    duplicate: getDuplicateLabel(r.duplicateReview?.status),
    note: r.statusNote || "",
    id: String(r._id),
    mapLink: hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : "",
    imageLinks: Array.isArray(r.images) ? r.images.filter(Boolean) : [],
  };
}

exports.listReports = async (req, res) => {
  try {
    const { filter, error } = buildAdminReportsListFilter(req.user, req.query);
    if (error) {
      return res.status(403).json({ message: error });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("governorateId", "name")
        .populate("districtId", "name")
        .populate("userId", "fullName email")
        .populate("departmentId", "name")
        .populate("duplicateReview.primaryReportId", "category status createdAt")
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.exportReportsPdf = async (req, res) => {
  try {
    const { filter, error } = buildAdminReportsListFilter(req.user, req.query);
    if (error) {
      return res.status(403).json({ message: error });
    }

    const maxRows = Math.min(500, Math.max(1, parseInt(process.env.ADMIN_EXPORT_MAX_ROWS || "200", 10)));
    const rows = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(maxRows)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email")
      .populate("departmentId", "name")
      .lean();

    const mapped = rows.map(mapRowForExport);
    const pdf = await buildReportsPdfBuffer({
      rows: mapped,
      generatedAt: new Date(),
      filterLines: describeExportFilters(req.query),
      totalShown: mapped.length,
      capped: rows.length >= maxRows,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="reports-${stamp}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.exportSingleReportPdf = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email")
      .populate("departmentId", "name")
      .lean();

    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!adminCanAccessReport(req.user, report)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const row = mapRowForExport(report);
    const pdf = await buildSingleReportPdfBuffer({ row, generatedAt: new Date() });
    const safeCategory = String(report.category || "report")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .slice(0, 40)
      .replace(/\s+/g, "-");
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${safeCategory || "issue"}-${stamp}.pdf"`
    );
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email")
      .populate("departmentId", "name")
      .populate("duplicateReview.primaryReportId", "category status createdAt");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!adminCanAccessReport(req.user, report)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const scope = buildAdminScopeFilter(req.user) || {};
    const duplicateCandidates = await findDuplicateCandidates(report, scope);
    res.json({ ...report.toObject(), duplicateCandidates });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status, statusNote, priority, departmentId, duplicateAction, primaryReportId } = req.body;
    if (status && !STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
    if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ message: "Invalid priority" });
    if (duplicateAction && !DUPLICATE_ACTIONS.includes(duplicateAction)) {
      return res.status(400).json({ message: "Invalid duplicate action" });
    }

    const report = await Report.findById(req.params.id).populate("userId", "fullName email");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!adminCanAccessReport(req.user, report)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!status && !priority && statusNote === undefined && departmentId === undefined && !duplicateAction) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const previousStatus = report.status;
    const previousStatusNote = report.statusNote || "";
    const nextStatus = status || report.status;
    const normalizedNote = statusNote === undefined ? report.statusNote || "" : String(statusNote || "").trim();
    if (priority) report.priority = priority;
    report.status = nextStatus;
    report.statusNote = normalizedNote;
    if (departmentId !== undefined) {
      if (departmentId === "" || departmentId === null) {
        report.departmentId = null;
      } else {
        const parsedDepartmentId = parseObjectId(departmentId);
        if (!parsedDepartmentId) return res.status(400).json({ message: "Invalid departmentId" });
        const departmentExists = await Department.exists({ _id: parsedDepartmentId, isActive: true });
        if (!departmentExists) return res.status(400).json({ message: "Department not found" });
        report.departmentId = parsedDepartmentId;
      }
    }
    if (duplicateAction === "IGNORE_DUPLICATE") {
      const currentPrimaryId = report.duplicateReview?.primaryReportId;
      report.duplicateReview = { status: "NOT_DUPLICATE", primaryReportId: null };

      if (currentPrimaryId) {
        await Report.findOneAndUpdate(
          {
            _id: currentPrimaryId,
            "duplicateReview.status": "CONFIRMED_DUPLICATE",
            "duplicateReview.primaryReportId": report._id,
          },
          {
            $set: {
              "duplicateReview.status": "PENDING_REVIEW",
              "duplicateReview.primaryReportId": null,
            },
          }
        );
      }
    }
    if (duplicateAction === "MARK_DUPLICATE") {
      const parsedPrimaryId = parseObjectId(primaryReportId);
      if (!parsedPrimaryId) return res.status(400).json({ message: "Valid primaryReportId is required" });
      if (String(parsedPrimaryId) === String(report._id)) {
        return res.status(400).json({ message: "A report cannot be duplicate of itself" });
      }
      const primaryReport = await Report.findById(parsedPrimaryId);
      if (!primaryReport) return res.status(404).json({ message: "Primary report not found" });
      if (!adminCanAccessReport(req.user, primaryReport)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      report.duplicateReview = { status: "CONFIRMED_DUPLICATE", primaryReportId: parsedPrimaryId };

      await Report.findOneAndUpdate(
        {
          _id: parsedPrimaryId,
          "duplicateReview.status": "CONFIRMED_DUPLICATE",
          "duplicateReview.primaryReportId": report._id,
        },
        {
          $set: {
            "duplicateReview.status": "PENDING_REVIEW",
            "duplicateReview.primaryReportId": null,
          },
        }
      );
    }
    await report.save();

    if (previousStatus !== nextStatus || previousStatusNote !== normalizedNote) {
      const previousStatusLabel = getStatusLabel(previousStatus);
      const statusLabel = getStatusLabel(nextStatus);
      await Notification.create({
        userId: report.userId,
        reportId: report._id,
        type: "REPORT_STATUS",
        title: "Report status updated",
        message: normalizedNote
          ? `Your report "${report.category}" moved from ${previousStatusLabel} to ${statusLabel}. Note: ${normalizedNote}`
          : `Your report "${report.category}" moved from ${previousStatusLabel} to ${statusLabel}.`,
        data: {
          status: nextStatus,
          previousStatus,
          category: report.category,
          statusNote: normalizedNote,
        },
      });

      if (previousStatus !== nextStatus) {
        try {
          await sendStatusEmail({
            to: report.userId?.email,
            citizenName: report.userId?.fullName,
            category: report.category,
            previousStatusLabel,
            statusLabel,
            statusNote: normalizedNote,
            reportId: String(report._id),
          });
        } catch (emailErr) {
          console.error("Status email sending failed:", emailErr.message);
        }
      }
    }

    const populated = await Report.findById(report._id)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email")
      .populate("departmentId", "name")
      .populate("duplicateReview.primaryReportId", "category status createdAt");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

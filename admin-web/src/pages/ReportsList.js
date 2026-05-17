import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaDownload,
  FaExternalLinkAlt,
  FaFilter,
  FaMapMarkedAlt,
  FaPlus,
} from "react-icons/fa";
import { apiFetch, apiFetchBlob } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";
import { getStatusLabel, getStatusOptions } from "../utils/statusLabels";
import { getCategoryLabelFromValue, getIssueCategorySelectOptions, resolveIssueCategory } from "../constants/issueCategories";
import { getPriorityLabel, getPriorityOptions } from "../utils/priorityLabels";
import ReportMap from "../components/ReportMap";
import "../App.css";

function statusModifier(status) {
  const s = String(status || "").toLowerCase();
  if (["pending", "in_progress", "resolved", "rejected"].includes(s)) return s;
  return "pending";
}

function duplicateModifier(status) {
  if (status === "CONFIRMED_DUPLICATE") return "confirmed";
  if (status === "NOT_DUPLICATE") return "clear";
  return "pending";
}

export default function ReportsList() {
  const { t, i18n } = useTranslation();
  const statusOptions = getStatusOptions();
  const priorityOptions = getPriorityOptions();
  const categoryOptions = getIssueCategorySelectOptions();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAgeDays, setMinAgeDays] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const dateLocale = i18n.language === "ar" ? "ar-LB" : undefined;

  const loadDepartments = useCallback(async () => {
    try {
      const deps = await apiFetch("/api/admin/departments");
      setDepartments(deps || []);
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [govs, deps] = await Promise.all([apiFetch("/api/governorates"), apiFetch("/api/admin/departments")]);
        if (cancelled) return;
        setGovernorates(govs || []);
        setDepartments(deps || []);
      } catch {
        if (!cancelled) {
          setGovernorates([]);
          setDepartments([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!governorateId || admin?.role !== "SUPER_ADMIN") {
      setDistricts([]);
      setDistrictId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const distData = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(governorateId)}`);
        if (!cancelled) setDistricts(distData || []);
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [governorateId, admin?.role]);

  const appendListFilters = useCallback(
    params => {
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (category) params.set("category", category);
      if (departmentId) params.set("departmentId", departmentId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const age = parseInt(minAgeDays, 10);
      if (Number.isFinite(age) && age > 0 && age <= 3650) params.set("minAgeDays", String(age));
      if (admin?.role === "SUPER_ADMIN" && districtId) params.set("districtId", districtId);
    },
    [status, priority, category, departmentId, dateFrom, dateTo, minAgeDays, districtId, admin?.role]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      appendListFilters(params);
      const res = await apiFetch(`/api/admin/reports?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, appendListFilters]);

  async function exportPdf() {
    setError("");
    setExporting(true);
    try {
      const params = new URLSearchParams();
      appendListFilters(params);
      const blob = await apiFetchBlob(`/api/admin/reports/export.pdf?${params.toString()}`);
      const stamp = new Date().toISOString().slice(0, 10);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `reports-${stamp}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError(e.message || t("reports.exportFailed"));
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  const mapReports = useMemo(() => data?.items || [], [data]);

  const hasActiveFilters = Boolean(
    status || priority || category || departmentId || dateFrom || dateTo || minAgeDays || governorateId || districtId
  );

  function clearFilters() {
    setStatus("");
    setPriority("");
    setCategory("");
    setDepartmentId("");
    setDateFrom("");
    setDateTo("");
    setMinAgeDays("");
    setGovernorateId("");
    setDistrictId("");
    setPage(1);
  }

  async function createDepartment() {
    const name = newDepartmentName.trim();
    if (!name) return;
    setCreatingDepartment(true);
    setError("");
    try {
      await apiFetch("/api/admin/departments", { method: "POST", body: JSON.stringify({ name }) });
      setNewDepartmentName("");
      await loadDepartments();
    } catch (e) {
      setError(e.message || t("reports.createDepartmentFailed"));
    } finally {
      setCreatingDepartment(false);
    }
  }

  return (
    <div className="reports-page">
      <header className="card reports-hero">
        <div className="reports-hero-text">
          <p className="reports-eyebrow">
            <FaClipboardList aria-hidden />
            {t("nav.reports")}
          </p>
          <h1>{t("reports.title")}</h1>
          <p className="reports-lead">{t("reports.listLead")}</p>
        </div>
        {data ? (
          <div className="reports-hero-stat" aria-label={t("reports.totalMatching")}>
            <strong>{data.total}</strong>
            <span>{t("reports.totalMatching")}</span>
          </div>
        ) : null}
      </header>

      <section className="card reports-filters-card">
        <div className="reports-section-head">
          <FaFilter aria-hidden />
          <h2>{t("reports.filters")}</h2>
          {hasActiveFilters ? (
            <button type="button" className="reports-clear-filters" onClick={clearFilters}>
              {t("reports.clearFilters")}
            </button>
          ) : null}
        </div>

        <div className="reports-filters">
          <div className="reports-filter-field">
            <label htmlFor="st">{t("common.status")}</label>
            <select id="st" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">{t("common.all")}</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-field">
            <label htmlFor="priority">{t("reports.priority")}</label>
            <select id="priority" value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}>
              <option value="">{t("common.all")}</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-field">
            <label htmlFor="category">{t("common.category")}</label>
            <select id="category" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="">{t("common.all")}</option>
              {categoryOptions.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-field">
            <label htmlFor="department">{t("reports.department")}</label>
            <select id="department" value={departmentId} onChange={e => { setDepartmentId(e.target.value); setPage(1); }}>
              <option value="">{t("common.all")}</option>
              <option value="unassigned">{t("reports.unassigned")}</option>
              {departments.map(dep => (
                <option key={dep._id} value={dep._id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-field">
            <label htmlFor="dateFrom">{t("reports.dateFrom")}</label>
            <input id="dateFrom" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="reports-filter-field">
            <label htmlFor="dateTo">{t("reports.dateTo")}</label>
            <input id="dateTo" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div className="reports-filter-field">
            <label htmlFor="minAge">{t("reports.minAgeDays")}</label>
            <input
              id="minAge"
              type="number"
              min={1}
              max={3650}
              placeholder={t("reports.minAgeAny")}
              value={minAgeDays}
              onChange={e => { setMinAgeDays(e.target.value); setPage(1); }}
            />
          </div>
          {admin?.role === "SUPER_ADMIN" ? (
            <>
              <div className="reports-filter-field">
                <label htmlFor="gov">{t("common.governorate")}</label>
                <select id="gov" value={governorateId} onChange={e => { setGovernorateId(e.target.value); setPage(1); }}>
                  <option value="">{t("common.all")}</option>
                  {governorates.map(gov => (
                    <option key={gov._id} value={gov._id}>
                      {gov.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="reports-filter-field">
                <label htmlFor="dist">{t("common.district")}</label>
                <select
                  id="dist"
                  value={districtId}
                  disabled={!governorateId}
                  onChange={e => { setDistrictId(e.target.value); setPage(1); }}
                >
                  <option value="">{governorateId ? t("common.all") : t("reports.selectGovernorateFirst")}</option>
                  {districts.map(dist => (
                    <option key={dist._id} value={dist._id}>
                      {dist.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>

        {admin?.role === "SUPER_ADMIN" ? (
          <div className="reports-dept-create">
            <label htmlFor="newDepartment">{t("reports.createDepartment")}</label>
            <div className="reports-dept-create-row">
              <input
                id="newDepartment"
                value={newDepartmentName}
                placeholder={t("reports.createDepartmentPlaceholder")}
                onChange={e => setNewDepartmentName(e.target.value)}
              />
              <button
                type="button"
                className="secondary reports-dept-btn"
                disabled={creatingDepartment || !newDepartmentName.trim()}
                onClick={createDepartment}
              >
                <FaPlus aria-hidden />
                {creatingDepartment ? t("reports.creatingDepartment") : t("reports.addDepartment")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="reports-toolbar">
        <div className="reports-toolbar-actions">
          <button type="button" className="secondary reports-tool-btn" onClick={() => setShowMap(value => !value)}>
            <FaMapMarkedAlt aria-hidden />
            {showMap ? t("reports.hideMap") : t("reports.showMap")}
          </button>
          <button type="button" className="reports-tool-btn" disabled={exporting} onClick={exportPdf}>
            <FaDownload aria-hidden />
            {exporting ? t("reports.exporting") : t("reports.exportPdf")}
          </button>
        </div>
        {data ? (
          <p className="reports-page-meta muted">
            {t("reports.pageOf", { page: data.page, pages: data.pages, total: data.total })}
          </p>
        ) : null}
      </div>

      {error ? <p className="error reports-error">{error}</p> : null}

      {showMap && data && mapReports.length > 0 ? (
        <section className="card reports-map-card">
          <div className="reports-section-head">
            <FaMapMarkedAlt aria-hidden />
            <h2>{t("reports.mapPreview")}</h2>
          </div>
          <ReportMap
            reports={mapReports}
            height={300}
            className="map-canvas map-canvas--embed"
            onOpenReport={id => navigate(`/reports/${id}`)}
          />
        </section>
      ) : null}

      <section className="card reports-table-card">
        {loading && !data ? (
          <p className="muted reports-loading" role="status">
            {t("common.loading")}
          </p>
        ) : data && data.items.length === 0 ? (
          <div className="reports-empty">
            <p>{t("reports.noResults")}</p>
            {hasActiveFilters ? (
              <button type="button" className="secondary" onClick={clearFilters}>
                {t("reports.clearFilters")}
              </button>
            ) : null}
          </div>
        ) : data ? (
          <>
            <div className="table-wrap reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>{t("common.category")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("reports.duplicateCol")}</th>
                    <th>{t("reports.priority")}</th>
                    <th>{t("reports.department")}</th>
                    <th>{t("common.district")}</th>
                    <th>{t("reports.citizen")}</th>
                    <th>{t("reports.created")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(r => {
                    const cat = resolveIssueCategory(r.category);
                    const dupStatus = r.duplicateReview?.status;
                    return (
                      <tr key={r._id} className="reports-table-row">
                        <td>
                          <span className="reports-category-cell">
                            <span className="reports-category-dot" style={{ backgroundColor: cat.color }} aria-hidden />
                            {getCategoryLabelFromValue(r.category)}
                          </span>
                        </td>
                        <td>
                          <span className={`reports-badge reports-badge--${statusModifier(r.status)}`}>
                            {getStatusLabel(r.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`reports-badge reports-badge--dup-${duplicateModifier(dupStatus)}`}>
                            {dupStatus === "CONFIRMED_DUPLICATE"
                              ? t("reports.duplicate")
                              : dupStatus === "NOT_DUPLICATE"
                                ? t("reports.notDuplicate")
                                : t("reports.duplicatePending")}
                          </span>
                        </td>
                        <td>
                          <span className="reports-priority">{getPriorityLabel(r.priority)}</span>
                        </td>
                        <td className="reports-dept-cell">{r.departmentId?.name || t("reports.unassigned")}</td>
                        <td>{r.districtId?.name || "—"}</td>
                        <td>{r.userId?.fullName || "—"}</td>
                        <td className="reports-date-cell">
                          {new Date(r.createdAt).toLocaleString(dateLocale, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td>
                          <Link to={`/reports/${r._id}`} className="reports-open-link">
                            {t("reports.open")}
                            <FaExternalLinkAlt aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="reports-pagination">
              <button
                type="button"
                className="secondary reports-page-btn"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <FaChevronLeft aria-hidden />
                {t("reports.previous")}
              </button>
              <span className="reports-page-indicator">
                {t("reports.pageOf", { page: data.page, pages: data.pages, total: data.total })}
              </span>
              <button
                type="button"
                className="secondary reports-page-btn"
                disabled={page >= (data.pages || 1) || loading}
                onClick={() => setPage(p => p + 1)}
              >
                {t("reports.next")}
                <FaChevronRight aria-hidden />
              </button>
            </footer>
          </>
        ) : null}
      </section>
    </div>
  );
}

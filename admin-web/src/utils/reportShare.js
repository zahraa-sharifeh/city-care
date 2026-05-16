import i18n from "../i18n";
import { getCategoryLabelFromValue } from "../constants/issueCategories";
import { getStatusLabel } from "./statusLabels";
import { getPriorityLabel } from "./priorityLabels";

/** Strip to digits; return E.164-style string without + for wa.me */
export function normalizeWhatsAppPhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits;
}

export function isValidWhatsAppPhone(digits) {
  return digits.length >= 8 && digits.length <= 15;
}

export function buildReportShareMessage(report) {
  if (!report) return "";

  const coords = report.location?.coordinates;
  const lat = coords?.[1];
  const lng = coords?.[0];
  const mapLink =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "";

  const lines = [
    i18n.t("reports.shareMessageHeader"),
    "",
    `${i18n.t("common.category")}: ${getCategoryLabelFromValue(report.category) || "—"}`,
    `${i18n.t("common.status")}: ${getStatusLabel(report.status)}`,
    `${i18n.t("reports.priority")}: ${getPriorityLabel(report.priority)}`,
    `${i18n.t("reports.shareArea")}: ${[report.governorateId?.name, report.districtId?.name].filter(Boolean).join(" · ") || "—"}`,
    "",
    `${i18n.t("reports.location")} ${report.locationDescription || "—"}`,
    mapLink ? `${i18n.t("reports.shareMap")}: ${mapLink}` : null,
    "",
    `${i18n.t("reports.shareDescription")}: ${report.description || "—"}`,
    "",
    `${i18n.t("reports.shareReportId")}: ${report._id}`,
    "",
    i18n.t("reports.shareAttachPdf"),
  ].filter(line => line !== null);

  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneDigits, text) {
  const phone = normalizeWhatsAppPhone(phoneDigits);
  const params = new URLSearchParams();
  if (text) params.set("text", text);
  const query = params.toString();
  return `https://wa.me/${phone}${query ? `?${query}` : ""}`;
}

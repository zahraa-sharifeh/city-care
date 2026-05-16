import React, { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClipboardList,
  FaExternalLinkAlt,
  FaHome,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPlusCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { apiFetch } from "../api/client";
import { getStatusLabel } from "../utils/statusLabels";
import { resolveIssueCategory } from "../constants/issueCategories";
import ReportInteractions from "../components/ReportInteractions";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

function statusModifier(status) {
  const s = String(status || "").toLowerCase();
  if (["pending", "in_progress", "resolved", "rejected"].includes(s)) return s;
  return "pending";
}

function statusHintKey(status) {
  switch (status) {
    case "IN_PROGRESS":
      return "reportDetail.statusInProgress";
    case "RESOLVED":
      return "reportDetail.statusResolved";
    case "REJECTED":
      return "reportDetail.statusRejected";
    default:
      return "reportDetail.statusPending";
  }
}

function reportMapUrl(report) {
  const coords = report?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function ReportDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async ({ silent } = {}) => {
      setError("");
      if (!silent) setLoading(true);
      try {
        const r = await apiFetch(`/api/reports/${id}`);
        setReport(r);
      } catch (e) {
        setError(e.message || t("reportDetail.loadError"));
        if (!silent) setReport(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, t]
  );

  useRefetchOnFocus(load, [id], { pollIntervalMs: 30000 });

  if (loading) {
    return (
      <div className="explore-report-main my-report-page">
        <div className="explore-report-card explore-report-card--loading my-report-card">
          <p className="report-detail-loading" role="status">
            <span className="report-detail-loading-dot" aria-hidden />
            {t("reportDetail.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="explore-report-main my-report-page">
        <div className="explore-report-card explore-report-card--error my-report-card">
          <p className="error">{error}</p>
          <Link to="/reports" className="my-report-back my-report-back--button">
            <FaArrowLeft aria-hidden /> {t("reportDetail.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const cat = resolveIssueCategory(report.category);
  const statusClass = statusModifier(report.status);
  const locationLine = [report.governorateId?.name, report.districtId?.name].filter(Boolean).join(" · ");
  const mapsUrl = reportMapUrl(report);
  const images = report.images || [];
  const [featuredImage, ...galleryRest] = images;

  return (
    <div className="explore-report-main my-report-page">
      <article className="explore-report-card my-report-card">
        <div className="explore-report-hero my-report-hero">
          <Link to="/reports" className="my-report-back">
            <FaArrowLeft aria-hidden />
            {t("reportDetail.backToList")}
          </Link>

          <nav className="explore-report-nav my-report-nav" aria-label={t("reportDetail.navAriaLabel")}>
            <Link to="/reports/new" className="explore-report-nav-link">
              <FaPlusCircle aria-hidden />
              {t("reportDetail.navNewReport")}
            </Link>
            <span className="explore-report-nav-sep" aria-hidden>
              /
            </span>
            <Link to="/map" className="explore-report-nav-link">
              <FaMapMarkedAlt aria-hidden />
              {t("reportDetail.navMap")}
            </Link>
            <span className="explore-report-nav-sep" aria-hidden>
              /
            </span>
            <Link to="/" className="explore-report-nav-link">
              <FaHome aria-hidden />
              {t("reportDetail.navHome")}
            </Link>
          </nav>

          <header className="report-detail-header explore-report-header my-report-header">
            <div className="my-report-header-top">
              <span className="my-report-category-chip" style={{ borderColor: cat.color, color: cat.color }}>
                <span className="my-report-category-dot" style={{ backgroundColor: cat.color }} aria-hidden />
                {cat.label}
              </span>
              <span className={`report-detail-status report-detail-status--${statusClass}`}>
                {getStatusLabel(report.status)}
              </span>
            </div>
            <h1>{cat.label}</h1>
            <div className="report-detail-meta my-report-meta">
              {locationLine ? (
                <span className="report-detail-meta-line my-report-meta-pill">
                  <FaMapMarkerAlt aria-hidden />
                  {locationLine}
                </span>
              ) : null}
              <span className="report-detail-meta-line my-report-meta-pill">
                <FaCalendarAlt aria-hidden />
                {new Date(report.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </header>
        </div>

        <div className="my-report-layout">
          <aside className="my-report-sidebar" aria-label={t("reportDetail.sidebarAriaLabel")}>
            <div className={`my-report-status-card my-report-status-card--${statusClass}`}>
              <span className="my-report-status-icon" aria-hidden="true">
                <FaSyncAlt />
              </span>
              <h2 className="my-report-status-title">{getStatusLabel(report.status)}</h2>
              <p className="muted my-report-status-hint">{t(statusHintKey(report.status))}</p>
            </div>

            <div className="my-report-quick-links">
              <h3 className="my-report-sidebar-label">{t("reportDetail.quickLinks")}</h3>
              <Link to="/reports" className="my-report-quick-link">
                <FaClipboardList aria-hidden />
                {t("reportDetail.allMyReports")}
              </Link>
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="my-report-quick-link">
                  <FaMapMarkedAlt aria-hidden />
                  {t("reportDetail.openOnMap")}
                  <FaExternalLinkAlt className="my-report-quick-link-ext" aria-hidden />
                </a>
              ) : null}
              <Link to="/map" className="my-report-quick-link">
                <FaMapMarkedAlt aria-hidden />
                {t("reportDetail.cityIssueMap")}
              </Link>
            </div>
          </aside>

          <div className="explore-report-body my-report-body">
            {report.statusNote ? (
              <aside className="report-detail-admin-note my-report-admin-note" role="note">
                <strong className="report-detail-admin-label">{t("reportDetail.teamNote")}</strong>
                <p className="report-detail-admin-body">{report.statusNote}</p>
              </aside>
            ) : null}

            <section className="report-detail-section my-report-panel" aria-labelledby="my-report-desc-heading">
              <h2 id="my-report-desc-heading" className="report-detail-section-title">
                {t("reportDetail.description")}
              </h2>
              <p className="report-detail-description">{report.description}</p>
            </section>

            <section
              className="report-detail-section report-detail-callout my-report-panel my-report-location-panel"
              aria-labelledby="my-report-loc-heading"
            >
              <h2 id="my-report-loc-heading" className="report-detail-section-title">
                <FaMapMarkerAlt aria-hidden className="my-report-section-icon" />
                {t("reportDetail.location")}
              </h2>
              <p className="report-detail-callout-text">{report.locationDescription}</p>
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="my-report-map-link">
                  {t("reportDetail.viewGoogleMaps")}
                  <FaExternalLinkAlt aria-hidden />
                </a>
              ) : null}
            </section>

            {images.length > 0 ? (
              <section className="report-detail-section my-report-panel" aria-label={t("reportDetail.uploadsAriaLabel")}>
                <h2 className="report-detail-section-title">{t("reportDetail.photos", { count: images.length })}</h2>
                {featuredImage ? (
                  <a
                    href={featuredImage}
                    target="_blank"
                    rel="noreferrer"
                    className="report-detail-gallery-featured"
                  >
                    <img src={featuredImage} alt={t("reportDetail.primaryUploadAlt")} loading="eager" />
                  </a>
                ) : null}
                {galleryRest.length > 0 ? (
                  <div className="report-detail-gallery">
                    {galleryRest.map((src, i) => (
                      <a key={src} href={src} target="_blank" rel="noreferrer" className="report-detail-gallery-item">
                        <img src={src} alt={t("reportDetail.uploadAlt", { index: i + 2 })} loading="lazy" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="my-report-interactions-panel" aria-label={t("reportDetail.interactionsAriaLabel")}>
              <ReportInteractions reportId={id} afterLoginPath={`/reports/${id}`} />
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}

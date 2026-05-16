import React, { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCalendarAlt, FaClipboardList, FaGlobe, FaHome, FaMapMarkerAlt, FaMapMarkedAlt } from "react-icons/fa";
import { apiFetch } from "../api/client";
import { getStatusLabel } from "../utils/statusLabels";
import { resolveIssueCategory } from "../constants/issueCategories";
import CitizenTopBar from "../components/CitizenTopBar";
import ReportInteractions from "../components/ReportInteractions";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

function statusModifier(status) {
  const s = String(status || "").toLowerCase();
  if (["pending", "in_progress", "resolved", "rejected"].includes(s)) return s;
  return "pending";
}

function Shell({ children }) {
  return (
    <div className="app-shell discover-shell">
      <CitizenTopBar />
      <main className="main discover-main explore-report-main">{children}</main>
    </div>
  );
}

export default function ExploreReportDetail() {
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
        const r = await apiFetch(`/api/reports/public/${id}`);
        setReport(r);
      } catch (e) {
        setError(e.message || t("exploreReport.loadError"));
        if (!silent) setReport(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, t]
  );

  useRefetchOnFocus(load, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="explore-report-card explore-report-card--loading">
          <p className="report-detail-loading" role="status">
            <span className="report-detail-loading-dot" aria-hidden />
            {t("exploreReport.loading")}
          </p>
        </div>
      </Shell>
    );
  }

  if (error && !report) {
    return (
      <Shell>
        <div className="explore-report-card explore-report-card--error">
          <p className="error">{error}</p>
          <Link to="/map" className="explore-report-nav-link explore-report-nav-link--button">
            <FaArrowLeft aria-hidden /> {t("exploreReport.backToMap")}
          </Link>
        </div>
      </Shell>
    );
  }

  if (!report) return null;

  const cat = resolveIssueCategory(report.category);
  const statusClass = statusModifier(report.status);
  const locationLine = [report.governorateId?.name, report.districtId?.name].filter(Boolean).join(" · ");
  const isOwnReport = Boolean(report.isMine);

  return (
    <Shell>
      <article className="explore-report-card">
        <div className="explore-report-hero">
          <nav className="explore-report-nav" aria-label={t("exploreReport.navAriaLabel")}>
            {isOwnReport ? (
              <>
                <Link to="/reports" className="explore-report-nav-link">
                  <FaClipboardList aria-hidden />
                  {t("exploreReport.navMyReports")}
                </Link>
                <span className="explore-report-nav-sep" aria-hidden>
                  /
                </span>
              </>
            ) : null}
            <Link to="/map" className="explore-report-nav-link">
              <FaMapMarkedAlt aria-hidden />
              {t("exploreReport.navMap")}
            </Link>
            <span className="explore-report-nav-sep" aria-hidden>
              /
            </span>
            <Link to="/" className="explore-report-nav-link">
              <FaHome aria-hidden />
              {t("exploreReport.navHome")}
            </Link>
          </nav>

          <header className="report-detail-header explore-report-header">
            <p className="report-detail-kicker explore-report-kicker">
              {isOwnReport ? (
                <>
                  <FaClipboardList aria-hidden className="report-detail-kicker-icon" />
                  {t("exploreReport.kickerOwn")}
                </>
              ) : (
                <>
                  <FaGlobe aria-hidden className="report-detail-kicker-icon" />
                  {t("exploreReport.kickerCommunity")}
                </>
              )}
            </p>
            <div className="report-detail-title-row">
              <span className="report-detail-cat-dot" style={{ backgroundColor: cat.color }} title={cat.label} aria-hidden />
              <h1>{cat.label}</h1>
            </div>
            <div className="report-detail-meta">
              <span className={`report-detail-status report-detail-status--${statusClass}`}>{getStatusLabel(report.status)}</span>
              {locationLine ? (
                <span className="report-detail-meta-line">
                  <FaMapMarkerAlt aria-hidden />
                  {locationLine}
                </span>
              ) : null}
              <span className="report-detail-meta-line">
                <FaCalendarAlt aria-hidden />
                {new Date(report.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </header>
        </div>

        <div className="explore-report-body">
          <section className="report-detail-section" aria-labelledby="explore-desc-heading">
            <h2 id="explore-desc-heading" className="report-detail-section-title">
              {t("exploreReport.description")}
            </h2>
            <p className="report-detail-description">{report.description}</p>
          </section>

          <section className="report-detail-section report-detail-callout" aria-labelledby="explore-loc-heading">
            <h2 id="explore-loc-heading" className="report-detail-section-title">
              {t("exploreReport.location")}
            </h2>
            <p className="report-detail-callout-text">{report.locationDescription}</p>
          </section>

          {report.statusNote ? (
            <aside className="report-detail-admin-note" role="note">
              <strong className="report-detail-admin-label">{t("exploreReport.teamNote")}</strong>
              <p className="report-detail-admin-body">{report.statusNote}</p>
            </aside>
          ) : null}

          {report.images?.length > 0 ? (
            <section
              className="report-detail-section"
              aria-label={isOwnReport ? t("exploreReport.uploadsOwn") : t("exploreReport.uploadsPublic")}
            >
              <h2 className="report-detail-section-title">{t("exploreReport.photos")}</h2>
              <div className="report-detail-gallery">
                {report.images.map((src, i) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="report-detail-gallery-item">
                    <img src={src} alt={t("exploreReport.uploadAlt", { index: i + 1 })} loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="explore-report-thread">
            <ReportInteractions reportId={id} afterLoginPath={isOwnReport ? `/reports/${id}` : `/explore/reports/${id}`} />
          </div>
        </div>
      </article>
    </Shell>
  );
}

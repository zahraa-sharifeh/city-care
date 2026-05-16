import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaInbox,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPlusCircle,
} from "react-icons/fa";
import { apiFetch } from "../api/client";
import { resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel, getStatusOptions } from "../utils/statusLabels";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

function statusModifier(status) {
  const s = String(status || "").toLowerCase();
  if (["pending", "in_progress", "resolved", "rejected"].includes(s)) return s;
  return "pending";
}

export default function MyReports() {
  const { t, i18n } = useTranslation();
  const statusOptions = useMemo(() => getStatusOptions(), [i18n.language]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(
    async ({ silent } = {}) => {
      setError("");
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        const res = await apiFetch(`/api/reports/mine?${params.toString()}`);
        setData(res);
      } catch (e) {
        setError(e.message || t("myReports.loadError"));
        if (!silent) setData(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, reloadKey]
  );

  useRefetchOnFocus(load, [page, reloadKey], { pollIntervalMs: 30000 });

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    if (!statusFilter) return items;
    return items.filter(r => r.status === statusFilter);
  }, [data, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0, REJECTED: 0 };
    (data?.items || []).forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return counts;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="my-reports-page">
        <div className="my-reports-card my-reports-card--loading card">
          <p className="report-detail-loading" role="status">
            <span className="report-detail-loading-dot" aria-hidden />
            {t("myReports.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="my-reports-page">
        <div className="my-reports-card card">
          <p className="error">{error}</p>
          <button type="button" className="secondary" onClick={() => setReloadKey(k => k + 1)}>
            {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="my-reports-page">
      <header className="my-reports-hero card">
        <div className="my-reports-hero-main">
          <span className="my-reports-hero-icon" aria-hidden="true">
            <FaClipboardList />
          </span>
          <div>
            <h1>{t("myReports.title")}</h1>
            <p className="muted my-reports-hero-lead">{t("myReports.lead")}</p>
          </div>
        </div>
        <div className="my-reports-hero-actions">
          <div className="my-reports-stats" aria-label="Report counts">
            <div className="my-reports-stat">
              <span className="my-reports-stat-value">{total}</span>
              <span className="my-reports-stat-label">{t("myReports.total")}</span>
            </div>
            <div className="my-reports-stat my-reports-stat--open">
              <span className="my-reports-stat-value">{data?.openCount ?? 0}</span>
              <span className="my-reports-stat-label">{t("myReports.active")}</span>
            </div>
          </div>
          <Link to="/reports/new" className="my-reports-new-btn">
            <FaPlusCircle aria-hidden />
            {t("nav.newReport")}
          </Link>
        </div>
      </header>

      <section className="my-reports-toolbar card" aria-label={t("myReports.filterLabel")}>
        <div className="my-reports-segments" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!statusFilter}
            className={`my-reports-segment${!statusFilter ? " is-active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            {t("common.all")}
          </button>
          {statusOptions.map(option => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === option.value}
              className={`my-reports-segment${statusFilter === option.value ? " is-active" : ""}`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
              {statusCounts[option.value] > 0 ? (
                <span className="my-reports-segment-count">{statusCounts[option.value]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <Link to="/map" className="my-reports-map-link">
          <FaMapMarkedAlt aria-hidden />
          {t("myReports.viewOnMap")}
        </Link>
      </section>

      {error ? <p className="error my-reports-error">{error}</p> : null}

      <div className="my-reports-list">
        {filteredItems.length === 0 ? (
          <div className="my-reports-empty card">
            <FaInbox className="my-reports-empty-icon" aria-hidden />
            <h2>{total === 0 ? t("myReports.emptyNone") : t("myReports.emptyFilter")}</h2>
            <p className="muted">
              {total === 0
                ? t("myReports.emptyNoneHint")
                : statusFilter
                  ? t("myReports.emptyFilterHint", { status: getStatusLabel(statusFilter) })
                  : t("myReports.emptyPageHint")}
            </p>
            {total === 0 ? (
              <Link to="/reports/new" className="my-reports-new-btn my-reports-new-btn--center">
                <FaPlusCircle aria-hidden />
                {t("myReports.createFirst")}
              </Link>
            ) : null}
          </div>
        ) : (
          filteredItems.map(r => {
            const cat = resolveIssueCategory(r.category);
            const statusClass = statusModifier(r.status);
            const locationLine = [r.governorateId?.name, r.districtId?.name].filter(Boolean).join(" · ");
            const snippet = r.description?.trim()
              ? r.description.length > 120
                ? `${r.description.slice(0, 120)}…`
                : r.description
              : null;

            return (
              <Link key={r._id} to={`/reports/${r._id}`} className="my-reports-item card">
                <span className="my-reports-item-dot" style={{ backgroundColor: cat.color }} aria-hidden />
                <div className="my-reports-item-body">
                  <div className="my-reports-item-head">
                    <span className="my-reports-item-category">{cat.label}</span>
                    <span className={`report-detail-status report-detail-status--${statusClass}`}>
                      {getStatusLabel(r.status)}
                    </span>
                  </div>
                  {snippet ? <p className="my-reports-item-snippet">{snippet}</p> : null}
                  <div className="my-reports-item-meta">
                    {locationLine ? (
                      <span className="my-reports-item-meta-line">
                        <FaMapMarkerAlt aria-hidden />
                        {locationLine}
                      </span>
                    ) : null}
                    <span className="my-reports-item-meta-line">
                      <FaCalendarAlt aria-hidden />
                      {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
                <FaChevronRight className="my-reports-item-chevron" aria-hidden />
              </Link>
            );
          })
        )}
      </div>

      {pages > 1 ? (
        <nav className="my-reports-pagination card" aria-label="Report pages">
          <button
            type="button"
            className="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <FaChevronLeft aria-hidden />
            {t("common.previous")}
          </button>
          <span className="muted my-reports-page-label">
            {t("common.pageOf", { page, pages })}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={page >= pages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            {t("common.next")}
            <FaChevronRight aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

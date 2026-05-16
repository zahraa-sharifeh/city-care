import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaCalendarAlt,
  FaChartBar,
  FaChartLine,
  FaClipboardList,
  FaFolderOpen,
  FaLayerGroup,
  FaSyncAlt,
} from "react-icons/fa";
import { apiFetch } from "../api/client";
import { getCategoryLabelFromValue, resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel } from "../utils/statusLabels";
import { getPriorityLabel } from "../utils/priorityLabels";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

function barToneClass(kind, key) {
  const k = String(key || "").toUpperCase();
  if (kind === "status") {
    if (k === "PENDING") return "analytics-fill--pending";
    if (k === "IN_PROGRESS") return "analytics-fill--in-progress";
    if (k === "RESOLVED") return "analytics-fill--resolved";
    if (k === "REJECTED") return "analytics-fill--rejected";
    return "analytics-fill--default";
  }
  if (kind === "priority") {
    if (k === "LOW") return "analytics-fill--priority-low";
    if (k === "MEDIUM") return "analytics-fill--priority-medium";
    if (k === "HIGH") return "analytics-fill--priority-high";
    if (k === "CRITICAL") return "analytics-fill--priority-critical";
    return "analytics-fill--default";
  }
  if (kind === "duplicate") {
    if (k === "CONFIRMED_DUPLICATE") return "analytics-fill--dup-confirmed";
    if (k === "NOT_DUPLICATE") return "analytics-fill--dup-clear";
    return "analytics-fill--dup-pending";
  }
  return "analytics-fill--default";
}

function KpiCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="analytics-kpi-card">
      <span className="analytics-kpi-icon" aria-hidden>
        <Icon />
      </span>
      <div className="analytics-kpi-body">
        <span className="analytics-kpi-label">{label}</span>
        <strong className="analytics-kpi-value">{value}</strong>
        {hint ? <span className="analytics-kpi-hint">{hint}</span> : null}
      </div>
    </article>
  );
}

function BarList({ title, icon: Icon, items, total, labelFn = key => key, noDataLabel, toneKind = "default" }) {
  return (
    <section className="card analytics-panel">
      <div className="analytics-panel-head">
        {Icon ? <Icon aria-hidden /> : null}
        <h2>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="muted analytics-empty">{noDataLabel}</p>
      ) : (
        <ul className="analytics-bars">
          {items.map(item => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li key={`${title}-${item.key}`} className="analytics-bar-row">
                <div className="analytics-bar-head">
                  <span className="analytics-bar-label">{labelFn(item.key)}</span>
                  <span className="analytics-bar-meta">
                    <strong>{item.count}</strong>
                    <span className="analytics-bar-pct">{pct}%</span>
                  </span>
                </div>
                <div className="analytics-track">
                  <div
                    className={`analytics-fill ${barToneClass(toneKind, item.key)}`}
                    style={{ width: `${Math.max(pct > 0 ? 4 : 0, pct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CategoryTable({ items, total, getCategoryLabel, categoryColLabel, noDataLabel, countLabel, shareLabel }) {
  if (!items.length) {
    return <p className="muted analytics-empty">{noDataLabel}</p>;
  }

  return (
    <div className="table-wrap analytics-category-table">
      <table>
        <thead>
          <tr>
            <th>{categoryColLabel}</th>
            <th>{countLabel}</th>
            <th>{shareLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const cat = resolveIssueCategory(item.key);
            return (
              <tr key={item.key}>
                <td>
                  <span className="analytics-category-name">
                    <span className="analytics-category-dot" style={{ backgroundColor: cat.color }} aria-hidden />
                    {getCategoryLabel(item.key)}
                  </span>
                </td>
                <td className="analytics-category-count">{item.count}</td>
                <td>
                  <div className="analytics-category-share">
                    <div className="analytics-track analytics-track--inline">
                      <div
                        className="analytics-fill analytics-fill--category"
                        style={{ width: `${Math.max(4, pct)}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="analytics-category-pct">{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DailyTrendChart({ items, trendMax, noDataLabel, dateLocale }) {
  if (!items.length) {
    return <p className="muted analytics-empty">{noDataLabel}</p>;
  }

  return (
    <div className="analytics-trend-wrap">
      <div className="analytics-trend" role="img" aria-label="Daily submissions">
        {items.map(item => {
          const height = trendMax > 0 ? Math.round((item.count / trendMax) * 100) : 0;
          const label = item.date.slice(5);
          return (
            <div key={item.date} className="analytics-trend-item" title={`${item.date}: ${item.count}`}>
              <span className="analytics-trend-count">{item.count}</span>
              <div className="analytics-trend-bar" style={{ height: `${Math.max(8, height)}%` }} />
              <time dateTime={item.date}>
                {new Date(`${item.date}T12:00:00`).toLocaleDateString(dateLocale, {
                  month: "short",
                  day: "numeric",
                }) || label}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateLocale = i18n.language === "ar" ? "ar-LB" : undefined;

  function toDuplicateLabel(key) {
    if (key === "CONFIRMED_DUPLICATE") return t("analytics.duplicateConfirmed");
    if (key === "NOT_DUPLICATE") return t("analytics.duplicateNot");
    return t("analytics.duplicatePending");
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const query = params.toString();
      const res = await apiFetch(`/api/admin/analytics${query ? `?${query}` : ""}`);
      setData(res);
    } catch (e) {
      setError(e.message || t("analytics.loadError"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendMax = useMemo(() => {
    const values = (data?.dailyTrend || []).map(item => item.count);
    return values.length ? Math.max(...values) : 0;
  }, [data]);

  const categoryLabel = useMemo(() => key => getCategoryLabelFromValue(key), [i18n.language]);

  const topCategoryLabel = data?.categoryBreakdown?.[0]?.key
    ? getCategoryLabelFromValue(data.categoryBreakdown[0].key)
    : "—";

  const openCount = useMemo(() => {
    if (!data?.statusBreakdown) return 0;
    return data.statusBreakdown
      .filter(item => item.key === "PENDING" || item.key === "IN_PROGRESS")
      .reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const periodHint =
    dateFrom || dateTo
      ? [dateFrom, dateTo].filter(Boolean).join(" → ")
      : t("analytics.allTime");

  return (
    <div className="analytics-page">
      <header className="card analytics-hero">
        <div className="analytics-hero-text">
          <p className="analytics-eyebrow">
            <FaChartBar aria-hidden />
            {t("nav.analytics")}
          </p>
          <h1>{t("analytics.title")}</h1>
          <p className="analytics-lead">{t("analytics.lead")}</p>
        </div>

        <form
          className="analytics-filters"
          onSubmit={handleFormSubmit(() => {
            load();
          })}
        >
          <div className="analytics-filter-field">
            <label htmlFor="dateFrom">
              <FaCalendarAlt aria-hidden />
              {t("analytics.dateFrom")}
            </label>
            <input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="analytics-filter-field">
            <label htmlFor="dateTo">
              <FaCalendarAlt aria-hidden />
              {t("analytics.dateTo")}
            </label>
            <input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="analytics-filter-actions">
            <button type="submit" className="analytics-apply-btn" disabled={loading}>
              <FaSyncAlt aria-hidden className={loading ? "analytics-spin" : undefined} />
              {loading ? t("analytics.loading") : t("common.apply")}
            </button>
          </div>
        </form>

        {error ? <p className="error analytics-error">{error}</p> : null}
      </header>

      {loading && !data ? (
        <div className="card analytics-loading">
          <p className="muted" role="status">
            {t("analytics.loading")}
          </p>
        </div>
      ) : null}

      {!loading && data ? (
        <>
          <div className="analytics-kpi-grid">
            <KpiCard icon={FaClipboardList} label={t("analytics.totalReports")} value={data.total} hint={periodHint} />
            <KpiCard icon={FaLayerGroup} label={t("analytics.topCategory")} value={topCategoryLabel} />
            <KpiCard icon={FaFolderOpen} label={t("analytics.openReports")} value={openCount} />
          </div>

          <div className="analytics-grid">
            <BarList
              title={t("analytics.byStatus")}
              icon={FaChartBar}
              items={data.statusBreakdown || []}
              total={data.total || 0}
              labelFn={getStatusLabel}
              noDataLabel={t("analytics.noData")}
              toneKind="status"
            />
            <BarList
              title={t("analytics.byPriority")}
              icon={FaLayerGroup}
              items={data.priorityBreakdown || []}
              total={data.total || 0}
              labelFn={getPriorityLabel}
              noDataLabel={t("analytics.noData")}
              toneKind="priority"
            />
            <BarList
              title={t("analytics.duplicateReview")}
              icon={FaClipboardList}
              items={data.duplicateBreakdown || []}
              total={data.total || 0}
              labelFn={toDuplicateLabel}
              noDataLabel={t("analytics.noData")}
              toneKind="duplicate"
            />
          </div>

          <section className="card analytics-panel analytics-panel--wide">
            <div className="analytics-panel-head">
              <FaLayerGroup aria-hidden />
              <h2>{t("analytics.topCategories")}</h2>
            </div>
            <CategoryTable
              items={data.categoryBreakdown || []}
              total={data.total || 0}
              getCategoryLabel={categoryLabel}
              categoryColLabel={t("common.category")}
              noDataLabel={t("analytics.noData")}
              countLabel={t("analytics.count")}
              shareLabel={t("analytics.share")}
            />
          </section>

          <section className="card analytics-panel analytics-panel--wide">
            <div className="analytics-panel-head">
              <FaChartLine aria-hidden />
              <h2>{t("analytics.dailyTrend")}</h2>
            </div>
            <DailyTrendChart
              items={data.dailyTrend || []}
              trendMax={trendMax}
              noDataLabel={t("analytics.noDataInPeriod")}
              dateLocale={dateLocale}
            />
          </section>
        </>
      ) : null}

      {!loading && !data && !error ? (
        <div className="card analytics-loading">
          <p className="muted">{t("analytics.noData")}</p>
        </div>
      ) : null}
    </div>
  );
}

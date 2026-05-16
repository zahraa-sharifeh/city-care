import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaHourglassHalf,
  FaLandmark,
  FaMapMarkerAlt,
  FaMonument,
  FaPlusCircle,
  FaTag,
  FaTasks,
} from "react-icons/fa";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { resolveIssueCategory } from "../constants/issueCategories";
import CitizenTopBar from "../components/CitizenTopBar";
import "../App.css";

function formatWhen(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function DiscoverShell({ children }) {
  return (
    <div className="app-shell discover-shell">
      <CitizenTopBar />
      <main className="main discover-main discover-page">{children}</main>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }) {
  return (
    <div className={`discover-metric discover-metric--${accent}`}>
      <span className="discover-metric-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="discover-metric-body">
        <span className="discover-metric-label">{label}</span>
        <strong className="discover-metric-value">{value}</strong>
      </div>
    </div>
  );
}

export default function DistrictDiscover() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [spotlight, setSpotlight] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const govs = await apiFetch("/api/governorates");
        if (!cancelled) setGovernorates(govs || []);
      } catch {
        if (!cancelled) setGovernorates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const uDist = user?.districtId;
    if (!uDist || typeof uDist !== "object") return;
    const gId = uDist.governorateId?._id || uDist.governorateId;
    if (gId) setGovernorateId(String(gId));
    if (uDist._id) setDistrictId(String(uDist._id));
  }, [user]);

  useEffect(() => {
    if (!governorateId) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(governorateId)}`);
        if (!cancelled) setDistricts(list || []);
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [governorateId]);

  useEffect(() => {
    if (!districtId) {
      setSpotlight(null);
      setDashboard(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [spotlightData, dashboardData] = await Promise.all([
          apiFetch(`/api/districts/${districtId}/spotlight`),
          apiFetch(`/api/districts/${districtId}/dashboard`),
        ]);
        if (!cancelled) {
          setSpotlight(spotlightData);
          setDashboard(dashboardData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || t("discover.loadError"));
          setSpotlight(null);
          setDashboard(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [districtId, reloadTick, t]);

  const hasSpotlightBody =
    spotlight &&
    ((spotlight.essay && spotlight.essay.trim()) ||
      (spotlight.heritageInfo && spotlight.heritageInfo.trim()) ||
      (spotlight.events && spotlight.events.some(e => e.title)));

  const topCategory = dashboard?.topCategories?.[0];
  const topCategoryMeta = topCategory ? resolveIssueCategory(topCategory.key) : null;

  return (
    <DiscoverShell>
      <header className="discover-hero card">
        <div className="discover-hero-main">
          <span className="discover-hero-icon" aria-hidden="true">
            <FaLandmark />
          </span>
          <div>
            <h1>{t("discover.title")}</h1>
            <p className="muted discover-hero-lead">{t("discover.lead")}</p>
          </div>
        </div>
      </header>

      <section className="discover-filters card" aria-label={t("discover.filtersAriaLabel")}>
        <h2 className="discover-section-title">
          <FaMapMarkerAlt aria-hidden />
          {t("discover.selectArea")}
        </h2>
        <div className="discover-toolbar discover-filters-grid">
          <div className="discover-field">
            <label htmlFor="d-gov">{t("common.governorate")}</label>
            <select
              id="d-gov"
              value={governorateId}
              onChange={e => {
                setGovernorateId(e.target.value);
                setDistrictId("");
              }}
            >
              <option value="">{t("common.chooseGovernorate")}</option>
              {governorates.map(g => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="discover-field">
            <label htmlFor="d-dist">{t("common.district")}</label>
            <select
              id="d-dist"
              value={districtId}
              disabled={!governorateId}
              onChange={e => setDistrictId(e.target.value)}
            >
              <option value="">
                {governorateId ? t("common.chooseDistrict") : t("common.selectGovernorateFirst")}
              </option>
              {districts.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {!districtId ? (
        <div className="discover-empty card">
          <FaLandmark className="discover-empty-icon" aria-hidden />
          <h2>{t("discover.chooseDistrictTitle")}</h2>
          <p className="muted">{t("discover.chooseDistrictHint")}</p>
        </div>
      ) : loading ? (
        <div className="discover-loading card">
          <p className="report-detail-loading" role="status">
            <span className="report-detail-loading-dot" aria-hidden />
            {t("discover.loading")}
          </p>
        </div>
      ) : error ? (
        <div className="discover-error card">
          <p className="error">{error}</p>
          <button type="button" className="secondary" onClick={() => setReloadTick(tick => tick + 1)}>
            {t("common.tryAgain")}
          </button>
        </div>
      ) : (
        <>
          <div className="discover-district-banner card">
            <span className="discover-district-badge" aria-hidden="true">
              <FaLandmark />
            </span>
            <div>
              <p className="discover-district-kicker">{t("discover.nowViewing")}</p>
              <h2 className="discover-district-name">
                {spotlight?.districtName || t("common.district")}
                <span className="discover-district-region">
                  {spotlight?.governorateName ? ` · ${spotlight.governorateName}` : ""}
                </span>
              </h2>
            </div>
          </div>

          {dashboard ? (
            <section className="discover-panel card" aria-labelledby="discover-pulse-heading">
              <div className="discover-panel-head">
                <span className="discover-panel-icon discover-panel-icon--pulse" aria-hidden="true">
                  <FaChartLine />
                </span>
                <h2 id="discover-pulse-heading">{t("discover.districtPulse")}</h2>
              </div>
              <p className="muted discover-panel-lead">{t("discover.pulseLead")}</p>
              <div className="discover-metrics">
                <MetricCard
                  icon={<FaTasks />}
                  label={t("discover.totalReports")}
                  value={dashboard.totalReports ?? 0}
                  accent="sky"
                />
                <MetricCard
                  icon={<FaHourglassHalf />}
                  label={t("discover.openReports")}
                  value={dashboard.openReports ?? 0}
                  accent="amber"
                />
                <MetricCard
                  icon={<FaCheckCircle />}
                  label={t("discover.resolved")}
                  value={dashboard.resolvedReports ?? 0}
                  accent="sage"
                />
                <MetricCard
                  icon={<FaChartLine />}
                  label={t("discover.last30Days")}
                  value={dashboard.recentCreated30Days ?? 0}
                  accent="sky"
                />
                <MetricCard
                  icon={<FaClock />}
                  label={t("discover.avgResolve")}
                  value={
                    dashboard.avgResolutionDays != null
                      ? t("discover.avgResolveDays", { count: dashboard.avgResolutionDays })
                      : "—"
                  }
                  accent="lavender"
                />
                <MetricCard
                  icon={<FaTag />}
                  label={t("discover.topIssue")}
                  value={topCategoryMeta?.label || topCategory?.key || "—"}
                  accent="peach"
                />
              </div>
              {topCategoryMeta ? (
                <p className="discover-top-category-hint muted">
                  <span
                    className="discover-top-category-dot"
                    style={{ backgroundColor: topCategoryMeta.color }}
                    aria-hidden
                  />
                  {t("discover.categoryCount", { count: topCategory.count })}
                </p>
              ) : null}
            </section>
          ) : null}

          {!hasSpotlightBody ? (
            <section className="discover-panel card" aria-labelledby="discover-story-heading">
              <div className="discover-panel-head">
                <span className="discover-panel-icon discover-panel-icon--story" aria-hidden="true">
                  <FaBookOpen />
                </span>
                <h2 id="discover-story-heading">{t("discover.districtStory")}</h2>
              </div>
              <p className="muted discover-empty-copy">
                {t("discover.noSpotlight", { name: spotlight?.districtName })}
              </p>
            </section>
          ) : null}

          {spotlight?.essay?.trim() ? (
            <section className="discover-panel card" aria-labelledby="discover-essay-heading">
              <div className="discover-panel-head">
                <span className="discover-panel-icon discover-panel-icon--story" aria-hidden="true">
                  <FaBookOpen />
                </span>
                <h2 id="discover-essay-heading">{t("discover.districtStory")}</h2>
              </div>
              <div className="discover-prose">{spotlight.essay.trim()}</div>
            </section>
          ) : null}

          {spotlight?.heritageInfo?.trim() ? (
            <section className="discover-panel card" aria-labelledby="discover-heritage-heading">
              <div className="discover-panel-head">
                <span className="discover-panel-icon discover-panel-icon--heritage" aria-hidden="true">
                  <FaMonument />
                </span>
                <h2 id="discover-heritage-heading">{t("discover.heritage")}</h2>
              </div>
              <div className="discover-prose">{spotlight.heritageInfo.trim()}</div>
            </section>
          ) : null}

          {spotlight?.events?.some(e => e.title) ? (
            <section className="discover-panel card" aria-labelledby="discover-events-heading">
              <div className="discover-panel-head">
                <span className="discover-panel-icon discover-panel-icon--events" aria-hidden="true">
                  <FaCalendarAlt />
                </span>
                <h2 id="discover-events-heading">{t("discover.events")}</h2>
              </div>
              <ul className="discover-events">
                {(spotlight.events || [])
                  .filter(e => e.title)
                  .map(e => (
                    <li key={e._id || `${e.title}-${e.startsAt}`} className="discover-event-item">
                      <div className="discover-event-title">{e.title}</div>
                      {e.summary ? <p className="muted discover-event-sum">{e.summary}</p> : null}
                      <div className="discover-event-meta">
                        {formatWhen(e.startsAt) ? (
                          <span className="discover-event-meta-pill">
                            <FaCalendarAlt aria-hidden />
                            {formatWhen(e.startsAt)}
                          </span>
                        ) : null}
                        {e.venue ? <span className="discover-event-meta-pill">{e.venue}</span> : null}
                        {e.url ? (
                          <a href={e.url} target="_blank" rel="noopener noreferrer" className="discover-event-link">
                            <FaExternalLinkAlt aria-hidden />
                            {t("discover.eventMoreInfo")}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          <footer className="discover-cta card">
            <p className="discover-cta-text">{t("discover.reportCta")}</p>
            <Link to="/reports/new" className="discover-cta-btn">
              <FaPlusCircle aria-hidden />
              {t("discover.reportIssue")}
            </Link>
          </footer>
        </>
      )}
    </DiscoverShell>
  );
}

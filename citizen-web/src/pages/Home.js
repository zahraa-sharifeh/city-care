import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  FaBullhorn,
  FaClipboardList,
  FaLeaf,
  FaMapMarkedAlt,
  FaTasks,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getToken } from "../api/client";
import CitizenTopBar from "../components/CitizenTopBar";
import CommunityFiltersPanel from "../components/CommunityFiltersPanel";
import { resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel } from "../utils/statusLabels";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";

function FeatureCard({ title, text, icon, accent }) {
  return (
    <article className={`feature-card feature-card--${accent}`}>
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const features = [
    {
      title: t("home.featureQuickTitle"),
      text: t("home.featureQuickText"),
      icon: <FaBullhorn aria-hidden />,
      accent: "sky",
    },
    {
      title: t("home.featureTrackTitle"),
      text: t("home.featureTrackText"),
      icon: <FaTasks aria-hidden />,
      accent: "sage",
    },
    {
      title: t("home.featureCleanTitle"),
      text: t("home.featureCleanText"),
      icon: <FaLeaf aria-hidden />,
      accent: "peach",
    },
  ];
  const isAuthenticated = Boolean(getToken() && user);
  const [community, setCommunity] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/governorates");
        if (!cancelled) setGovernorates(data || []);
      } catch {
        if (!cancelled) setGovernorates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!governorateId) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(governorateId)}`);
        if (!cancelled) setDistricts(data || []);
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [governorateId]);

  const loadCommunity = useCallback(
    async ({ silent } = {}) => {
      if (!silent) {
        setFeedError("");
        setFeedLoading(true);
      }
      try {
        const params = new URLSearchParams({ limit: "12", page: "1" });
        if (districtId) params.set("districtId", districtId);
        else if (governorateId) params.set("governorateId", governorateId);
        if (categoryFilter) params.set("category", categoryFilter);
        params.set("sort", sortOrder === "oldest" ? "oldest" : "recent");

        const data = await apiFetch(`/api/reports/public?${params.toString()}`);
        setCommunity(data?.items || []);
        setFeedError("");
      } catch (e) {
        setFeedError(e.message || t("home.feedError"));
        if (!silent) setCommunity([]);
      } finally {
        if (!silent) setFeedLoading(false);
      }
    },
    [governorateId, districtId, categoryFilter, sortOrder, t]
  );

  useRefetchOnFocus(loadCommunity, [governorateId, districtId, categoryFilter, sortOrder]);

  function clearCommunityFilters() {
    setGovernorateId("");
    setDistrictId("");
    setCategoryFilter("");
    setSortOrder("recent");
  }

  const filtersPanel = (
    <CommunityFiltersPanel
      idPrefix="home"
      loading={feedLoading}
      governorateId={governorateId}
      districtId={districtId}
      categoryFilter={categoryFilter}
      sortOrder={sortOrder}
      governorates={governorates}
      districts={districts}
      onGovernorateChange={value => {
        setGovernorateId(value);
        setDistrictId("");
      }}
      onDistrictChange={setDistrictId}
      onCategoryChange={setCategoryFilter}
      onSortChange={setSortOrder}
      onClear={clearCommunityFilters}
      secondaryLink={{ to: "/map", label: t("home.mapViewLink"), icon: <FaMapMarkedAlt aria-hidden /> }}
    />
  );

  return (
    <div className="app-shell home-shell">
      <CitizenTopBar />
      <div className="home-page">
        <div className="home-upper">
          <div className="home-upper-inner">
          <section className="hero-card">
            <div className="hero-card-decor" aria-hidden="true">
              <span className="hero-blob hero-blob--sky" />
              <span className="hero-blob hero-blob--sage" />
              <span className="hero-blob hero-blob--peach" />
            </div>
            <div className="hero-card-body">
              <p className="hero-kicker">
                <FaLeaf aria-hidden /> {t("home.heroKicker")}
              </p>
              <h1>{t("home.heroTitle")}</h1>
              <p className="hero-lead">{t("home.heroLead")}</p>
              <div className="hero-actions">
                <Link to={isAuthenticated ? "/reports/new" : "/register"} className="btn-primary">
                  <FaBullhorn aria-hidden /> {isAuthenticated ? t("home.heroReport") : t("home.heroGetStarted")}
                </Link>
                <Link to={isAuthenticated ? "/reports" : "/login"} className="btn-ghost">
                  {isAuthenticated ? (
                    <>
                      <FaClipboardList aria-hidden /> {t("home.heroMyReports")}
                    </>
                  ) : (
                    t("home.heroHaveAccount")
                  )}
                </Link>
              </div>
            </div>
          </section>

          <section className="features-grid" aria-label={t("home.featuresAriaLabel")}>
            {features.map(feature => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </section>
          </div>
        </div>

        <div className="home-reports">
        <main className="home-content home-content-reports">
          <section className="home-community" aria-label={t("home.communityTitle")}>
          <h2 className="home-community-title">{t("home.communityTitle")}</h2>
          <p className="muted home-community-lead">{t("home.communityLead")}</p>
          {filtersPanel}
          {feedLoading ? <p className="muted community-feed-status">{t("home.feedUpdating")}</p> : null}
          {feedError ? <p className="error">{feedError}</p> : null}
          {!feedLoading && !feedError && community.length === 0 ? (
            <p className="muted">
              {governorateId || districtId || categoryFilter ? t("home.feedNoMatch") : t("home.feedEmptyPublic")}
            </p>
          ) : null}
          {!feedLoading && community.length > 0 ? (
            <ul className="home-community-grid">
              {community.map(r => {
                const cat = resolveIssueCategory(r.category);
                return (
                  <li key={r._id} className="home-community-card">
                    <Link to={`/explore/reports/${r._id}`} className="home-community-card-link">
                      <span className="home-community-dot" style={{ backgroundColor: cat.color }} aria-hidden />
                      <span className="home-community-card-title">{cat.label}</span>
                      <span className="badge home-community-badge">{getStatusLabel(r.status)}</span>
                      <span className="muted home-community-meta">
                        {r.districtId?.name || t("home.districtFallback")} ? {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <span className="home-community-snippet">{r.description}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
          </section>
        </main>
        </div>
      </div>
    </div>
  );
}

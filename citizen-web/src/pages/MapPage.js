import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/client";
import CitizenTopBar from "../components/CitizenTopBar";
import CommunityFiltersPanel from "../components/CommunityFiltersPanel";
import { resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel } from "../utils/statusLabels";
import { fitMapToPoints, getLebanonMapOptions, isInLebanon } from "../utils/lebanonMap";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

function normalizeCoordinates(rawLat, rawLng) {
  let lat = Number(rawLat);
  let lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const tmp = lat;
    lat = lng;
    lng = tmp;
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function parsePoints(items) {
  return (items || [])
    .map(r => {
      const c = r.location?.coordinates;
      if (!Array.isArray(c) || c.length < 2) return null;
      const normalized = normalizeCoordinates(c[1], c[0]);
      if (!normalized) return null;
      const categoryMeta = resolveIssueCategory(r.category);
      return {
        id: r._id,
        lat: normalized.lat,
        lng: normalized.lng,
        category: categoryMeta.value,
        categoryLabel: categoryMeta.label,
        color: categoryMeta.color,
        status: r.status || "",
      };
    })
    .filter(Boolean);
}

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  const loadPoints = useCallback(
    async ({ silent } = {}) => {
      if (!silent) {
        setError("");
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({ limit: "350", page: "1" });
        if (districtId) params.set("districtId", districtId);
        else if (governorateId) params.set("governorateId", governorateId);
        if (categoryFilter) params.set("category", categoryFilter);
        params.set("sort", sortOrder === "oldest" ? "oldest" : "recent");

        const data = await apiFetch(`/api/reports/public?${params.toString()}`);
        setPoints(parsePoints(data.items));
        setError("");
      } catch (e) {
        setError(e.message || t("map.loadError"));
        if (!silent) setPoints([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [governorateId, districtId, categoryFilter, sortOrder, t]
  );

  useRefetchOnFocus(loadPoints, [governorateId, districtId, categoryFilter, sortOrder]);

  function clearFilters() {
    setGovernorateId("");
    setDistrictId("");
    setCategoryFilter("");
    setSortOrder("recent");
  }

  const filtersPanel = (
    <CommunityFiltersPanel
      idPrefix="map"
      loading={loading}
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
      onClear={clearFilters}
      secondaryLink={{ to: "/", label: t("map.homeFeedLink"), icon: <FaHome aria-hidden /> }}
    />
  );

  useEffect(() => {
    if (points === null) return;
    const el = mapElRef.current;
    if (!el) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(el, getLebanonMapOptions({ zoomControl: true }));
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);

    const lebanonPoints = points.filter(p => isInLebanon(p.lat, p.lng));

    lebanonPoints.forEach(p => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 10,
        weight: 2.5,
        color: "#ffffff",
        fillColor: p.color,
        fillOpacity: 0.98,
      });
      marker.bindTooltip(`${p.categoryLabel}${p.status ? ` · ${getStatusLabel(p.status)}` : ""}`, {
        direction: "top",
        offset: [0, -8],
      });
      marker.bindPopup(
        `<strong>${p.categoryLabel}</strong><br/>${getStatusLabel(p.status)}<br/>${t("map.popupCoords", {
          lat: p.lat.toFixed(6),
          lng: p.lng.toFixed(6),
        })}`
      );
      marker.on("click", () => {
        navigate(`/explore/reports/${p.id}`);
      });
      marker.addTo(layer);
    });

    fitMapToPoints(map, lebanonPoints, { padding: [48, 48], maxZoom: 14 });

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [points, navigate, t, i18n.language]);

  if (points === null) {
    return (
      <div className="app-shell map-shell">
        <CitizenTopBar />
        <main className="main map-page-full map-page-loading">
          <section className="map-page-header">
            <h1>{t("map.title")}</h1>
            <p className="muted map-page-lead">{t("map.leadInitial")}</p>
            {filtersPanel}
            <p className="muted community-feed-status">{loading ? t("map.loading") : null}</p>
            {error ? <p className="error">{error}</p> : null}
          </section>
          <div ref={mapElRef} className="map-canvas map-canvas-full" role="application" aria-label={t("map.ariaLabel")} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell map-shell">
      <CitizenTopBar />
      <main className="main map-page-full">
        <section className="map-page-header">
          <h1>{t("map.title")}</h1>
          <p className="muted map-page-lead">{t("map.leadLoaded")}</p>
          {filtersPanel}
          {loading ? <p className="muted community-feed-status">{t("map.updating")}</p> : null}
          {!loading && points.length > 0 ? (
            <p className="muted map-results-count">{t("map.resultsCount", { count: points.length })}</p>
          ) : null}
          {error ? <p className="error">{error}</p> : null}
          {!error && !loading && points.length === 0 ? <p className="muted">{t("map.noResults")}</p> : null}
        </section>
        <div ref={mapElRef} className="map-canvas map-canvas-full" role="application" aria-label={t("map.ariaLabel")} />
      </main>
    </div>
  );
}

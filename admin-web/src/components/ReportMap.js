import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  clampLatLngPair,
  fitMapToPoints,
  getLebanonMapOptions,
  isInLebanon,
  LEBANON_CENTER,
  LEBANON_DEFAULT_ZOOM,
} from "../utils/lebanonMap";
import { getCategoryLabelFromValue } from "../constants/issueCategories";
import { getStatusLabel } from "../utils/statusLabels";

function toPoint(report, defaultCategory) {
  const coords = report?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const status = report.status ? getStatusLabel(report.status) : "";
  const category = report.category ? getCategoryLabelFromValue(report.category) : defaultCategory;
  return { id: report._id, lat, lng, category, status };
}

export default function ReportMap({
  reports = [],
  height = 360,
  onOpenReport,
  scrollWheelZoom = false,
  className = "map-canvas",
}) {
  const { t, i18n } = useTranslation();
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const defaultCategory = t("map.defaultCategory");
  const noStatus = t("map.noStatus");

  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, getLebanonMapOptions({ zoomControl: true, scrollWheelZoom })).setView(
      LEBANON_CENTER,
      LEBANON_DEFAULT_ZOOM
    );
    if (!scrollWheelZoom) {
      map.scrollWheelZoom.disable();
      L.DomEvent.disableScrollPropagation(el);
    }
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = reports.map(r => toPoint(r, defaultCategory)).filter(Boolean);
    const layer = L.layerGroup().addTo(map);

    const lebanonPoints = points
      .map(point => {
        if (!isInLebanon(point.lat, point.lng)) return null;
        const [lat, lng] = clampLatLngPair([point.lat, point.lng]);
        return { ...point, lat, lng };
      })
      .filter(Boolean);

    lebanonPoints.forEach(point => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        weight: 2,
        color: "#ffffff",
        fillColor: "#2d6a4f",
        fillOpacity: 0.95,
      });
      marker.bindTooltip(`${point.category}${point.status ? ` · ${point.status}` : ""}`, { direction: "top", offset: [0, -8] });
      marker.bindPopup(`<strong>${point.category}</strong><br/>${point.status || noStatus}`);
      if (onOpenReport) {
        marker.on("click", () => onOpenReport(point.id));
      }
      marker.addTo(layer);
    });

    fitMapToPoints(map, lebanonPoints, { padding: [30, 30], maxZoom: 14 });

    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(timer);
      layer.remove();
    };
  }, [reports, onOpenReport, defaultCategory, noStatus, i18n.language]);

  return (
    <div
      ref={mapElRef}
      className={className}
      style={{ height }}
      role="application"
      aria-label={t("map.ariaLabel")}
    />
  );
}

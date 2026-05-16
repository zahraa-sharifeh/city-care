import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaBullhorn,
  FaCamera,
  FaClipboardList,
  FaExclamationTriangle,
  FaLocationArrow,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPlusCircle,
} from "react-icons/fa";
import { apiFetch, getToken } from "../api/client";
import DownwardSelect, { isPlaceholderOption, withLeadingPlaceholderOption } from "../components/DownwardSelect";
import { getIssueCategorySelectOptions, resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel } from "../utils/statusLabels";
import {
  clampLatLng,
  getLebanonMapOptions,
  isInLebanon,
  LEBANON_CENTER,
} from "../utils/lebanonMap";
import { clearFormDraft, readFormDraft, writeFormDraft } from "../utils/formDraft";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

const CREATE_REPORT_DRAFT_KEY = "citycare:create-report-draft";

function loadCreateReportDraft() {
  const draft = readFormDraft(CREATE_REPORT_DRAFT_KEY);
  if (!draft) return null;
  return {
    category: typeof draft.category === "string" ? draft.category : "",
    description: typeof draft.description === "string" ? draft.description : "",
    locationDescription: typeof draft.locationDescription === "string" ? draft.locationDescription : "",
    governorateId: typeof draft.governorateId === "string" ? draft.governorateId : "",
    districtId: typeof draft.districtId === "string" ? draft.districtId : "",
    lat: typeof draft.lat === "string" ? draft.lat : String(LEBANON_CENTER[0]),
    lng: typeof draft.lng === "string" ? draft.lng : String(LEBANON_CENTER[1]),
  };
}

const [DEFAULT_LAT, DEFAULT_LNG] = LEBANON_CENTER;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function geocodeQuery(query) {
  const data = await apiFetch(`/api/location/search?q=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : [];
}

/** Custom draggable pin for the create-report map (clear tip + anchor at ground point). */
function createReportMapIcon() {
  const w = 44;
  const h = 56;
  const ax = Math.round(w / 2);
  return L.divIcon({
    className: "report-map-marker",
    html: `<div class="report-map-marker-svg" aria-hidden="true">
      <svg width="${w}" height="${h}" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="22" cy="51" rx="9" ry="3.5" fill="var(--c-ink)" fill-opacity="0.18"/>
        <path
          class="report-map-marker-shell"
          d="M22 4C13.82 4 7.25 10.57 7.25 18.75c0 11.2 14.75 29.25 14.75 29.25S36.75 29.95 36.75 18.75C36.75 10.57 30.18 4 22 4z"
          fill="var(--c-accent)"
          stroke="#fff"
          stroke-width="2.25"
        />
        <circle cx="22" cy="18.5" r="5.25" fill="#fff" fill-opacity="0.95"/>
        <circle cx="22" cy="18.5" r="2.35" fill="var(--c-accent)" fill-opacity="0.35"/>
      </svg>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [ax, h - 2],
    popupAnchor: [0, -h + 8],
  });
}

export default function CreateReport() {
  const { t, i18n } = useTranslation();
  const categoryOptions = useMemo(() => getIssueCategorySelectOptions(), [i18n.language]);
  const navigate = useNavigate();
  const savedDraft = loadCreateReportDraft();
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const suppressDistrictGeocodeUntilRef = useRef(savedDraft ? Date.now() + 10000 : 0);
  const coordsLookupTimerRef = useRef(null);
  const scheduleAdminFromPinRef = useRef(() => {});
  const [draftRestored, setDraftRestored] = useState(Boolean(savedDraft));
  const [category, setCategory] = useState(savedDraft?.category ?? "");
  const [description, setDescription] = useState(savedDraft?.description ?? "");
  const [locationDescription, setLocationDescription] = useState(savedDraft?.locationDescription ?? "");
  const [governorateId, setGovernorateId] = useState(savedDraft?.governorateId ?? "");
  const [districtId, setDistrictId] = useState(savedDraft?.districtId ?? "");
  const [lat, setLat] = useState(savedDraft?.lat ?? String(DEFAULT_LAT));
  const [lng, setLng] = useState(savedDraft?.lng ?? String(DEFAULT_LNG));
  const [files, setFiles] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [nearbyItems, setNearbyItems] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [coordsMatchError, setCoordsMatchError] = useState("");
  const [coordsLookupLoading, setCoordsLookupLoading] = useState(false);

  const applyAdminFromCoordinates = useCallback(async (latNum, lngNum) => {
    const data = await apiFetch(
      `/api/location/from-coordinates?lat=${encodeURIComponent(latNum)}&lng=${encodeURIComponent(lngNum)}`
    );
    const gid = String(data.governorateId);
    const did = String(data.districtId);
    const dists = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(gid)}`);
    suppressDistrictGeocodeUntilRef.current = Date.now() + 1200;
    setGovernorateId(gid);
    setDistricts(dists);
    setDistrictId(did);
    setLocationDescription(prev => {
      if (data.displayName) return String(data.displayName).slice(0, 500);
      return prev;
    });
    setCoordsMatchError("");
  }, [t]);

  const scheduleAdminFromPin = useCallback(
    (latNum, lngNum) => {
      if (coordsLookupTimerRef.current) {
        window.clearTimeout(coordsLookupTimerRef.current);
        coordsLookupTimerRef.current = null;
      }
      setCoordsMatchError("");
      setCoordsLookupLoading(true);
      coordsLookupTimerRef.current = window.setTimeout(async () => {
        coordsLookupTimerRef.current = null;
        try {
          await applyAdminFromCoordinates(latNum, lngNum);
        } catch (err) {
          setCoordsMatchError(err.message || t("createReport.coordsMatchError"));
        } finally {
          setCoordsLookupLoading(false);
        }
      }, 450);
    },
    [applyAdminFromCoordinates]
  );

  scheduleAdminFromPinRef.current = scheduleAdminFromPin;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasContent =
        category ||
        description.trim() ||
        locationDescription.trim() ||
        governorateId ||
        districtId ||
        lat !== String(DEFAULT_LAT) ||
        lng !== String(DEFAULT_LNG);

      if (!hasContent) {
        clearFormDraft(CREATE_REPORT_DRAFT_KEY);
        return;
      }

      writeFormDraft(CREATE_REPORT_DRAFT_KEY, {
        category,
        description,
        locationDescription,
        governorateId,
        districtId,
        lat,
        lng,
        savedAt: Date.now(),
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [category, description, locationDescription, governorateId, districtId, lat, lng]);

  useEffect(
    () => () => {
      if (coordsLookupTimerRef.current) {
        window.clearTimeout(coordsLookupTimerRef.current);
        coordsLookupTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/governorates");
        if (!cancelled) setGovernorates(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!governorateId) {
      setDistricts([]);
      setDistrictId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(governorateId)}`);
        if (!cancelled) setDistricts(data);
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [governorateId]);

  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, getLebanonMapOptions({ zoomControl: true })).setView(LEBANON_CENTER, 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], {
      draggable: true,
      icon: createReportMapIcon(),
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = clampLatLng(marker.getLatLng().lat, marker.getLatLng().lng);
      marker.setLatLng([pos.lat, pos.lng]);
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
      scheduleAdminFromPinRef.current(pos.lat, pos.lng);
    });

    map.on("click", event => {
      const pos = clampLatLng(event.latlng.lat, event.latlng.lng);
      marker.setLatLng([pos.lat, pos.lng]);
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
      scheduleAdminFromPinRef.current(pos.lat, pos.lng);
    });

    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => {
      window.clearTimeout(timer);
      if (coordsLookupTimerRef.current) {
        window.clearTimeout(coordsLookupTimerRef.current);
        coordsLookupTimerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    const latNum = toNumber(lat);
    const lngNum = toNumber(lng);
    if (latNum === null || lngNum === null) return;
    if (Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) return;
    const pos = clampLatLng(latNum, lngNum);
    marker.setLatLng([pos.lat, pos.lng]);
  }, [lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !districtId) return;

    const district = districts.find(d => String(d._id) === String(districtId));
    const gov = governorates.find(g => String(g._id) === String(governorateId));
    if (!district) return;

    if (Date.now() < suppressDistrictGeocodeUntilRef.current) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const query = `${district.name}${gov?.name ? `, ${gov.name}` : ""}, Lebanon`;
        const results = await geocodeQuery(query);
        if (cancelled || results.length === 0) return;
        const best = results[0];
        const latNum = toNumber(best.lat);
        const lngNum = toNumber(best.lon);
        if (latNum === null || lngNum === null) return;
        const pos = clampLatLng(latNum, lngNum);
        marker.setLatLng([pos.lat, pos.lng]);
        map.setView([pos.lat, pos.lng], 13, { animate: true });
        setLat(pos.lat.toFixed(6));
        setLng(pos.lng.toFixed(6));
      } catch {
        // Silent fallback: keep current map view.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [districtId, districts, governorateId, governorates]);

  useEffect(() => {
    const latNum = toNumber(lat);
    const lngNum = toNumber(lng);
    if (!districtId || !category || latNum === null || lngNum === null) {
      setNearbyItems([]);
      setNearbyError("");
      return;
    }
    if (Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      setNearbyItems([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setNearbyLoading(true);
      setNearbyError("");
      try {
        const query = new URLSearchParams({
          districtId,
          category,
          lat: String(latNum),
          lng: String(lngNum),
          radiusMeters: "500",
          limit: "5",
        });
        const data = await apiFetch(`/api/reports/nearby-similar?${query.toString()}`);
        if (!cancelled) setNearbyItems(data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setNearbyError(err.message || t("createReport.nearbyCheckError"));
          setNearbyItems([]);
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [districtId, category, lat, lng, t]);

  function useGpsLocation() {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (!navigator.geolocation) {
      setGpsError(t("createReport.gpsUnsupported"));
      return;
    }
    setGpsError("");
    setCoordsMatchError("");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        if (!isInLebanon(rawLat, rawLng)) {
          setGpsError(t("createReport.gpsOutsideLebanon"));
        }
        const { lat: latNum, lng: lngNum } = clampLatLng(rawLat, rawLng);
        marker.setLatLng([latNum, lngNum]);
        map.setView([latNum, lngNum], 17, { animate: true });
        setLat(latNum.toFixed(6));
        setLng(lngNum.toFixed(6));
        try {
          await applyAdminFromCoordinates(latNum, lngNum);
        } catch (err) {
          setCoordsMatchError(err.message || t("createReport.gpsDistrictMatchFailed"));
        } finally {
          setGpsLoading(false);
        }
      },
      err => {
        setGpsLoading(false);
        const code = err && typeof err.code === "number" ? err.code : 0;
        const byCode = {
          1: t("createReport.gpsDenied"),
          2: t("createReport.gpsUnavailable"),
          3: t("createReport.gpsTimeout"),
        };
        setGpsError(byCode[code] || t("createReport.gpsGeneric"));
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
  }

  async function onSubmit() {
    setError("");
    if (!files.length) {
      setError(t("createReport.needImage"));
      return;
    }
    const latNum = toNumber(lat);
    const lngNum = toNumber(lng);
    if (latNum === null || lngNum === null || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      setError(t("createReport.invalidCoords"));
      return;
    }
    if (!isInLebanon(latNum, lngNum)) {
      setError(t("createReport.outsideLebanon"));
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("description", description);
      fd.append("locationDescription", locationDescription);
      fd.append("governorateId", governorateId);
      fd.append("districtId", districtId);
      fd.append("lat", String(latNum));
      fd.append("lng", String(lngNum));
      for (let i = 0; i < files.length; i += 1) {
        fd.append("images", files[i]);
      }
      const base = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const res = await fetch(`${base}/api/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || t("createReport.submitFailed"));
      clearFormDraft(CREATE_REPORT_DRAFT_KEY);
      setDraftRestored(false);
      navigate(`/reports/${data._id}`);
    } catch (err) {
      setError(err.message || t("createReport.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = category ? resolveIssueCategory(category) : null;

  return (
    <div className="create-report-page">
      <header className="create-report-hero card">
        <div className="create-report-hero-main">
          <span className="create-report-hero-icon" aria-hidden="true">
            <FaPlusCircle />
          </span>
          <div>
            <h1>{t("createReport.title")}</h1>
            <p className="muted create-report-hero-lead">{t("createReport.lead")}</p>
          </div>
        </div>
        <ol className="create-report-steps" aria-label={t("createReport.submissionSteps")}>
          <li className="create-report-step-pill">
            <span className="create-report-step-num">1</span> {t("createReport.stepDetails")}
          </li>
          <li className="create-report-step-pill">
            <span className="create-report-step-num">2</span> {t("createReport.stepLocation")}
          </li>
          <li className="create-report-step-pill">
            <span className="create-report-step-num">3</span> {t("createReport.stepPhotos")}
          </li>
        </ol>
      </header>
      {draftRestored ? (
        <p className="form-draft-notice create-report-draft card" role="status">
          <FaClipboardList aria-hidden />
          <span>{t("createReport.draftRestored")}</span>
          <button type="button" className="secondary form-draft-clear" onClick={() => {
            clearFormDraft(CREATE_REPORT_DRAFT_KEY);
            setDraftRestored(false);
            setCategory("");
            setDescription("");
            setLocationDescription("");
            setGovernorateId("");
            setDistrictId("");
            setLat(String(DEFAULT_LAT));
            setLng(String(DEFAULT_LNG));
            setFiles([]);
            setError("");
            const marker = markerRef.current;
            const map = mapRef.current;
            if (marker && map) {
              marker.setLatLng(LEBANON_CENTER);
              map.setView(LEBANON_CENTER, 13);
            }
          }}>
            {t("common.clearDraft")}
          </button>
        </p>
      ) : null}
      <form className="create-report-form" onSubmit={handleFormSubmit(onSubmit)}>
        <section className="create-report-panel card" aria-labelledby="create-details-heading">
          <div className="create-report-panel-head">
            <span className="create-report-panel-icon create-report-panel-icon--details" aria-hidden="true">
              <FaBullhorn />
            </span>
            <div>
              <p className="create-report-panel-kicker">{t("createReport.stepKicker", { n: 1 })}</p>
              <h2 id="create-details-heading">{t("createReport.step1")}</h2>
            </div>
          </div>
          <div className="create-report-fields form-grid">
        <div className="create-report-field">
          <label htmlFor="cat">{t("createReport.category")}</label>
          {selectedCategory ? (
            <p className="create-report-category-hint">
              <span className="create-report-category-dot" style={{ backgroundColor: selectedCategory.color }} aria-hidden />
              {selectedCategory.label}
            </p>
          ) : null}
          <DownwardSelect
            inputId="cat"
            instanceId="create-cat-select"
            value={categoryOptions.find(o => o.value === category) || null}
            onChange={option => {
              if (isPlaceholderOption(option)) return;
              setCategory(option?.value || "");
            }}
            options={withLeadingPlaceholderOption(categoryOptions, t("createReport.chooseCategory"))}
            placeholder={t("createReport.chooseCategory")}
          />
        </div>
        <div className="create-report-field create-report-field--full">
          <label htmlFor="desc">{t("createReport.description")}</label>
          <textarea
            id="desc"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            placeholder={t("createReport.descriptionPlaceholder")}
          />
        </div>
          </div>
        </section>

        <section className="create-report-panel card" aria-labelledby="create-location-heading">
          <div className="create-report-panel-head">
            <span className="create-report-panel-icon create-report-panel-icon--location" aria-hidden="true">
              <FaMapMarkerAlt />
            </span>
            <div>
              <p className="create-report-panel-kicker">{t("createReport.stepKicker", { n: 2 })}</p>
              <h2 id="create-location-heading">{t("createReport.step2")}</h2>
            </div>
          </div>
          <div className="create-report-fields form-grid">
        <div className="create-report-field">
          <label htmlFor="gov">{t("common.governorate")}</label>
          <DownwardSelect
            inputId="gov"
            instanceId="create-gov-select"
            value={(governorates || []).map(g => ({ value: g._id, label: g.name })).find(o => o.value === governorateId) || null}
            onChange={option => setGovernorateId(option?.value || "")}
            options={(governorates || []).map(g => ({ value: g._id, label: g.name }))}
            placeholder={t("common.select")}
          />
        </div>
        <div className="create-report-field">
          <label htmlFor="dist">{t("common.district")}</label>
          <DownwardSelect
            inputId="dist"
            instanceId="create-dist-select"
            value={(districts || []).map(d => ({ value: d._id, label: d.name })).find(o => o.value === districtId) || null}
            onChange={option => setDistrictId(option?.value || "")}
            options={(districts || []).map(d => ({ value: d._id, label: d.name }))}
            placeholder={!governorateId ? t("common.selectGovernorateFirst") : t("common.select")}
            isDisabled={!governorateId}
          />
        </div>
        <div className="create-report-field create-report-field--full">
          <label htmlFor="locDesc">{t("createReport.locationDescription")}</label>
          <input
            id="locDesc"
            value={locationDescription}
            onChange={e => setLocationDescription(e.target.value)}
            required
            placeholder={t("createReport.locationPlaceholder")}
          />
        </div>
        <div className="create-report-field create-report-field--full create-report-map-wrap">
          <label className="create-report-map-label">
            <FaMapMarkedAlt aria-hidden />
            {t("createReport.pickMap")}
          </label>
          <p className="muted create-report-map-hint">{t("createReport.mapHint")}</p>
          <div className="map-location-tools">
            <button type="button" className="secondary map-gps-btn" onClick={useGpsLocation} disabled={gpsLoading || coordsLookupLoading}>
              <FaLocationArrow aria-hidden />
              {gpsLoading ? t("createReport.gettingGps") : t("createReport.useGps")}
            </button>
          </div>
          {coordsLookupLoading ? (
            <p className="muted create-report-status-msg">{t("createReport.matchingPin")}</p>
          ) : null}
          {gpsError ? <p className="error create-report-status-msg">{gpsError}</p> : null}
          {coordsMatchError ? <p className="error create-report-status-msg">{coordsMatchError}</p> : null}
          <div ref={mapElRef} className="map-canvas create-report-map" role="application" aria-label={t("createReport.mapAriaLabel")} />
        </div>
        <div className="coordinate-grid create-report-coords">
          <p className="muted coordinate-grid-hint create-report-coords-hint">{t("createReport.coordsHint")}</p>
          <div>
            <label htmlFor="lat">{t("createReport.latitude")}</label>
            <input
              id="lat"
              name="lat"
              value={lat}
              readOnly
              required
              title={t("createReport.coordsReadonlyTitle")}
            />
          </div>
          <div>
            <label htmlFor="lng">{t("createReport.longitude")}</label>
            <input
              id="lng"
              name="lng"
              value={lng}
              readOnly
              required
              title={t("createReport.coordsReadonlyTitle")}
            />
          </div>
        </div>
          </div>
        </section>

        <section className="create-report-panel card" aria-labelledby="create-photos-heading">
          <div className="create-report-panel-head">
            <span className="create-report-panel-icon create-report-panel-icon--photos" aria-hidden="true">
              <FaCamera />
            </span>
            <div>
              <p className="create-report-panel-kicker">{t("createReport.stepKicker", { n: 3 })}</p>
              <h2 id="create-photos-heading">{t("createReport.step3")}</h2>
            </div>
          </div>

          <div className="create-report-photo-field">
            <label htmlFor="imgs" className="create-report-photo-label">
              <FaCamera aria-hidden />
              <span>
                <strong>{t("createReport.photosRequired")}</strong>
                <span className="muted create-report-photo-sublabel">{t("createReport.photosSub")}</span>
              </span>
            </label>
            <input
              id="imgs"
              type="file"
              accept="image/*"
              multiple
              className="create-report-file-input"
              onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
            {files.length > 0 ? (
              <p className="create-report-file-count" role="status">
                {t("createReport.photosSelected", { count: files.length })}
              </p>
            ) : (
              <p className="muted create-report-file-hint">{t("createReport.photosTap")}</p>
            )}
          </div>

          <div className="nearby-alerts create-report-nearby">
            <div className="create-report-nearby-head">
              <FaExclamationTriangle aria-hidden />
              <div>
                <h3 className="nearby-alerts-title">{t("createReport.nearbyTitle")}</h3>
                <p className="muted nearby-alerts-lead">{t("createReport.nearbyLead")}</p>
              </div>
            </div>
            {nearbyLoading ? <p className="muted create-report-nearby-msg">{t("createReport.nearbyChecking")}</p> : null}
            {nearbyError ? <p className="error create-report-nearby-msg">{nearbyError}</p> : null}
            {!nearbyLoading && !nearbyError && nearbyItems.length === 0 && districtId && category ? (
              <p className="muted create-report-nearby-msg">{t("createReport.nearbyNone")}</p>
            ) : null}
            {!districtId || !category ? (
              <p className="muted create-report-nearby-msg">{t("createReport.nearbyNeedFields")}</p>
            ) : null}
            {nearbyItems.length > 0 ? (
              <div className="nearby-list">
                {nearbyItems.map(item => {
                  const catMeta = resolveIssueCategory(item.category);
                  return (
                    <div key={item._id} className="nearby-item">
                      <span className="nearby-item-dot" style={{ backgroundColor: catMeta.color }} aria-hidden />
                      <div className="nearby-item-main">
                        <Link to={`/explore/reports/${item._id}`} className="nearby-item-link">
                          {item.locationDescription?.trim() || catMeta.label}
                        </Link>
                        <div className="muted nearby-item-meta">
                          {catMeta.label} · {getStatusLabel(item.status)} · {item.distanceMeters}m
                        </div>
                      </div>
                      <span className="muted nearby-item-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>

        <footer className="create-report-submit card">
          {error ? <p className="error create-report-submit-error">{error}</p> : null}
          <button type="submit" className="create-report-submit-btn" disabled={loading}>
            <FaPlusCircle aria-hidden />
            {loading ? t("common.submitting") : t("createReport.submitReport")}
          </button>
        </footer>
      </form>
    </div>
  );
}

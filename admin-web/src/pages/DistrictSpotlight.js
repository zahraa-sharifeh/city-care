import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaBook,
  FaCalendarAlt,
  FaLandmark,
  FaMapMarkerAlt,
  FaPlus,
  FaSave,
  FaTrash,
  FaUniversity,
} from "react-icons/fa";
import { apiFetch } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import { clearFormDraft, readFormDraft, writeFormDraft } from "../utils/formDraft";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

const SPOTLIGHT_UI_KEY = "citycare:spotlight-ui";

function spotlightDraftKey(districtId) {
  return `citycare:spotlight-draft:${districtId}`;
}

const emptyEvent = () => ({
  title: "",
  summary: "",
  startsAt: "",
  venue: "",
  url: "",
});

function normalizeEventsForDraft(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [emptyEvent()];
  return rows.map(row => ({
    title: typeof row.title === "string" ? row.title : "",
    summary: typeof row.summary === "string" ? row.summary : "",
    startsAt: typeof row.startsAt === "string" ? row.startsAt : "",
    venue: typeof row.venue === "string" ? row.venue : "",
    url: typeof row.url === "string" ? row.url : "",
  }));
}

function toDatetimeLocalValue(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export default function DistrictSpotlight() {
  const { t, i18n } = useTranslation();
  const { admin } = useAdminAuth();
  const uiDraft = readFormDraft(SPOTLIGHT_UI_KEY);
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [governorateId, setGovernorateId] = useState(uiDraft?.governorateId ?? "");
  const [selectedDistrictId, setSelectedDistrictId] = useState(uiDraft?.selectedDistrictId ?? "");
  const [essay, setEssay] = useState("");
  const [heritageInfo, setHeritageInfo] = useState("");
  const [events, setEvents] = useState([emptyEvent()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const contentHydratedRef = useRef(false);

  const dateLocale = i18n.language === "ar" ? "ar-LB" : undefined;
  const superAdmin = admin?.role === "SUPER_ADMIN";
  const districtOnlyId =
    admin?.role === "DISTRICT_ADMIN" ? String(admin?.districtId?._id || admin?.districtId || "") : "";
  const effectiveDistrictId = superAdmin ? selectedDistrictId : districtOnlyId;
  const assignedDistrictName =
    admin?.districtId && typeof admin.districtId === "object" ? admin.districtId.name : null;

  const selectedDistrictName = useMemo(() => {
    if (!superAdmin || !selectedDistrictId) return null;
    return districts.find(d => String(d._id) === String(selectedDistrictId))?.name || null;
  }, [superAdmin, selectedDistrictId, districts]);

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
    if (!superAdmin || !governorateId) {
      setDistricts([]);
      if (superAdmin) setSelectedDistrictId("");
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
  }, [governorateId, superAdmin]);

  const loadContent = useCallback(async () => {
    if (!effectiveDistrictId) return;
    setLoading(true);
    setError("");
    setDraftRestored(false);
    contentHydratedRef.current = false;
    try {
      const data = await apiFetch(`/api/admin/district-spotlight/${effectiveDistrictId}`);
      const draft = readFormDraft(spotlightDraftKey(effectiveDistrictId));

      if (draft) {
        setEssay(typeof draft.essay === "string" ? draft.essay : "");
        setHeritageInfo(typeof draft.heritageInfo === "string" ? draft.heritageInfo : "");
        setEvents(normalizeEventsForDraft(draft.events));
        setDraftRestored(true);
      } else {
        setEssay(data.essay || "");
        setHeritageInfo(data.heritageInfo || "");
        const ev = Array.isArray(data.events) && data.events.length > 0 ? data.events : [emptyEvent()];
        setEvents(
          ev.map(e => ({
            title: e.title || "",
            summary: e.summary || "",
            startsAt: toDatetimeLocalValue(e.startsAt),
            venue: e.venue || "",
            url: e.url || "",
          }))
        );
      }
      setSavedAt(data.updatedAt || null);
    } catch (e) {
      setError(e.message || t("spotlight.loadError"));
      const draft = readFormDraft(spotlightDraftKey(effectiveDistrictId));
      if (draft) {
        setEssay(typeof draft.essay === "string" ? draft.essay : "");
        setHeritageInfo(typeof draft.heritageInfo === "string" ? draft.heritageInfo : "");
        setEvents(normalizeEventsForDraft(draft.events));
        setDraftRestored(true);
      } else {
        setEssay("");
        setHeritageInfo("");
        setEvents([emptyEvent()]);
      }
    } finally {
      setLoading(false);
      contentHydratedRef.current = true;
    }
  }, [effectiveDistrictId, t]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!superAdmin) return;
    writeFormDraft(SPOTLIGHT_UI_KEY, { governorateId, selectedDistrictId });
  }, [superAdmin, governorateId, selectedDistrictId]);

  useEffect(() => {
    if (!effectiveDistrictId || !contentHydratedRef.current || loading) return;

    const timer = window.setTimeout(() => {
      const hasContent =
        essay.trim() ||
        heritageInfo.trim() ||
        events.some(row => row.title.trim() || row.summary.trim() || row.venue.trim() || row.url.trim() || row.startsAt);

      if (!hasContent) {
        clearFormDraft(spotlightDraftKey(effectiveDistrictId));
        return;
      }

      writeFormDraft(spotlightDraftKey(effectiveDistrictId), {
        essay,
        heritageInfo,
        events,
        savedAt: Date.now(),
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [effectiveDistrictId, loading, essay, heritageInfo, events]);

  function clearSpotlightDraft() {
    if (effectiveDistrictId) clearFormDraft(spotlightDraftKey(effectiveDistrictId));
    setDraftRestored(false);
    loadContent();
  }

  async function save() {
    if (!effectiveDistrictId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        essay,
        heritageInfo,
        events: events
          .map(row => ({
            title: row.title.trim(),
            summary: row.summary.trim(),
            startsAt: row.startsAt ? new Date(row.startsAt).toISOString() : null,
            venue: row.venue.trim(),
            url: row.url.trim(),
          }))
          .filter(row => row.title.length > 0),
      };
      await apiFetch(`/api/admin/district-spotlight/${effectiveDistrictId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      clearFormDraft(spotlightDraftKey(effectiveDistrictId));
      setDraftRestored(false);
      await loadContent();
    } catch (err) {
      setError(err.message || t("spotlight.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function updateEvent(i, field, value) {
    setEvents(prev => prev.map((row, j) => (j === i ? { ...row, [field]: value } : row)));
  }

  function addEvent() {
    setEvents(prev => [...prev, emptyEvent()]);
  }

  function removeEvent(i) {
    setEvents(prev => (prev.length <= 1 ? [emptyEvent()] : prev.filter((_, j) => j !== i)));
  }

  return (
    <div className="spotlight-page">
      <header className="card spotlight-hero">
        <div className="spotlight-hero-text">
          <p className="spotlight-eyebrow">
            <FaLandmark aria-hidden />
            {t("nav.spotlight")}
          </p>
          <h1>{t("spotlight.title")}</h1>
          <p className="spotlight-lead">{t("spotlight.lead")}</p>
        </div>
        {savedAt && effectiveDistrictId && !loading ? (
          <p className="spotlight-last-saved">
            {t("spotlight.lastSaved", {
              date: new Date(savedAt).toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" }),
            })}
          </p>
        ) : null}
      </header>

      {superAdmin ? (
        <section className="card spotlight-select-card">
          <div className="spotlight-section-head">
            <FaMapMarkerAlt aria-hidden />
            <h2>{t("spotlight.districtSelect")}</h2>
          </div>
          <div className="spotlight-select-grid">
            <div className="spotlight-filter-field">
              <label htmlFor="spot-gov">{t("common.governorate")}</label>
              <select id="spot-gov" value={governorateId} onChange={e => setGovernorateId(e.target.value)}>
                <option value="">{t("spotlight.selectGovernorate")}</option>
                {governorates.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="spotlight-filter-field">
              <label htmlFor="spot-dist">{t("common.district")}</label>
              <select
                id="spot-dist"
                value={selectedDistrictId}
                disabled={!governorateId}
                onChange={e => setSelectedDistrictId(e.target.value)}
              >
                <option value="">{governorateId ? t("spotlight.selectDistrict") : t("spotlight.chooseGovernorateFirst")}</option>
                {districts.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedDistrictName ? (
            <p className="spotlight-editing-hint">
              <strong>{t("spotlight.editingDistrict")}</strong> {selectedDistrictName}
            </p>
          ) : null}
        </section>
      ) : (
        <div className="card spotlight-district-banner">
          <FaMapMarkerAlt aria-hidden />
          <div>
            <strong>{t("spotlight.yourDistrict")}</strong>
            <p>
              {assignedDistrictName ? assignedDistrictName : t("spotlight.yourDistrictLead")}
              {!assignedDistrictName ? null : <span className="spotlight-district-banner-sub"> — {t("spotlight.yourDistrictLead")}</span>}
            </p>
          </div>
        </div>
      )}

      {!effectiveDistrictId ? (
        <div className="card spotlight-empty-state">
          <p className="muted">{superAdmin ? t("spotlight.selectToEdit") : t("spotlight.noDistrictAssigned")}</p>
        </div>
      ) : loading ? (
        <div className="card spotlight-loading">
          <p className="muted" role="status">
            {t("common.loading")}
          </p>
        </div>
      ) : (
        <form className="spotlight-form" onSubmit={handleFormSubmit(save)}>
          {draftRestored ? (
            <div className="form-draft-notice spotlight-draft-notice" role="status">
              <span>{t("spotlight.draftRestored")}</span>
              <button type="button" className="secondary form-draft-clear" onClick={clearSpotlightDraft}>
                {t("spotlight.discardDraft")}
              </button>
            </div>
          ) : null}

          {error ? <p className="error spotlight-error">{error}</p> : null}

          <section className="card spotlight-panel">
            <div className="spotlight-section-head">
              <FaBook aria-hidden />
              <h2>{t("spotlight.essayLabel")}</h2>
            </div>
            <textarea
              id="essay"
              className="spotlight-textarea"
              rows={8}
              value={essay}
              onChange={e => setEssay(e.target.value)}
              placeholder={t("spotlight.essayPlaceholder")}
              maxLength={20000}
            />
          </section>

          <section className="card spotlight-panel">
            <div className="spotlight-section-head">
              <FaUniversity aria-hidden />
              <h2>{t("spotlight.heritageLabel")}</h2>
            </div>
            <textarea
              id="heritage"
              className="spotlight-textarea"
              rows={8}
              value={heritageInfo}
              onChange={e => setHeritageInfo(e.target.value)}
              placeholder={t("spotlight.heritagePlaceholder")}
              maxLength={20000}
            />
          </section>

          <section className="card spotlight-panel spotlight-panel--events">
            <div className="spotlight-events-head">
              <div className="spotlight-section-head">
                <FaCalendarAlt aria-hidden />
                <h2>{t("spotlight.eventsTitle")}</h2>
              </div>
              <button type="button" className="secondary spotlight-add-event" onClick={addEvent} disabled={events.length >= 25}>
                <FaPlus aria-hidden />
                {t("spotlight.addEvent")}
              </button>
            </div>
            <p className="muted spotlight-events-help">{t("spotlight.eventsHelp")}</p>

            <div className="spotlight-events-list">
              {events.map((row, i) => (
                <article key={i} className="spotlight-event-card">
                  <div className="spotlight-event-card-head">
                    <span className="spotlight-event-num">{t("spotlight.eventN", { n: i + 1 })}</span>
                    <button type="button" className="secondary spotlight-remove-event" onClick={() => removeEvent(i)}>
                      <FaTrash aria-hidden />
                      {t("spotlight.remove")}
                    </button>
                  </div>
                  <div className="spotlight-event-grid">
                    <div className="spotlight-filter-field">
                      <label htmlFor={`ev-title-${i}`}>{t("spotlight.eventTitle")}</label>
                      <input
                        id={`ev-title-${i}`}
                        value={row.title}
                        onChange={e => updateEvent(i, "title", e.target.value)}
                        maxLength={300}
                      />
                    </div>
                    <div className="spotlight-filter-field">
                      <label htmlFor={`ev-when-${i}`}>{t("spotlight.eventStarts")}</label>
                      <input
                        id={`ev-when-${i}`}
                        type="datetime-local"
                        value={row.startsAt}
                        onChange={e => updateEvent(i, "startsAt", e.target.value)}
                      />
                    </div>
                    <div className="spotlight-filter-field">
                      <label htmlFor={`ev-venue-${i}`}>{t("spotlight.eventVenue")}</label>
                      <input
                        id={`ev-venue-${i}`}
                        value={row.venue}
                        onChange={e => updateEvent(i, "venue", e.target.value)}
                        maxLength={300}
                      />
                    </div>
                    <div className="spotlight-filter-field">
                      <label htmlFor={`ev-url-${i}`}>{t("spotlight.eventLink")}</label>
                      <input
                        id={`ev-url-${i}`}
                        type="url"
                        value={row.url}
                        onChange={e => updateEvent(i, "url", e.target.value)}
                        placeholder="https://"
                      />
                    </div>
                    <div className="spotlight-filter-field spotlight-filter-field--full">
                      <label htmlFor={`ev-sum-${i}`}>{t("spotlight.eventSummary")}</label>
                      <textarea
                        id={`ev-sum-${i}`}
                        rows={3}
                        value={row.summary}
                        onChange={e => updateEvent(i, "summary", e.target.value)}
                        maxLength={2000}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="spotlight-save-bar" role="group" aria-label={t("spotlight.save")}>
            <button type="submit" className="spotlight-save-btn" disabled={saving}>
              <FaSave aria-hidden />
              {saving ? t("common.saving") : t("spotlight.save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

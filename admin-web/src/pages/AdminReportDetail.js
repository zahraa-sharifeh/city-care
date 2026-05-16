import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClone,
  FaComments,
  FaDownload,
  FaMapMarkerAlt,
  FaShareAlt,
  FaUser,
} from "react-icons/fa";
import { apiFetch, apiFetchBlob } from "../api/client";
import { getCategoryLabelFromValue, resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel, getStatusOptions } from "../utils/statusLabels";
import { getPriorityLabel, getPriorityOptions } from "../utils/priorityLabels";
import {
  buildReportShareMessage,
  buildWhatsAppUrl,
  isValidWhatsAppPhone,
  normalizeWhatsAppPhone,
} from "../utils/reportShare";
import ReportMap from "../components/ReportMap";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

function statusModifier(status) {
  const s = String(status || "").toLowerCase();
  if (["pending", "in_progress", "resolved", "rejected"].includes(s)) return s;
  return "pending";
}

function duplicateReviewLabel(report, t) {
  if (report.duplicateReview?.status === "CONFIRMED_DUPLICATE") return t("reports.duplicateConfirmed");
  if (report.duplicateReview?.status === "NOT_DUPLICATE") return t("reports.duplicateMarkedNot");
  return t("reports.duplicatePendingReview");
}

export default function AdminReportDetail() {
  const { t, i18n } = useTranslation();
  const statusOptions = useMemo(() => getStatusOptions(), [i18n.language]);
  const priorityOptions = useMemo(() => getPriorityOptions(), [i18n.language]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [statusNote, setStatusNote] = useState("");
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [duplicateLoading, setDuplicateLoading] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharePhone, setSharePhone] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareMessageTouched, setShareMessageTouched] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  async function load() {
    setError("");
    try {
      const [r, c] = await Promise.all([
        apiFetch(`/api/admin/reports/${id}`),
        apiFetch(`/api/reports/${id}/comments`),
      ]);
      setReport(r);
      setStatus(r.status);
      setPriority(r.priority || "MEDIUM");
      setStatusNote(r.statusNote || "");
      setDuplicateCandidates(r.duplicateCandidates || []);
      setComments(c);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const defaultShareMessage = useMemo(() => (report ? buildReportShareMessage(report) : ""), [report, i18n.language]);

  useEffect(() => {
    if (!report || shareMessageTouched) return;
    setShareMessage(defaultShareMessage);
  }, [report, defaultShareMessage, shareMessageTouched]);

  async function saveStatus() {
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, priority, statusNote }),
      });
      setReport(updated);
      setStatus(updated.status);
      setPriority(updated.priority || "MEDIUM");
      setStatusNote(updated.statusNote || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markDuplicate(primaryId) {
    setDuplicateLoading(primaryId);
    setError("");
    try {
      const updated = await apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ duplicateAction: "MARK_DUPLICATE", primaryReportId: primaryId }),
      });
      setReport(updated);
      setStatus(updated.status);
      setPriority(updated.priority || "MEDIUM");
      setStatusNote(updated.statusNote || "");
      await load();
    } catch (err) {
      setError(err.message || t("reports.markDuplicateFailed"));
    } finally {
      setDuplicateLoading("");
    }
  }

  async function downloadReportPdf() {
    setDownloadingPdf(true);
    setError("");
    try {
      const blob = await apiFetchBlob(`/api/admin/reports/${id}/export.pdf`);
      const stamp = new Date().toISOString().slice(0, 10);
      const slug = String(report?.category || "report")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .slice(0, 40)
        .replace(/\s+/g, "-");
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `report-${slug || "issue"}-${stamp}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || t("reports.downloadPdfFailed"));
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareMessage || defaultShareMessage);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError(t("reports.copyFailed"));
    }
  }

  function openWhatsApp() {
    const digits = normalizeWhatsAppPhone(sharePhone);
    if (!isValidWhatsAppPhone(digits)) {
      setError(t("reports.invalidPhone"));
      return;
    }
    setError("");
    const url = buildWhatsAppUrl(digits, shareMessage || defaultShareMessage);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function ignoreDuplicate() {
    setDuplicateLoading("ignore");
    setError("");
    try {
      const updated = await apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ duplicateAction: "IGNORE_DUPLICATE" }),
      });
      setReport(updated);
      setStatus(updated.status);
      setPriority(updated.priority || "MEDIUM");
      setStatusNote(updated.statusNote || "");
      await load();
    } catch (err) {
      setError(err.message || t("reports.updateDuplicateFailed"));
    } finally {
      setDuplicateLoading("");
    }
  }

  const dateLocale = i18n.language === "ar" ? "ar-LB" : undefined;

  if (!report && !error) {
    return (
      <div className="admin-report-detail">
        <div className="admin-report-loading card">
          <p className="muted" role="status">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="admin-report-detail">
        <div className="admin-report-loading card">
          <p className="error">{error}</p>
          <button type="button" className="secondary admin-report-back-btn" onClick={() => navigate("/reports")}>
            <FaArrowLeft aria-hidden />
            {t("reports.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const cat = resolveIssueCategory(report.category);
  const statusClass = statusModifier(report.status);
  const locationLine = [report.governorateId?.name, report.districtId?.name].filter(Boolean).join(" · ");
  const images = report.images || [];
  const isFormDirty =
    status !== report.status ||
    priority !== (report.priority || "MEDIUM") ||
    (statusNote || "") !== (report.statusNote || "");

  return (
    <div className="admin-report-detail">
      <header className="admin-report-hero card">
        <button type="button" className="admin-report-back" onClick={() => navigate("/reports")}>
          <FaArrowLeft aria-hidden />
          {t("reports.back")}
        </button>

        <div className="admin-report-hero-main">
          <span className="admin-report-category-dot" style={{ backgroundColor: cat.color }} aria-hidden />
          <div>
            <p className="admin-report-eyebrow">{t("reports.detailTitle")}</p>
            <h1>{getCategoryLabelFromValue(report.category)}</h1>
            <div className="admin-report-badges">
              <span className={`admin-report-badge admin-report-badge--${statusClass}`}>
                {getStatusLabel(report.status)}
              </span>
              <span className="admin-report-badge admin-report-badge--priority">
                {getPriorityLabel(report.priority)}
              </span>
              <span className="admin-report-badge admin-report-badge--duplicate">
                {duplicateReviewLabel(report, t)}
              </span>
            </div>
          </div>
        </div>

        <dl className="admin-report-meta">
          <div className="admin-report-meta-item">
            <dt>
              <FaMapMarkerAlt aria-hidden />
              {t("reports.location")}
            </dt>
            <dd>{report.locationDescription}</dd>
          </div>
          {locationLine ? (
            <div className="admin-report-meta-item">
              <dt>{t("reports.shareArea")}</dt>
              <dd>{locationLine}</dd>
            </div>
          ) : null}
          <div className="admin-report-meta-item">
            <dt>
              <FaUser aria-hidden />
              {t("reports.citizen")}
            </dt>
            <dd>
              {report.userId?.fullName || "—"}
              {report.userId?.email ? <span className="admin-report-meta-sub"> {report.userId.email}</span> : null}
            </dd>
          </div>
          <div className="admin-report-meta-item">
            <dt>
              <FaCalendarAlt aria-hidden />
              {t("reports.created")}
            </dt>
            <dd>
              {new Date(report.createdAt).toLocaleString(dateLocale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>

        {report.statusNote ? (
          <div className="admin-report-team-note" role="note">
            <strong>{t("reports.statusNote")}</strong>
            <p>{report.statusNote}</p>
          </div>
        ) : null}

        {report.duplicateReview?.primaryReportId ? (
          <p className="admin-report-primary-link">
            <strong>{t("reports.primaryReport")}</strong>{" "}
            <button
              type="button"
              className="admin-report-link-btn"
              onClick={() => navigate(`/reports/${report.duplicateReview.primaryReportId._id}`)}
            >
              {getCategoryLabelFromValue(report.duplicateReview.primaryReportId.category) || t("reports.open")}
            </button>
          </p>
        ) : null}
      </header>

      {error ? <p className="error admin-report-error-banner">{error}</p> : null}

      <div className="admin-report-layout">
        <div className="admin-report-main">
          <section className="card admin-report-panel">
            <h2>{t("reports.detailDescription")}</h2>
            <p className="admin-report-description">{report.description}</p>
          </section>

          <section className="card admin-report-panel admin-report-panel--map">
            <h2>{t("reports.detailMap")}</h2>
            <ReportMap reports={[report]} height={280} className="map-canvas map-canvas--embed" />
          </section>

          {images.length > 0 ? (
            <section className="card admin-report-panel">
              <h2>
                {t("reports.detailPhotos")} <span className="admin-report-count">({images.length})</span>
              </h2>
              <div className="admin-report-gallery">
                {images.map((src, index) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className={index === 0 ? "admin-report-gallery-featured" : "admin-report-gallery-item"}
                  >
                    <img src={src} alt="" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card admin-report-panel">
            <div className="admin-report-panel-head">
              <FaClone aria-hidden />
              <h2>{t("reports.potentialDuplicates")}</h2>
            </div>
            <div className="row-actions admin-report-dup-actions">
              <button
                type="button"
                className="secondary"
                disabled={duplicateLoading === "ignore" || report.duplicateReview?.status === "NOT_DUPLICATE"}
                onClick={ignoreDuplicate}
              >
                {duplicateLoading === "ignore"
                  ? t("reports.savingShort")
                  : report.duplicateReview?.status === "NOT_DUPLICATE"
                    ? t("reports.markedNotDuplicate")
                    : t("reports.markNotDuplicate")}
              </button>
            </div>
            {duplicateCandidates.length === 0 ? (
              <p className="muted admin-report-empty">{t("reports.noDuplicates")}</p>
            ) : (
              <div className="table-wrap admin-report-dup-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t("common.category")}</th>
                      <th>{t("common.status")}</th>
                      <th>{t("reports.distance")}</th>
                      <th>{t("reports.citizen")}</th>
                      <th>{t("reports.created")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateCandidates.map(item => {
                      const isMarkedDuplicate =
                        report.duplicateReview?.status === "CONFIRMED_DUPLICATE" &&
                        String(report.duplicateReview?.primaryReportId?._id) === String(item._id);
                      const duplicateAlreadyHandled = report.duplicateReview?.status === "CONFIRMED_DUPLICATE";
                      return (
                        <tr key={item._id}>
                          <td>{getCategoryLabelFromValue(item.category)}</td>
                          <td>
                            <span className={`admin-report-badge admin-report-badge--${statusModifier(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td>{item.duplicateDistanceMeters} m</td>
                          <td>{item.userId?.fullName || "—"}</td>
                          <td>{new Date(item.createdAt).toLocaleString(dateLocale)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="secondary"
                                disabled={duplicateLoading === item._id}
                                onClick={() => navigate(`/reports/${item._id}`)}
                              >
                                {t("reports.open")}
                              </button>
                              <button
                                type="button"
                                disabled={duplicateLoading === item._id || duplicateAlreadyHandled}
                                onClick={() => markDuplicate(item._id)}
                              >
                                {duplicateLoading === item._id
                                  ? t("reports.savingShort")
                                  : isMarkedDuplicate
                                    ? t("reports.markedDuplicate")
                                    : duplicateAlreadyHandled
                                      ? t("reports.duplicateSet")
                                      : t("reports.markDuplicate")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card admin-report-panel">
            <div className="admin-report-panel-head">
              <FaComments aria-hidden />
              <h2>{t("reports.comments")}</h2>
            </div>
            {comments.length === 0 ? (
              <p className="muted admin-report-empty">{t("reports.noComments")}</p>
            ) : (
              <ul className="admin-report-comments">
                {comments.map(c => (
                  <li key={c._id} className="admin-report-comment">
                    <div className="admin-report-comment-head">
                      <strong>{c.userId?.fullName || t("reports.citizenFallback")}</strong>
                      <time dateTime={c.createdAt}>
                        {new Date(c.createdAt).toLocaleString(dateLocale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                    <p>{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="admin-report-aside">
          <section className="card admin-report-panel">
            <h2>{t("reports.detailManage")}</h2>
            <form className="admin-report-form" onSubmit={handleFormSubmit(saveStatus)}>
              <div>
                <label htmlFor="st">{t("reports.updateStatus")}</label>
                <select id="st" value={status} onChange={e => setStatus(e.target.value)}>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="priority">{t("reports.priority")}</label>
                <select id="priority" value={priority} onChange={e => setPriority(e.target.value)}>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="stNote">{t("reports.statusNote")}</label>
                <textarea
                  id="stNote"
                  rows={4}
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder={t("reports.statusNotePlaceholder")}
                  maxLength={1000}
                />
              </div>
              <button type="submit" className="admin-report-save-btn" disabled={saving || !isFormDirty}>
                {saving ? t("common.saving") : t("reports.saveStatus")}
              </button>
            </form>
          </section>

          <section className="card admin-report-panel">
            <div className="admin-report-panel-head">
              <FaShareAlt aria-hidden />
              <h2>{t("reports.shareTitle")}</h2>
            </div>
            <p className="muted admin-report-share-lead">{t("reports.shareLead")}</p>
            <button type="button" className="admin-report-pdf-btn" disabled={downloadingPdf} onClick={downloadReportPdf}>
              <FaDownload aria-hidden />
              {downloadingPdf ? t("reports.preparingPdf") : t("reports.downloadPdf")}
            </button>
            <div className="admin-report-form">
              <div>
                <label htmlFor="sharePhone">{t("reports.whatsappNumber")}</label>
                <input
                  id="sharePhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("reports.whatsappPlaceholder")}
                  value={sharePhone}
                  onChange={e => setSharePhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="shareMessage">{t("reports.message")}</label>
                <textarea
                  id="shareMessage"
                  rows={6}
                  value={shareMessage}
                  onChange={e => {
                    setShareMessageTouched(true);
                    setShareMessage(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="row-actions admin-report-share-actions">
              <button
                type="button"
                className="secondary"
                disabled={!isValidWhatsAppPhone(normalizeWhatsAppPhone(sharePhone))}
                onClick={openWhatsApp}
              >
                {t("reports.openWhatsapp")}
              </button>
              <button type="button" className="secondary" onClick={copyShareText}>
                {copyDone ? t("reports.copied") : t("reports.copyMessage")}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

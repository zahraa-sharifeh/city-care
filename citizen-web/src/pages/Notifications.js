import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaBell, FaCheckDouble, FaInbox, FaFilter } from "react-icons/fa";
import { apiFetch } from "../api/client";
import { useNotifications } from "../context/NotificationsContext";
import { getStatusOptions } from "../utils/statusLabels";
import {
  notificationBody,
  notificationDateLocale,
  notificationMeta,
  notificationTitle,
  notificationTypeLabel,
} from "../utils/notificationMeta";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const statusOptions = useMemo(() => getStatusOptions(), [i18n.language]);
  const { unreadCount, setUnreadCount, refreshUnreadCount } = useNotifications();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setError("");
      try {
        const query = new URLSearchParams({ limit: "100", page: "1" });
        if (viewMode === "unread") query.set("unreadOnly", "true");
        if (statusFilter) query.set("status", statusFilter);
        const res = await apiFetch(`/api/notifications?${query.toString()}`);
        setItems(res.items || []);
        setUnreadCount(res.unreadCount || 0);
      } catch (e) {
        setError(e.message || t("notifications.loadError"));
        if (!silent) setItems([]);
      }
    },
    [viewMode, statusFilter, setUnreadCount, t]
  );

  useRefetchOnFocus(load, [viewMode, statusFilter]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  async function markRead(id) {
    setLoadingAction(id);
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setItems(prev => (prev || []).map(n => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      setError(e.message || t("notifications.markReadError"));
    } finally {
      setLoadingAction("");
    }
  }

  async function markAllRead() {
    setLoadingAction("all");
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setItems(prev => (prev || []).map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      setError(e.message || t("notifications.markAllError"));
    } finally {
      setLoadingAction("");
    }
  }

  const list = items || [];
  const readInList = list.filter(n => n.isRead).length;

  if (error && items === null) {
    return (
      <div className="notifications-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading card">
          <FaBell className="notifications-loading-icon" aria-hidden />
          <p className="muted">{t("notifications.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <header className="notifications-hero card">
        <div className="notifications-hero-main">
          <span className="notifications-hero-icon" aria-hidden="true">
            <FaBell />
          </span>
          <div>
            <h1>{t("notifications.title")}</h1>
            <p className="muted notifications-hero-lead">{t("notifications.lead")}</p>
          </div>
        </div>
        <div className="notifications-stats" aria-label={t("notifications.summaryAriaLabel")}>
          <div className="notifications-stat notifications-stat--unread">
            <span className="notifications-stat-value">{unreadCount}</span>
            <span className="notifications-stat-label">{t("notifications.unread")}</span>
          </div>
          <div className="notifications-stat">
            <span className="notifications-stat-value">{list.length}</span>
            <span className="notifications-stat-label">{t("notifications.statShowing")}</span>
          </div>
          {viewMode === "all" && list.length > 0 ? (
            <div className="notifications-stat">
              <span className="notifications-stat-value">{readInList}</span>
              <span className="notifications-stat-label">{t("notifications.statRead")}</span>
            </div>
          ) : null}
        </div>
      </header>

      <section className="notifications-toolbar card" aria-label={t("notifications.toolbarAriaLabel")}>
        <div className="notifications-segments" role="tablist" aria-label={t("notifications.tablistAriaLabel")}>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "all"}
            className={`notifications-segment${viewMode === "all" ? " is-active" : ""}`}
            onClick={() => setViewMode("all")}
          >
            {t("notifications.all")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "unread"}
            className={`notifications-segment${viewMode === "unread" ? " is-active" : ""}`}
            onClick={() => setViewMode("unread")}
          >
            {t("notifications.unread")}
            {unreadCount > 0 ? <span className="notifications-segment-count">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
          </button>
        </div>

        <div className="notifications-toolbar-actions">
          <label className="notifications-filter">
            <FaFilter aria-hidden />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label={t("notifications.statusFilterAriaLabel")}
            >
              <option value="">{t("notifications.statusFilterAll")}</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllRead}
            disabled={loadingAction === "all" || unreadCount === 0}
          >
            <FaCheckDouble aria-hidden />
            {loadingAction === "all" ? t("notifications.markAllSubmitting") : t("notifications.markAll")}
          </button>
        </div>
      </section>

      {error ? <p className="error notifications-error">{error}</p> : null}

      <div className="notifications-list">
        {list.length === 0 ? (
          <div className="notifications-empty card">
            <FaInbox className="notifications-empty-icon" aria-hidden />
            <h2>{t("notifications.emptyTitle")}</h2>
            <p className="muted">
              {viewMode === "unread"
                ? t("notifications.emptyUnread")
                : statusFilter
                  ? t("notifications.emptyStatusFilter")
                  : t("notifications.emptyDefault")}
            </p>
            <Link to="/reports/new" className="notifications-empty-cta">
              {t("notifications.emptyCta")}
            </Link>
          </div>
        ) : (
          list.map(n => {
            const meta = notificationMeta(n);
            const Icon = meta.Icon;
            return (
              <article
                key={n._id}
                className={`notification-card card${n.isRead ? "" : " notification-card--unread"}`}
              >
                {!n.isRead ? <span className="notification-card-unread-dot" aria-hidden /> : null}
                <div className={`notification-card-icon notification-card-icon--${meta.accent}`}>
                  <Icon aria-hidden />
                </div>
                <div className="notification-card-body">
                  <div className="notification-card-head">
                    <div className="notification-card-title-row">
                      {n.reportId?._id ? (
                        <Link to={`/reports/${n.reportId._id}`} className="notification-card-title">
                          {notificationTitle(n)}
                        </Link>
                      ) : (
                        <span className="notification-card-title">{notificationTitle(n)}</span>
                      )}
                      <span className={`notification-type-badge notification-type-badge--${meta.accent}`}>
                        {notificationTypeLabel(n)}
                      </span>
                    </div>
                    <time className="notification-card-time" dateTime={n.createdAt}>
                      {new Date(n.createdAt).toLocaleString(notificationDateLocale(i18n.language), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  <p className="notification-card-message">{notificationBody(n)}</p>
                  {n.type === "REPORT_STATUS" && n.data?.statusNote ? (
                    <p className="notification-card-note">
                      <strong>{t("notifications.adminNote")}</strong> {n.data.statusNote}
                    </p>
                  ) : null}
                  {!n.isRead ? (
                    <button
                      type="button"
                      className="notification-mark-read"
                      onClick={() => markRead(n._id)}
                      disabled={loadingAction === n._id}
                    >
                      {loadingAction === n._id ? t("notifications.markReadSubmitting") : t("notifications.markRead")}
                    </button>
                  ) : (
                    <span className="notification-read-label muted">{t("notifications.readLabel")}</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

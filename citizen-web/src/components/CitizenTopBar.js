import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBell,
  FaCity,
  FaClipboardList,
  FaLandmark,
  FaMapMarkedAlt,
  FaPlusCircle,
  FaQuestionCircle,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { getToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import NavNotificationBadge from "./NavNotificationBadge";
import LanguageSwitcher from "./LanguageSwitcher";
import "../App.css";

export default function CitizenTopBar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const authed = Boolean(getToken() && user);
  const { unreadCount } = useNotifications();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <FaCity />
        </span>
        {t("brand")}
      </Link>
      <nav className="topbar-nav">
        {authed ? (
          <>
            <NavLink to="/reports" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaClipboardList aria-hidden /> {t("nav.myReports")}
            </NavLink>
            <NavLink to="/reports/new" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaPlusCircle aria-hidden /> {t("nav.newReport")}
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaMapMarkedAlt aria-hidden /> {t("nav.map")}
            </NavLink>
            <NavLink to="/discover" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaLandmark aria-hidden /> {t("nav.discover")}
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `top-link top-link--alerts${isActive ? " active" : ""}${unreadCount > 0 ? " top-link--has-unread" : ""}`
              }
              aria-label={unreadCount > 0 ? t("nav.alertsUnread", { count: unreadCount }) : t("nav.alerts")}
            >
              <span className="top-link__bell-wrap" aria-hidden="true">
                <FaBell />
                <NavNotificationBadge count={unreadCount} />
              </span>
              {t("nav.alerts")}
            </NavLink>
            <NavLink to="/help" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaQuestionCircle aria-hidden /> {t("nav.help")}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaSignInAlt aria-hidden /> {t("nav.signIn")}
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaPlusCircle aria-hidden /> {t("nav.register")}
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaMapMarkedAlt aria-hidden /> {t("nav.map")}
            </NavLink>
            <NavLink to="/discover" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaLandmark aria-hidden /> {t("nav.discover")}
            </NavLink>
            <NavLink to="/help" className={({ isActive }) => `top-link ${isActive ? "active" : ""}`}>
              <FaQuestionCircle aria-hidden /> {t("nav.help")}
            </NavLink>
          </>
        )}
      </nav>
      <div className="topbar-actions">
        <LanguageSwitcher />
        {authed ? (
          <>
            <Link to="/profile" className="icon-action" aria-label={t("nav.profile")}>
              <FaUserCircle aria-hidden />
            </Link>
            <button type="button" className="secondary icon-action logout-action" onClick={logout} aria-label={t("nav.logout")}>
              <FaSignOutAlt aria-hidden />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

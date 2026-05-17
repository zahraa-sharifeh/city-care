import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBars, FaBell, FaCity, FaClipboardList, FaLandmark, FaMapMarkedAlt, FaPlusCircle, FaQuestionCircle, FaSignOutAlt, FaTimes, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useMobileNav } from "../hooks/useMobileNav";
import NavNotificationBadge from "./NavNotificationBadge";
import LanguageSwitcher from "./LanguageSwitcher";
import TopbarDrawerClose from "./TopbarDrawerClose";
import "../App.css";

export default function Layout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { menuOpen, toggleMenu, closeMenu } = useMobileNav();

  return (
    <div className={`app-shell${menuOpen ? " app-shell--nav-open" : ""}`}>
      <header className={`topbar${menuOpen ? " topbar--menu-open" : ""}`}>
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">
            <FaCity />
          </span>
          {t("brand")}
        </Link>

        {menuOpen ? (
          <button type="button" className="topbar-backdrop" aria-label={t("nav.closeMenu")} onClick={closeMenu} tabIndex={-1} />
        ) : null}

        <nav id="app-topbar-nav" className="topbar-nav" onClick={closeMenu}>
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
          <div className="topbar-nav-footer mobile-only">
            <LanguageSwitcher />
            <div className="topbar-nav-footer-actions">
              <Link to="/profile" className="icon-action" aria-label={t("nav.profile")}>
                <FaUserCircle aria-hidden />
              </Link>
              <button type="button" className="secondary icon-action logout-action" onClick={logout} aria-label={t("nav.logout")}>
                <FaSignOutAlt aria-hidden />
              </button>
            </div>
          </div>
        </nav>

        <div className="topbar-aside">
          <div className="desktop-only">
            <LanguageSwitcher />
          </div>
          <Link to="/profile" className="icon-action desktop-only" aria-label={t("nav.profile")}>
            <FaUserCircle aria-hidden />
          </Link>
          <button type="button" className="secondary icon-action logout-action desktop-only" onClick={logout} aria-label={t("nav.logout")}>
            <FaSignOutAlt aria-hidden />
          </button>
          <button
            type="button"
            className={`topbar-menu-btn mobile-only${menuOpen ? " topbar-menu-btn--open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="app-topbar-nav"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={toggleMenu}
          >
            {menuOpen ? <FaTimes aria-hidden /> : <FaBars aria-hidden />}
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

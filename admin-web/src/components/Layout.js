import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBars, FaChartBar, FaCity, FaClipboardList, FaKey, FaLandmark, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useMobileNav } from "../hooks/useMobileNav";
import LanguageSwitcher from "./LanguageSwitcher";
import TopbarDrawerClose from "./TopbarDrawerClose";
import "../App.css";

function roleLabel(role, t) {
  if (role === "SUPER_ADMIN") return t("roles.superAdmin");
  if (role === "DISTRICT_ADMIN") return t("roles.districtAdmin");
  return t("roles.admin");
}

export default function Layout() {
  const { t } = useTranslation();
  const { admin, logout } = useAdminAuth();
  const { menuOpen, toggleMenu, closeMenu } = useMobileNav();

  const navClass = ({ isActive }) => `top-link ${isActive ? "active" : ""}`;

  return (
    <div className={`app-shell${menuOpen ? " app-shell--nav-open" : ""}`}>
      <header className={`topbar${menuOpen ? " topbar--menu-open" : ""}`}>
        <Link to="/reports" className="brand" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">
            <FaCity />
          </span>
          {t("brand")}
        </Link>

        {menuOpen ? (
          <button type="button" className="topbar-backdrop" aria-label={t("nav.closeMenu")} onClick={closeMenu} tabIndex={-1} />
        ) : null}

        <nav id="admin-topbar-nav" className="topbar-nav" aria-label="Main navigation" onClick={closeMenu}>
          <TopbarDrawerClose onClose={closeMenu} label={t("nav.closeMenu")} />
          <NavLink to="/reports" className={navClass}>
            <FaClipboardList aria-hidden /> {t("nav.reports")}
          </NavLink>
          <NavLink to="/analytics" className={navClass}>
            <FaChartBar aria-hidden /> {t("nav.analytics")}
          </NavLink>
          <NavLink to="/district-spotlight" className={navClass}>
            <FaLandmark aria-hidden /> {t("nav.spotlight")}
          </NavLink>
          <NavLink to="/account/password" className={navClass}>
            <FaKey aria-hidden /> {t("nav.account")}
          </NavLink>
          <div className="topbar-nav-footer mobile-only">
            <LanguageSwitcher />
            <span className="user-chip" title={admin?.email || ""}>
              {admin?.fullName || t("roles.admin")} · {roleLabel(admin?.role, t)}
            </span>
            <div className="topbar-nav-footer-actions">
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
          <span className="user-chip desktop-only" title={admin?.email || ""}>
            {admin?.fullName || t("roles.admin")} · {roleLabel(admin?.role, t)}
          </span>
          <button type="button" className="secondary icon-action logout-action desktop-only" onClick={logout} aria-label={t("nav.logout")}>
            <FaSignOutAlt aria-hidden />
          </button>
          <button
            type="button"
            className={`topbar-menu-btn mobile-only${menuOpen ? " topbar-menu-btn--open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="admin-topbar-nav"
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


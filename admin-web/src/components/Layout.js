import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCity, FaLandmark, FaSignOutAlt, FaClipboardList, FaChartBar, FaKey } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import "../App.css";

function roleLabel(role, t) {
  if (role === "SUPER_ADMIN") return t("roles.superAdmin");
  if (role === "DISTRICT_ADMIN") return t("roles.districtAdmin");
  return t("roles.admin");
}

export default function Layout() {
  const { t } = useTranslation();
  const { admin, logout } = useAdminAuth();

  const navClass = ({ isActive }) => `top-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/reports" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <FaCity />
          </span>
          {t("brand")}
        </Link>

        <nav className="topbar-nav" aria-label="Main navigation">
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
        </nav>

        <div className="topbar-actions">
          <LanguageSwitcher />
          <span className="user-chip" title={`${admin?.email || ""}`}>
            {admin?.fullName || t("roles.admin")} · {roleLabel(admin?.role, t)}
          </span>
          <button type="button" className="secondary icon-action logout-action" onClick={logout} aria-label={t("nav.logout")}>
            <FaSignOutAlt aria-hidden />
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { FaChartBar, FaCity, FaClipboardList, FaLandmark } from "react-icons/fa";
import LanguageSwitcher from "./LanguageSwitcher";
import "../styles/auth.css";

export default function AuthLayout({ title, lead, children }) {
  const { t } = useTranslation();

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark" aria-hidden="true">
            <FaCity />
          </div>
          <h2>{t("auth.brandTitle")}</h2>
          <p>{t("auth.brandLead")}</p>
          <ul className="auth-brand-features">
            <li>
              <FaClipboardList aria-hidden />
              {t("auth.featureReports")}
            </li>
            <li>
              <FaChartBar aria-hidden />
              {t("auth.featureAnalytics")}
            </li>
            <li>
              <FaLandmark aria-hidden />
              {t("auth.featureSpotlight")}
            </li>
          </ul>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="auth-card">
          <header className="auth-card-head">
            <div className="auth-card-head-row">
              <div>
                <h1>{title}</h1>
                {lead ? <p className="auth-lead">{lead}</p> : null}
              </div>
              <LanguageSwitcher />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

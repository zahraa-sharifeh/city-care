import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaChevronDown,
  FaClipboardList,
  FaEye,
  FaLandmark,
  FaLightbulb,
  FaMapMarkedAlt,
  FaPlusCircle,
  FaQuestionCircle,
  FaSignInAlt,
  FaTasks,
  FaUserPlus,
} from "react-icons/fa";
import { getToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CitizenTopBar from "../components/CitizenTopBar";
import "../App.css";

const FAQ_META = [
  { id: "submit", icon: FaPlusCircle, accent: "sky" },
  { id: "track", icon: FaTasks, accent: "sage" },
  { id: "location", icon: FaMapMarkedAlt, accent: "peach" },
  { id: "privacy", icon: FaEye, accent: "lavender" },
];

const TIP_KEYS = ["photos", "pin", "duplicates", "oneIssue"];

function HelpShell({ children }) {
  return (
    <div className="app-shell discover-shell">
      <CitizenTopBar />
      <main className="main discover-main help-page">{children}</main>
    </div>
  );
}

function QuickLink({ to, icon, label, description, primary }) {
  return (
    <Link to={to} className={`help-quick-link${primary ? " help-quick-link--primary" : ""}`}>
      <span className="help-quick-link-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="help-quick-link-text">
        <span className="help-quick-link-label">{label}</span>
        {description ? <span className="help-quick-link-desc">{description}</span> : null}
      </span>
    </Link>
  );
}

function FaqItem({ item, open, onToggle }) {
  const Icon = item.icon;
  const panelId = `help-faq-${item.id}`;
  const buttonId = `help-faq-btn-${item.id}`;

  return (
    <article className={`help-faq-item help-faq-item--${item.accent}${open ? " is-open" : ""}`}>
      <button
        type="button"
        id={buttonId}
        className="help-faq-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={`help-faq-icon help-faq-icon--${item.accent}`} aria-hidden="true">
          <Icon />
        </span>
        <span className="help-faq-question">{item.q}</span>
        <FaChevronDown className="help-faq-chevron" aria-hidden />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="help-faq-panel"
        hidden={!open}
      >
        <p>{item.a}</p>
      </div>
    </article>
  );
}

export default function Help() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAuthenticated = Boolean(getToken() && user);

  const faqs = useMemo(
    () =>
      FAQ_META.map(({ id, icon, accent }) => ({
        id,
        icon,
        accent,
        q: t(`help.faq.${id}.q`),
        a: t(`help.faq.${id}.a`),
      })),
    [t]
  );

  const tips = useMemo(() => TIP_KEYS.map(key => t(`help.tips.${key}`)), [t]);

  const [openFaq, setOpenFaq] = useState(FAQ_META[0]?.id ?? null);

  return (
    <HelpShell>
      <header className="help-hero card">
        <div className="help-hero-main">
          <span className="help-hero-icon" aria-hidden="true">
            <FaQuestionCircle />
          </span>
          <div>
            <h1>{t("help.title")}</h1>
            <p className="muted help-hero-lead">{t("help.lead")}</p>
          </div>
        </div>
      </header>

      <section className="help-quick card" aria-labelledby="help-quick-heading">
        <h2 id="help-quick-heading" className="help-section-title">
          {t("help.quickLinks")}
        </h2>
        <div className="help-quick-grid">
          {isAuthenticated ? (
            <>
              <QuickLink
                to="/reports/new"
                icon={<FaPlusCircle />}
                label={t("nav.newReport")}
                description={t("help.quickNewReportDesc")}
                primary
              />
              <QuickLink
                to="/reports"
                icon={<FaClipboardList />}
                label={t("nav.myReports")}
                description={t("help.quickMyReportsDesc")}
              />
              <QuickLink
                to="/notifications"
                icon={<FaBell />}
                label={t("nav.alerts")}
                description={t("help.quickAlertsDesc")}
              />
              <QuickLink
                to="/map"
                icon={<FaMapMarkedAlt />}
                label={t("nav.map")}
                description={t("help.quickMapDescAuth")}
              />
            </>
          ) : (
            <>
              <QuickLink
                to="/register"
                icon={<FaUserPlus />}
                label={t("nav.register")}
                description={t("help.quickCreateAccountDesc")}
                primary
              />
              <QuickLink
                to="/login"
                icon={<FaSignInAlt />}
                label={t("nav.signIn")}
                description={t("help.quickSignInDesc")}
              />
              <QuickLink
                to="/map"
                icon={<FaMapMarkedAlt />}
                label={t("nav.map")}
                description={t("help.quickMapDescGuest")}
              />
              <QuickLink
                to="/discover"
                icon={<FaLandmark />}
                label={t("nav.discover")}
                description={t("help.quickDiscoverDesc")}
              />
            </>
          )}
        </div>
      </section>

      <section className="help-faq-section" aria-labelledby="help-faq-heading">
        <h2 id="help-faq-heading" className="help-section-title help-section-title--inset">
          {t("help.commonQuestions")}
        </h2>
        <div className="help-faq-list">
          {faqs.map(item => (
            <FaqItem
              key={item.id}
              item={item}
              open={openFaq === item.id}
              onToggle={() => setOpenFaq(prev => (prev === item.id ? null : item.id))}
            />
          ))}
        </div>
      </section>

      <section className="help-tips card" aria-labelledby="help-tips-heading">
        <div className="help-tips-head">
          <span className="help-tips-icon" aria-hidden="true">
            <FaLightbulb />
          </span>
          <h2 id="help-tips-heading" className="help-section-title help-section-title--flush">
            {t("help.reportingTips")}
          </h2>
        </div>
        <ul className="help-tips-list">
          {tips.map(tip => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <footer className="help-cta card">
        <p className="help-cta-text">{t("help.cta")}</p>
        <Link
          to={isAuthenticated ? "/reports/new" : "/register"}
          className="help-cta-btn"
        >
          <FaPlusCircle aria-hidden />
          {isAuthenticated ? t("help.createReport") : t("help.getStarted")}
        </Link>
      </footer>
    </HelpShell>
  );
}

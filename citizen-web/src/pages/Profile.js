import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaEnvelope, FaKey, FaMapMarkerAlt, FaPen, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../App.css";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const email = user?.email || "—";
  const districtLabel = user?.districtId?.name || t("profile.districtNotSet");

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <header className="profile-card-head">
          <p className="profile-eyebrow">{t("profile.eyebrow")}</p>
          <h1>{t("profile.title")}</h1>
        </header>

        <section className="profile-hero" aria-labelledby="profile-name-label">
          <div className="profile-avatar" aria-hidden="true">
            <FaUserCircle />
          </div>
          <div className="profile-hero-text">
            <span id="profile-name-label" className="visually-hidden">
              {t("profile.displayNameAriaLabel")}
            </span>
            <strong className="profile-name">{user?.fullName || t("profile.nameFallback")}</strong>
            <span className="profile-badge">{t("profile.badge")}</span>
          </div>
        </section>

        <ul className="profile-info-list" aria-label={t("profile.detailsAriaLabel")}>
          <li className="profile-info-row">
            <span className="profile-info-icon" aria-hidden="true">
              <FaEnvelope />
            </span>
            <div className="profile-info-body">
              <span className="profile-info-label">{t("auth.email")}</span>
              <span className="profile-info-value">{email}</span>
            </div>
          </li>
          <li className="profile-info-row">
            <span className="profile-info-icon" aria-hidden="true">
              <FaMapMarkerAlt />
            </span>
            <div className="profile-info-body">
              <span className="profile-info-label">{t("common.district")}</span>
              <span className="profile-info-value">{districtLabel}</span>
            </div>
          </li>
        </ul>

        <div className="profile-actions">
          <Link to="/account/profile" className="btn-primary">
            <FaPen aria-hidden />
            {t("profile.editProfile")}
          </Link>
          <Link to="/account/password" className="btn-ghost">
            <FaKey aria-hidden />
            {t("profile.changePassword")}
          </Link>
        </div>
      </div>
    </div>
  );
}

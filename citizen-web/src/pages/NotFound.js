import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../App.css";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="card" style={{ maxWidth: 560, margin: "2rem auto" }}>
      <h1>{t("notFound.title")}</h1>
      <p className="muted">{t("notFound.lead")}</p>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/" className="btn-link-inline">
          {t("notFound.back")}
        </Link>
      </p>
    </div>
  );
}

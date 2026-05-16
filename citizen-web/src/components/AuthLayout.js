import React from "react";

import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { FaArrowLeft, FaCity } from "react-icons/fa";

import LanguageSwitcher from "./LanguageSwitcher";

import "../styles/auth.css";



export default function AuthLayout({ title, lead, children }) {

  const { t } = useTranslation();



  return (

    <div className="auth-page">

      <aside className="auth-brand" aria-hidden="false">

        <div className="auth-brand-inner">

          <div className="auth-logo-mark" aria-hidden="true">

            <FaCity />

          </div>

          <h2>{t("auth.brandTitle")}</h2>

          <p>{t("auth.brandLead")}</p>

        </div>

      </aside>

      <div className="auth-panel">

        <div className="auth-card">

          <Link to="/" className="auth-back">

            <FaArrowLeft aria-hidden />

            {t("auth.backHome")}

          </Link>

          <header className="auth-card-head">

            <div className="auth-card-head-row">

              <div>

                <h1>{title}</h1>

                {lead ? <p className="auth-lead">{lead}</p> : null}

              </div>

              <LanguageSwitcher />

            </div>

          </header>

          <div className="auth-card-body">{children}</div>

        </div>

      </div>

    </div>

  );

}


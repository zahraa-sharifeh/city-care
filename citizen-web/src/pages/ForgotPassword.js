import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { apiFetch } from "../api/client";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewToken, setPreviewToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    setSuccess("");
    setPreviewToken("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(data?.message || t("forgotPassword.successDefault"));
      if (data?.previewResetToken) {
        setPreviewToken(data.previewResetToken);
      }
    } catch (err) {
      setError(err.message || t("forgotPassword.errorDefault"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("auth.forgotTitle")} lead={t("forgotPassword.lead")}>
      <form className="auth-form" onSubmit={handleFormSubmit(onSubmit)}>
        <div className="auth-field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}
        {previewToken ? (
          <div className="auth-note">
            <strong>{t("forgotPassword.devTokenLabel")}</strong> <code>{previewToken}</code>{" "}
            <Link to={`/reset-password?token=${encodeURIComponent(previewToken)}`}>{t("forgotPassword.openResetPage")}</Link>
          </div>
        ) : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
        </button>
      </form>
      <div className="auth-footer-strip">
        <p className="auth-footer">
          {t("forgotPassword.footerPrompt")} <Link to="/login">{t("forgotPassword.footerSignIn")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

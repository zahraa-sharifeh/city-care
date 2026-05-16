import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthPasswordField from "../components/AuthPasswordField";
import { apiFetch } from "../api/client";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    setSuccess("");

    if (newPassword !== confirm) {
      setError(t("resetPassword.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(data?.message || t("resetPassword.successDefault"));
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || t("resetPassword.errorDefault"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("auth.resetTitle")} lead={t("resetPassword.lead")}>
      <form className="auth-form" onSubmit={handleFormSubmit(onSubmit)}>
        <div className="auth-field">
          <label htmlFor="token">{t("resetPassword.tokenLabel")}</label>
          <input
            id="token"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            placeholder={t("resetPassword.tokenPlaceholder")}
          />
        </div>
        <AuthPasswordField
          id="newPassword"
          label={t("auth.password")}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("register.passwordPlaceholder")}
          disabled={loading}
        />
        <AuthPasswordField
          id="confirmPassword"
          label={t("resetPassword.confirmLabel")}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("resetPassword.confirmPlaceholder")}
          disabled={loading}
        />
        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("resetPassword.submitting") : t("auth.resetTitle")}
        </button>
      </form>
      <div className="auth-footer-strip">
        <p className="auth-footer">
          {t("resetPassword.footerPrefix")} <Link to="/login">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

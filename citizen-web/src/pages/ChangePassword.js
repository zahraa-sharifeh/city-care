import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import AuthPasswordField from "../components/AuthPasswordField";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

export default function ChangePassword() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    setSuccess("");
    if (newPassword !== confirm) {
      setError(t("changePassword.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(t("changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || t("changePassword.errorDefault"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="card change-password-card">
        <header className="change-password-head">
          <h1>{t("profile.changePassword")}</h1>
          <p className="muted">{t("changePassword.lead")}</p>
        </header>
        <form className="form-grid change-password-form" onSubmit={handleFormSubmit(onSubmit)}>
          <AuthPasswordField
            id="currentPassword"
            label={t("changePassword.currentLabel")}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
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
            label={t("changePassword.confirmLabel")}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("changePassword.confirmPlaceholder")}
            disabled={loading}
          />
          {error ? <p className="error">{error}</p> : null}
          {success ? (
            <p className="auth-success" role="status">
              {success}
            </p>
          ) : null}
          <button type="submit" disabled={loading}>
            {loading ? t("resetPassword.submitting") : t("changePassword.submit")}
          </button>
        </form>
        <p className="muted change-password-footer">
          <Link to="/profile" className="btn-link-inline">
            {t("changePassword.backToProfile")}
          </Link>
        </p>
      </div>
    </div>
  );
}

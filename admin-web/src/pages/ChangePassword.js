import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
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
      setError(t("account.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/admin/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(t("account.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || t("account.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-page">
      <div className="card account-card">
      <h1>{t("account.changePassword")}</h1>
      <p className="muted">{t("account.lead")}</p>
      <form className="form-grid" onSubmit={handleFormSubmit(onSubmit)} style={{ marginTop: "1.15rem" }}>
        <div>
          <label htmlFor="cur">{t("account.currentPassword")}</label>
          <input
            id="cur"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder={t("account.currentPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="nw">{t("account.newPassword")}</label>
          <input
            id="nw"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("account.newPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="cf">{t("account.confirmPassword")}</label>
          <input
            id="cf"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("account.confirmPlaceholder")}
          />
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {success ? (
          <p
            style={{
              margin: 0,
              padding: "0.65rem 0.75rem",
              borderRadius: 10,
              fontSize: "0.875rem",
              color: "#1b4332",
              background: "rgba(64, 145, 108, 0.15)",
              border: "1px solid rgba(64, 145, 108, 0.28)",
            }}
            role="status"
          >
            {success}
          </p>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("account.updatePassword")}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1.15rem" }}>
        <Link to="/reports">{t("account.backToReports")}</Link>
      </p>
      </div>
    </div>
  );
}

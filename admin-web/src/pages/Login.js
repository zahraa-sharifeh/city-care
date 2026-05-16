import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import AuthLayout from "../components/AuthLayout";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const from = location.state?.from || "/reports";

  async function onSubmit() {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("auth.consoleTitle")} lead={t("auth.consoleLead")}>
      <form className="auth-form" onSubmit={handleFormSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="email">{t("auth.email")}</label>
          <div className="auth-input-wrap">
            <FaEnvelope className="auth-input-icon" aria-hidden />
            <input
              id="email"
              className="auth-input-with-icon"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin@example.com"
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="password">{t("auth.password")}</label>
          <div className="auth-input-wrap">
            <FaLock className="auth-input-icon" aria-hidden />
            <input
              id="password"
              className="auth-input-with-icon"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </div>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          <FaSignInAlt aria-hidden className={loading ? "auth-submit-spin" : undefined} />
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>
    </AuthLayout>
  );
}

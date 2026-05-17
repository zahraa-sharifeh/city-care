import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthPasswordField from "../components/AuthPasswordField";
import GoogleCitizenSignIn, { isGoogleSignInConfigured } from "../components/GoogleCitizenSignIn";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

export default function Login() {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
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
    <AuthLayout title={t("auth.welcomeBack")} lead={t("auth.loginLead")}>
      <div className="auth-oauth-panel">
        {isGoogleSignInConfigured() ? (
          <>
            <GoogleCitizenSignIn
              disabled={loading}
              onSuccess={async credential => {
                setError("");
                await loginWithGoogle(credential);
                navigate(from, { replace: true });
              }}
              onError={msg => setError(msg)}
            />
            <div className="auth-divider-or">
              <span className="auth-divider-or__line" aria-hidden="true" />
              <span className="auth-divider-or__text">or continue with email</span>
              <span className="auth-divider-or__line" aria-hidden="true" />
            </div>
          </>
        ) : (
          <p className="auth-google-hint" role="note">
            <strong className="auth-google-hint__title">Google sign-in</strong>
            <span className="auth-google-hint__body">
              {" "}
              Set <code>REACT_APP_GOOGLE_CLIENT_ID</code> in <code>citizen-web/.env</code> and <code>GOOGLE_CLIENT_ID</code> in <code>backend/.env</code> (same Web client ID). Stop and restart <code>npm start</code> in both folders — hot reload does not load new <code>REACT_APP_*</code> values. Use the citizen app at{" "}
              <a href="http://localhost:3001/login">http://localhost:3001</a> and add that URL under Authorized JavaScript origins in Google Cloud Console.
            </span>
          </p>
        )}
      </div>

      <form className="auth-form" onSubmit={handleFormSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" placeholder="you@example.com" />
        </div>
        <AuthPasswordField
          id="password"
          label={t("auth.password")}
          labelExtra={
            <Link to="/forgot-password" className="auth-inline-link">
              {t("auth.forgotPassword")}
            </Link>
          }
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={loading}
        />
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("auth.signingIn") : t("auth.signInLink")}
        </button>
      </form>

      <div className="auth-footer-strip">
        <p className="auth-footer">
          {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

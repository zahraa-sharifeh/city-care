import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import AuthPasswordField from "../components/AuthPasswordField";
import GoogleCitizenSignIn, { isGoogleSignInConfigured } from "../components/GoogleCitizenSignIn";
import { handleFormSubmit } from "../utils/formSubmit";
import { passwordPolicyMessage, validatePassword } from "../utils/passwordPolicy";
import "../App.css";

export default function Register() {
  const { t } = useTranslation();
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/governorates");
        if (!cancelled) setGovernorates(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!governorateId) {
      setDistricts([]);
      setDistrictId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/districts?governorateId=${encodeURIComponent(governorateId)}`);
        if (!cancelled) setDistricts(data);
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [governorateId]);

  async function onSubmit() {
    setError("");
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      setError(passwordPolicyMessage(t, passwordCheck.code));
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        ...(districtId ? { districtId } : {}),
      });
      navigate("/reports", { replace: true });
    } catch (err) {
      setError(err.message || t("register.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("register.title")} lead={t("register.lead")}>
      <div className="auth-oauth-panel">
        {isGoogleSignInConfigured() ? (
          <>
            <GoogleCitizenSignIn
              disabled={loading}
              onSuccess={async credential => {
                setError("");
                await loginWithGoogle(credential);
                navigate("/reports", { replace: true });
              }}
              onError={msg => setError(msg)}
            />
            <div className="auth-divider-or">
              <span className="auth-divider-or__line" aria-hidden="true" />
              <span className="auth-divider-or__text">{t("register.dividerOr")}</span>
              <span className="auth-divider-or__line" aria-hidden="true" />
            </div>
          </>
        ) : (
          <p className="auth-google-hint" role="note">
            <strong className="auth-google-hint__title">{t("register.googleHintTitle")}</strong>
            <span className="auth-google-hint__body">
              {" "}
              Set <code>REACT_APP_GOOGLE_CLIENT_ID</code> in <code>citizen-web/.env</code> and <code>GOOGLE_CLIENT_ID</code> in <code>backend/.env</code> (same Web client ID). Stop and restart <code>npm start</code> in both folders — hot reload does not load new <code>REACT_APP_*</code> values. Use the citizen app at{" "}
              <a href="http://localhost:3001/register">http://localhost:3001</a> and add that URL under Authorized JavaScript origins in Google Cloud Console.
            </span>
          </p>
        )}
      </div>

      <form className="auth-form auth-form--register" onSubmit={handleFormSubmit(onSubmit)} noValidate>
        <div className="auth-form-bigrid">
          <div className="auth-field">
            <label htmlFor="fullName">{t("auth.fullName")}</label>
            <input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              minLength={2}
              placeholder={t("register.fullNamePlaceholder")}
              autoComplete="name"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <AuthPasswordField
            id="password"
            label={t("auth.password")}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t("register.passwordPlaceholder")}
            disabled={loading}
            hint={<p className="auth-field-hint">{t("register.passwordHint")}</p>}
          />
        </div>

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("register.submitting") : t("auth.createAccount")}
        </button>
      </form>

      <div className="auth-footer-strip">
        <p className="auth-footer">
          {t("register.footerPrompt")} <Link to="/login">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

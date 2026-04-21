import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import "../App.css";

export default function Register() {
  const { register } = useAuth();
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

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
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
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Join City Care"
      lead="Create your citizen account. Adding your district is optional and helps us show more relevant context later."
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} placeholder="Your name" autoComplete="name" />
        </div>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
        </div>
        <div className="auth-divider" />
        <div className="auth-field">
          <label htmlFor="gov">Governorate (optional)</label>
          <select id="gov" value={governorateId} onChange={e => setGovernorateId(e.target.value)}>
            <option value="">Choose if you like</option>
            {governorates.map(g => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="auth-field">
          <label htmlFor="dist">District (optional)</label>
          <select id="dist" value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!governorateId}>
            <option value="">—</option>
            {districts.map(d => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

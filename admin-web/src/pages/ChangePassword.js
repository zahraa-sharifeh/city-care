import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../App.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/admin/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess("Password updated. Use the new password next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <h1>Change password</h1>
      <p className="muted">Enter your current password, then a new one (at least 6 characters).</p>
      <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.15rem" }}>
        <div>
          <label htmlFor="cur">Current password</label>
          <input
            id="cur"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="nw">New password</label>
          <input
            id="nw"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label htmlFor="cf">Confirm new password</label>
          <input
            id="cf"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Repeat new password"
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
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1.15rem" }}>
        <Link to="/reports">Back to reports</Link>
      </p>
    </div>
  );
}

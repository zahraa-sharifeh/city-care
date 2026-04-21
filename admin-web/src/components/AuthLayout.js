import React from "react";
import "../styles/auth.css";

export default function AuthLayout({ title, lead, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 19V9l5-4 5 4v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.08)" />
              <path d="M10 13h4v6h-4v-6z" stroke="currentColor" strokeWidth="1.3" fill="rgba(255,255,255,0.06)" />
            </svg>
          </div>
          <h2>City Care · Admin</h2>
          <p>Review reports, update status, and keep response times transparent — one console for your municipality.</p>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          {lead ? <p className="auth-lead">{lead}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

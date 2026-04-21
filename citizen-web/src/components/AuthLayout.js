import React from "react";
import "../styles/auth.css";

export default function AuthLayout({ title, lead, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand" aria-hidden="false">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark" aria-hidden="true">
            {/* Simple leaf / location motif */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M12 22c4-6 8-9 8-14a8 8 0 10-16 0c0 5 4 8 8 14z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
              />
              <path d="M12 8v6M9 11h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <h2>City Care</h2>
          <p>Report road damage, lighting, waste, and water issues in one place. Clear updates, less friction — a greener path for your city.</p>
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

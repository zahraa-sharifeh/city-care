import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../App.css";

export default function Layout() {
  const { admin, logout } = useAdminAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/">City Care · Admin</Link>
        <div style={{ display: "flex", gap: "1.1rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/reports">Reports</Link>
          <Link to="/account/password">Change password</Link>
          <span className="muted" style={{ color: "rgba(248,250,248,0.88)" }}>
            {admin?.fullName} · {admin?.role}
          </span>
          <button type="button" className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

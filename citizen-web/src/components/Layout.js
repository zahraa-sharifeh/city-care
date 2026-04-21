import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/">City Care</Link>
        <nav>
          <Link to="/reports">My reports</Link>
          <Link to="/reports/new">New report</Link>
          <span className="muted" style={{ color: "rgba(255,255,255,0.85)" }}>
            {user?.fullName}
          </span>
          <button type="button" className="secondary" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

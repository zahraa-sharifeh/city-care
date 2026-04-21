import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../App.css";

export default function MyReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/reports/mine");
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  return (
    <div className="card">
      <h1>My reports</h1>
      <p className="muted">You have {data.total} report(s).</p>
      <div className="report-list" style={{ marginTop: "1rem" }}>
        {data.items.length === 0 ? (
          <p>
            No reports yet. <Link to="/reports/new">Create one</Link>
          </p>
        ) : (
          data.items.map(r => (
            <div key={r._id} className="report-row">
              <Link to={`/reports/${r._id}`}>{r.category}</Link>
              <div className="muted">
                {r.districtId?.name || "District"} · {new Date(r.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="badge">{r.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

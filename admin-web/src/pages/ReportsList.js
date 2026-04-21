import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../App.css";

const STATUSES = ["", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export default function ReportsList() {
  const { admin } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (admin?.role === "SUPER_ADMIN" && districtId) params.set("districtId", districtId);
      const res = await apiFetch(`/api/admin/reports?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e.message);
    }
  }, [page, status, districtId, admin?.role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card">
      <h1>Reports</h1>
      <div className="toolbar">
        <div>
          <label htmlFor="st">Status</label>
          <select id="st" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </div>
        {admin?.role === "SUPER_ADMIN" ? (
          <div>
            <label htmlFor="dist">District ID filter</label>
            <input
              id="dist"
              placeholder="Mongo ObjectId"
              value={districtId}
              onChange={e => { setDistrictId(e.target.value.trim()); setPage(1); }}
            />
          </div>
        ) : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {!data ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <p className="muted">
            Page {data.page} of {data.pages} · {data.total} total
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>District</th>
                  <th>Citizen</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map(r => (
                  <tr key={r._id}>
                    <td>{r.category}</td>
                    <td>
                      <span className="badge">{r.status}</span>
                    </td>
                    <td>{r.districtId?.name || "—"}</td>
                    <td>{r.userId?.fullName || "—"}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <Link to={`/reports/${r._id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row-actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </button>
            <button type="button" className="secondary" disabled={page >= (data.pages || 1)} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

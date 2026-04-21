import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../App.css";

const STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export default function AdminReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const [r, c] = await Promise.all([
        apiFetch(`/api/admin/reports/${id}`),
        apiFetch(`/api/reports/${id}/comments`),
      ]);
      setReport(r);
      setStatus(r.status);
      setComments(c);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveStatus(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReport(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!report && !error) return <p className="muted">Loading…</p>;
  if (error && !report) return <p className="error">{error}</p>;
  if (!report) return null;

  return (
    <div className="card">
      <button type="button" className="secondary" style={{ marginBottom: "1rem" }} onClick={() => navigate(-1)}>
        Back
      </button>
      <h1>{report.category}</h1>
      <p>
        <span className="badge">{report.status}</span>{" "}
        <span className="muted">
          {report.governorateId?.name} · {report.districtId?.name}
        </span>
      </p>
      <p>{report.description}</p>
      <p className="muted">
        <strong>Location:</strong> {report.locationDescription}
      </p>
      <p className="muted">
        <strong>Citizen:</strong> {report.userId?.fullName} ({report.userId?.email})
      </p>
      <div>
        {report.images?.map(src => (
          <a key={src} href={src} target="_blank" rel="noreferrer">
            <img className="thumb" src={src} alt="" />
          </a>
        ))}
      </div>

      <form className="form-grid" style={{ marginTop: "1.25rem", maxWidth: 360 }} onSubmit={saveStatus}>
        <div>
          <label htmlFor="st">Update status</label>
          <select id="st" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={saving || status === report.status}>
          {saving ? "Saving…" : "Save status"}
        </button>
      </form>

      <h2 style={{ marginTop: "1.5rem" }}>Comments</h2>
      {comments.length === 0 ? <p className="muted">No comments.</p> : null}
      {comments.map(c => (
        <div key={c._id} className="comment">
          <strong>{c.userId?.fullName || "Citizen"}</strong>
          <span className="muted"> · {new Date(c.createdAt).toLocaleString()}</span>
          <div>{c.text}</div>
        </div>
      ))}
    </div>
  );
}

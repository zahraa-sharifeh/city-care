import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../App.css";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        apiFetch(`/api/reports/${id}`),
        apiFetch(`/api/reports/${id}/comments`),
      ]);
      setReport(r);
      setComments(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addComment(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/api/reports/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setText("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error && !report) return <p className="error">{error}</p>;
  if (!report) return null;

  return (
    <div className="card">
      <h1>{report.category}</h1>
      <p>
        <span className="badge">{report.status}</span>{" "}
        <span className="muted">
          {report.districtId?.name} · {new Date(report.createdAt).toLocaleString()}
        </span>
      </p>
      <p>{report.description}</p>
      <p className="muted">
        <strong>Where:</strong> {report.locationDescription}
      </p>
      <div>
        {report.images?.map(src => (
          <a key={src} href={src} target="_blank" rel="noreferrer">
            <img className="thumb" src={src} alt="" />
          </a>
        ))}
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Comments</h2>
      {comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
      {comments.map(c => (
        <div key={c._id} className="comment">
          <strong>{c.userId?.fullName || "You"}</strong>
          <span className="muted"> · {new Date(c.createdAt).toLocaleString()}</span>
          <div>{c.text}</div>
        </div>
      ))}

      <form className="form-grid" style={{ marginTop: "1rem" }} onSubmit={addComment}>
        <div>
          <label htmlFor="ctext">Add a comment</label>
          <textarea id="ctext" rows={3} value={text} onChange={e => setText(e.target.value)} required maxLength={1000} />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Post comment</button>
      </form>
    </div>
  );
}

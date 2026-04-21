import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getToken } from "../api/client";
import "../App.css";

export default function CreateReport() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [lat, setLat] = useState("33.8938");
  const [lng, setLng] = useState("35.5018");
  const [files, setFiles] = useState([]);
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
    if (!files.length) {
      setError("Please attach at least one image.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("description", description);
      fd.append("locationDescription", locationDescription);
      fd.append("governorateId", governorateId);
      fd.append("districtId", districtId);
      fd.append("lat", lat);
      fd.append("lng", lng);
      for (let i = 0; i < files.length; i += 1) {
        fd.append("images", files[i]);
      }
      const base = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const res = await fetch(`${base}/api/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      navigate(`/reports/${data._id}`);
    } catch (err) {
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>New report</h1>
      <form className="form-grid" onSubmit={onSubmit}>
        <div>
          <label htmlFor="cat">Category</label>
          <input id="cat" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Pothole, Streetlight" />
        </div>
        <div>
          <label htmlFor="desc">Description</label>
          <textarea id="desc" rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="gov">Governorate</label>
          <select id="gov" value={governorateId} onChange={e => setGovernorateId(e.target.value)} required>
            <option value="">Select…</option>
            {governorates.map(g => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dist">District</label>
          <select id="dist" value={districtId} onChange={e => setDistrictId(e.target.value)} required disabled={!governorateId}>
            <option value="">Select…</option>
            {districts.map(d => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="locDesc">Location description</label>
          <input
            id="locDesc"
            value={locationDescription}
            onChange={e => setLocationDescription(e.target.value)}
            required
            placeholder="Street, landmark, building…"
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label htmlFor="lat">Latitude</label>
            <input id="lat" value={lat} onChange={e => setLat(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="lng">Longitude</label>
            <input id="lng" value={lng} onChange={e => setLng(e.target.value)} required />
          </div>
        </div>
        <div>
          <label htmlFor="imgs">Photos (1–5)</label>
          <input
            id="imgs"
            type="file"
            accept="image/*"
            multiple
            onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 5))}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}

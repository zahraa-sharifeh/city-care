import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import DownwardSelect from "../components/DownwardSelect";
import { useAuth } from "../context/AuthContext";
import { clearFormDraft, readFormDraft, writeFormDraft } from "../utils/formDraft";
import { handleFormSubmit } from "../utils/formSubmit";
import "../App.css";

const EDIT_PROFILE_DRAFT_KEY = "citycare:edit-profile-draft";

export default function EditProfile() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const profileHydratedRef = useRef(false);

  const governorateOptions = useMemo(
    () => governorates.map(g => ({ value: g._id, label: g.name })),
    [governorates]
  );
  const districtOptions = useMemo(
    () => districts.map(d => ({ value: d._id, label: d.name })),
    [districts]
  );

  const selectedGovernorate = governorateOptions.find(o => o.value === governorateId) || null;
  const selectedDistrict = districtOptions.find(o => o.value === districtId) || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [govs, meRes] = await Promise.all([apiFetch("/api/governorates"), apiFetch("/api/auth/me")]);
        if (cancelled) return;
        setGovernorates(govs);
        const me = meRes.user;
        const draft = readFormDraft(EDIT_PROFILE_DRAFT_KEY);
        const govId = me?.districtId?.governorateId?._id || me?.districtId?.governorateId || "";

        if (draft) {
          setFullName(typeof draft.fullName === "string" ? draft.fullName : me.fullName || "");
          setEmail(typeof draft.email === "string" ? draft.email : me.email || "");
          setGovernorateId(typeof draft.governorateId === "string" ? draft.governorateId : govId || "");
          setDistrictId(
            typeof draft.districtId === "string" ? draft.districtId : me?.districtId?._id || me?.districtId || ""
          );
          setDraftRestored(true);
        } else {
          setFullName(me.fullName || "");
          setEmail(me.email || "");
          setGovernorateId(govId || "");
          setDistrictId(me?.districtId?._id || me?.districtId || "");
        }
      } catch (e) {
        if (!cancelled) setError(e.message || t("editProfile.loadError"));
      } finally {
        if (!cancelled) profileHydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

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

  useEffect(() => {
    if (!profileHydratedRef.current) return;

    const timer = window.setTimeout(() => {
      const hasContent = fullName.trim() || email.trim() || governorateId || districtId;
      if (!hasContent) {
        clearFormDraft(EDIT_PROFILE_DRAFT_KEY);
        return;
      }

      writeFormDraft(EDIT_PROFILE_DRAFT_KEY, {
        fullName,
        email,
        governorateId,
        districtId,
        savedAt: Date.now(),
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [fullName, email, governorateId, districtId]);

  async function onSubmit() {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          email,
          districtId: districtId || null,
        }),
      });
      await refreshUser(data.user);
      clearFormDraft(EDIT_PROFILE_DRAFT_KEY);
      setDraftRestored(false);
      setSuccess(t("editProfile.success"));
    } catch (err) {
      setError(err.message || t("editProfile.errorDefault"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "1.5rem auto" }}>
      <h1>{t("profile.editProfile")}</h1>
      <p className="muted">{t("editProfile.lead")}</p>
      {draftRestored ? (
        <p className="muted form-draft-notice" role="status">
          {t("editProfile.draftRestored")}
          <button
            type="button"
            className="secondary form-draft-clear"
            onClick={() => {
              clearFormDraft(EDIT_PROFILE_DRAFT_KEY);
              setDraftRestored(false);
              profileHydratedRef.current = false;
              setError("");
              setSuccess("");
              (async () => {
                try {
                  const [govs, meRes] = await Promise.all([apiFetch("/api/governorates"), apiFetch("/api/auth/me")]);
                  const me = meRes.user;
                  setGovernorates(govs);
                  const govId = me?.districtId?.governorateId?._id || me?.districtId?.governorateId || "";
                  setFullName(me.fullName || "");
                  setEmail(me.email || "");
                  setGovernorateId(govId || "");
                  setDistrictId(me?.districtId?._id || me?.districtId || "");
                } catch (e) {
                  setError(e.message || t("editProfile.reloadError"));
                } finally {
                  profileHydratedRef.current = true;
                }
              })();
            }}
          >
            {t("editProfile.discardDraft")}
          </button>
        </p>
      ) : null}
      <form className="form-grid" style={{ marginTop: "1rem" }} onSubmit={handleFormSubmit(onSubmit)}>
        <div>
          <label htmlFor="fullName">{t("auth.fullName")}</label>
          <input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <label htmlFor="email">{t("auth.email")}</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="gov">{t("common.governorate")}</label>
          <DownwardSelect
            inputId="gov"
            instanceId="gov-select"
            value={selectedGovernorate}
            onChange={option => setGovernorateId(option?.value || "")}
            options={governorateOptions}
            isClearable
            placeholder={t("editProfile.choosePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="dist">{t("common.district")}</label>
          <DownwardSelect
            inputId="dist"
            instanceId="dist-select"
            value={selectedDistrict}
            onChange={option => setDistrictId(option?.value || "")}
            options={districtOptions}
            placeholder={!governorateId ? t("common.selectGovernorateFirst") : t("editProfile.choosePlaceholder")}
            isDisabled={!governorateId}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? t("resetPassword.submitting") : t("editProfile.submit")}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        <Link to="/profile" className="btn-link-inline">
          {t("editProfile.backToProfile")}
        </Link>
      </p>
    </div>
  );
}

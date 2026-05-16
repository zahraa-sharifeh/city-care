import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { apiFetch, getToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { handleFormSubmit } from "../utils/formSubmit";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import "../App.css";

export default function ReportInteractions({ reportId, afterLoginPath }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const authedCitizen = Boolean(getToken() && user);
  const loginReturn = afterLoginPath || `/explore/reports/${reportId}`;

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [text, setText] = useState("");
  const [postError, setPostError] = useState("");

  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const loadLikes = useCallback(async () => {
    try {
      const d = await apiFetch(`/api/reports/${reportId}/likes`);
      setLikeCount(typeof d.count === "number" ? d.count : 0);
      setLikedByMe(Boolean(d.likedByMe));
    } catch {
      setLikeCount(0);
      setLikedByMe(false);
    }
  }, [reportId]);

  const loadComments = useCallback(async () => {
    if (!authedCitizen) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }
    setCommentsLoading(true);
    setCommentsError("");
    try {
      const list = await apiFetch(`/api/reports/${reportId}/comments`);
      setComments(Array.isArray(list) ? list : []);
    } catch (e) {
      setCommentsError(e.message || t("interactions.loadCommentsError"));
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [reportId, authedCitizen, t]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const refreshInteractions = useCallback(() => {
    loadLikes();
    if (authedCitizen) loadComments();
  }, [loadLikes, loadComments, authedCitizen]);

  useRefetchOnFocus(refreshInteractions, [reportId, authedCitizen]);

  async function postComment() {
    setPostError("");
    try {
      await apiFetch(`/api/reports/${reportId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setText("");
      await loadComments();
    } catch (err) {
      setPostError(err.message || t("interactions.postError"));
    }
  }

  async function toggleLike() {
    if (!authedCitizen) return;
    setLikeLoading(true);
    try {
      const d = await apiFetch(`/api/reports/${reportId}/likes`, { method: "POST" });
      setLikeCount(typeof d.count === "number" ? d.count : 0);
      setLikedByMe(Boolean(d.likedByMe));
    } catch {
      /* keep previous */
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <section className="report-interactions" aria-label={t("interactions.ariaLabel")}>
      <div className="report-like-row">
        <button
          type="button"
          className={`report-like-btn ${likedByMe ? "is-liked" : ""}`}
          onClick={toggleLike}
          disabled={likeLoading || !authedCitizen}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? t("interactions.unlikeAriaLabel") : t("interactions.likeAriaLabel")}
        >
          {likedByMe ? <FaHeart aria-hidden /> : <FaRegHeart aria-hidden />}
          <span className="report-like-count">{likeCount}</span>
        </button>
        {!authedCitizen ? (
          <span className="muted report-like-hint">
            <Link to="/login" state={{ from: loginReturn }}>
              {t("interactions.signIn")}
            </Link>{" "}
            {t("interactions.signInHint")}
          </span>
        ) : (
          <span className="muted report-like-hint">
            {likedByMe ? t("interactions.supported") : t("interactions.tapToSupport")}
          </span>
        )}
      </div>

      <h3 className="report-interactions-heading">{t("interactions.commentsTitle")}</h3>
      {!authedCitizen ? (
        <p className="muted">
          <Link to="/login" state={{ from: loginReturn }}>
            {t("interactions.signIn")}
          </Link>{" "}
          {t("interactions.signInDiscuss")}
        </p>
      ) : commentsLoading ? (
        <p className="muted">{t("interactions.loadingComments")}</p>
      ) : commentsError ? (
        <p className="error">{commentsError}</p>
      ) : comments.length === 0 ? (
        <p className="muted">{t("interactions.noComments")}</p>
      ) : null}

      {authedCitizen && !commentsLoading && comments.length > 0
        ? comments.map(c => (
            <div key={c._id} className="comment">
              <strong>
                {String(c.userId?._id) === String(user?.id)
                  ? t("interactions.authorYou")
                  : c.userId?.fullName || t("interactions.authorFallback")}
              </strong>
              <span className="muted"> · {new Date(c.createdAt).toLocaleString()}</span>
              <div>{c.text}</div>
            </div>
          ))
        : null}

      {authedCitizen ? (
        <form className="form-grid" style={{ marginTop: "1rem" }} onSubmit={handleFormSubmit(postComment)}>
          <div>
            <label htmlFor={`comment-${reportId}`}>{t("interactions.addComment")}</label>
            <textarea
              id={`comment-${reportId}`}
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              required
              maxLength={1000}
              placeholder={t("interactions.commentPlaceholder")}
            />
          </div>
          {postError ? <p className="error">{postError}</p> : null}
          <button type="submit">{t("interactions.postComment")}</button>
        </form>
      ) : null}
    </section>
  );
}

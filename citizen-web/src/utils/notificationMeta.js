import { FaCommentDots, FaHeart, FaInfoCircle, FaSyncAlt } from "react-icons/fa";
import i18n from "../i18n";
import { resolveIssueCategory } from "../constants/issueCategories";
import { getStatusLabel } from "./statusLabels";

function categoryLabel(n) {
  const raw = n.data?.category || n.reportId?.category;
  return resolveIssueCategory(raw).label;
}

function commentPreviewFromMessage(n) {
  const msg = typeof n.message === "string" ? n.message : "";
  const idx = msg.lastIndexOf(": ");
  if (idx >= 0) return msg.slice(idx + 2).trim();
  return "";
}

export function notificationTypeLabel(n) {
  if (n.type === "REPORT_COMMENT") return i18n.t("notifications.type.newComment");
  if (n.type === "REPORT_LIKE") return i18n.t("notifications.type.newLike");
  return getStatusLabel(n.data?.status || n.reportId?.status);
}

export function notificationTitle(n) {
  if (n.type === "REPORT_COMMENT") return i18n.t("notifications.itemTitle.newComment");
  if (n.type === "REPORT_LIKE") return i18n.t("notifications.itemTitle.newLike");
  if (n.type === "REPORT_STATUS") return i18n.t("notifications.itemTitle.statusUpdated");
  return n.title || i18n.t("notifications.body.generic");
}

export function notificationMeta(n) {
  if (n.type === "REPORT_COMMENT") {
    return {
      Icon: FaCommentDots,
      accent: "comment",
      label: i18n.t("notifications.meta.comment"),
    };
  }
  if (n.type === "REPORT_LIKE") {
    return {
      Icon: FaHeart,
      accent: "like",
      label: i18n.t("notifications.meta.like"),
    };
  }

  const status = n.data?.status || n.reportId?.status;
  if (status === "IN_PROGRESS") {
    return { Icon: FaSyncAlt, accent: "progress", label: getStatusLabel(status) };
  }
  if (status === "RESOLVED") {
    return { Icon: FaInfoCircle, accent: "resolved", label: getStatusLabel(status) };
  }
  if (status === "REJECTED") {
    return { Icon: FaInfoCircle, accent: "rejected", label: getStatusLabel(status) };
  }
  return { Icon: FaInfoCircle, accent: "status", label: getStatusLabel(status) };
}

export function statusMessage(status) {
  switch (status) {
    case "IN_PROGRESS":
      return i18n.t("notifications.statusMsg.inProgress");
    case "RESOLVED":
      return i18n.t("notifications.statusMsg.resolved");
    case "REJECTED":
      return i18n.t("notifications.statusMsg.rejected");
    default:
      return i18n.t("notifications.statusMsg.pending");
  }
}

export function notificationBody(n) {
  if (n.type === "REPORT_STATUS") {
    const category = categoryLabel(n);
    const prevStatus = n.data?.previousStatus;
    const nextStatus = n.data?.status || n.reportId?.status;
    const from = getStatusLabel(prevStatus || "PENDING");
    const to = getStatusLabel(nextStatus);
    const note = n.data?.statusNote?.trim();
    if (note) {
      return i18n.t("notifications.body.statusChangedWithNote", { category, from, to, note });
    }
    if (prevStatus && nextStatus) {
      return i18n.t("notifications.body.statusChanged", { category, from, to });
    }
    return statusMessage(nextStatus);
  }

  if (n.type === "REPORT_COMMENT") {
    const name = n.data?.actorName || i18n.t("notifications.someone");
    const category = categoryLabel(n);
    const preview =
      i18n.language === "ar" ? "" : commentPreviewFromMessage(n);
    if (preview) {
      return i18n.t("notifications.body.commentedBy", { name, category, preview });
    }
    return i18n.t("notifications.body.commentedByShort", { name, category });
  }

  if (n.type === "REPORT_LIKE") {
    const name = n.data?.actorName || i18n.t("notifications.someone");
    const category = categoryLabel(n);
    return i18n.t("notifications.body.likedBy", { name, category });
  }

  return i18n.t("notifications.body.generic");
}

export function notificationDateLocale(language) {
  return language === "ar" ? "ar-LB" : undefined;
}

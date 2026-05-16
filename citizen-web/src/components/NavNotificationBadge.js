import React from "react";

/**
 * Unread count pill for the top navigation Alerts link.
 * @param {{ count: number }} props
 */
export default function NavNotificationBadge({ count }) {
  if (!count || count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);
  const many = count > 9;

  return (
    <span
      className={`nav-notify-badge${many ? " nav-notify-badge--wide" : ""}`}
      aria-hidden="true"
    >
      <span className="nav-notify-badge__count">{display}</span>
    </span>
  );
}

import React from "react";
import { FaTimes } from "react-icons/fa";

export default function TopbarDrawerClose({ onClose, label }) {
  return (
    <button
      type="button"
      className="topbar-drawer-close mobile-only"
      onClick={e => {
        e.stopPropagation();
        onClose();
      }}
      aria-label={label}
    >
      <FaTimes aria-hidden />
    </button>
  );
}

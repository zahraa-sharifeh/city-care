import React, { useState } from "react";
import "../styles/auth.css";

/**
 * Password field with an attached Show / Hide control (split control, no overlay).
 */
export default function AuthPasswordField({
  id,
  label,
  labelExtra = null,
  value,
  onChange,
  autoComplete = "password",
  placeholder,
  required = false,
  minLength,
  disabled = false,
  hint = null,
  className = "",
}) {
  const [visible, setVisible] = useState(false);

  const rootClass = ["auth-field", "auth-field--password", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="auth-label-row">
        <label htmlFor={id}>{label}</label>
        {labelExtra}
      </div>
      <div className="auth-password-shell">
        <input
          id={id}
          className="auth-password-input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint}
    </div>
  );
}

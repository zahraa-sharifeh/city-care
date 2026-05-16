import React from "react";
import { useTranslation } from "react-i18next";
import "../App.css";

export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("ar") ? "ar" : "en";

  return (
    <div className={`lang-switcher ${className}`.trim()} role="group" aria-label={t("lang.label")}>
      <button
        type="button"
        className={`lang-switcher-btn${current === "en" ? " is-active" : ""}`}
        onClick={() => i18n.changeLanguage("en")}
        aria-pressed={current === "en"}
      >
        {t("lang.en")}
      </button>
      <button
        type="button"
        className={`lang-switcher-btn${current === "ar" ? " is-active" : ""}`}
        onClick={() => i18n.changeLanguage("ar")}
        aria-pressed={current === "ar"}
      >
        {t("lang.ar")}
      </button>
    </div>
  );
}

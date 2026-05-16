import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const STORAGE_KEY = "citycare_lang";

function applyDocumentLanguage(lng) {
  const isRtl = lng === "ar";
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
}

const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const initialLng = saved === "ar" || saved === "en" ? saved : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

applyDocumentLanguage(initialLng);

i18n.on("languageChanged", lng => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDocumentLanguage(lng);
});

export default i18n;

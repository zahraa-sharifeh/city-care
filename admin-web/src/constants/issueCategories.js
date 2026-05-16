import i18n from "../i18n";

const CATEGORY_DEFS = [
  { value: "Infrastructure & Roads", i18nKey: "infrastructureRoads", color: "#4a6fa5" },
  { value: "Lighting & Electricity", i18nKey: "lightingElectricity", color: "#f59e0b" },
  { value: "Water & Sewage", i18nKey: "waterSewage", color: "#0ea5e9" },
  { value: "Waste & Cleanliness", i18nKey: "wasteCleanliness", color: "#16a34a" },
  { value: "Parks & Public Spaces", i18nKey: "parksPublicSpaces", color: "#22c55e" },
  { value: "Traffic & Transport", i18nKey: "trafficTransport", color: "#ef4444" },
  { value: "Buildings & Construction", i18nKey: "buildingsConstruction", color: "#8b5cf6" },
  { value: "Noise & Disturbances", i18nKey: "noiseDisturbances", color: "#f97316" },
  { value: "Environment & Pollution", i18nKey: "environmentPollution", color: "#10b981" },
  { value: "Animals & Pests", i18nKey: "animalsPests", color: "#14b8a6" },
  { value: "Public Safety Hazards", i18nKey: "publicSafetyHazards", color: "#dc2626" },
  { value: "Other", i18nKey: "other", color: "#64748b" },
];

const ISSUE_CATEGORY_LOOKUP = Object.fromEntries(
  CATEGORY_DEFS.map(c => [c.value.toLowerCase(), c])
);

export const ISSUE_CATEGORIES = CATEGORY_DEFS;

export function getCategoryLabel(def) {
  return i18n.t(`categories.${def.i18nKey}`, { defaultValue: def.value });
}

export function resolveIssueCategory(rawCategory) {
  const key = (rawCategory || "").trim().toLowerCase();
  const def = key ? ISSUE_CATEGORY_LOOKUP[key] : null;
  const entry = def || CATEGORY_DEFS[CATEGORY_DEFS.length - 1];
  return {
    value: entry.value,
    i18nKey: entry.i18nKey,
    color: entry.color,
    label: getCategoryLabel(entry),
  };
}

export function getIssueCategorySelectOptions() {
  return CATEGORY_DEFS.map(c => ({
    value: c.value,
    label: getCategoryLabel(c),
  }));
}

/** Localized label for a stored category value (English key from API/DB). */
export function getCategoryLabelFromValue(rawCategory) {
  return resolveIssueCategory(rawCategory).label;
}

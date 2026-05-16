import i18n from "../i18n";

const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function getPriorityLabel(priority) {
  if (!priority) return i18n.t("priority.medium");
  const key = String(priority).toLowerCase();
  return i18n.t(`priority.${key}`, { defaultValue: priority });
}

export function getPriorityOptions() {
  return PRIORITY_VALUES.map(value => ({
    value,
    label: getPriorityLabel(value),
  }));
}

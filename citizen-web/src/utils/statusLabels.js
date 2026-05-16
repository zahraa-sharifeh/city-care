import i18n from "../i18n";

const STATUS_VALUES = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export function getStatusLabel(status) {
  if (!status) return i18n.t("status.update");
  const key = String(status).toLowerCase();
  return i18n.t(`status.${key}`, { defaultValue: status });
}

export function getStatusOptions() {
  return STATUS_VALUES.map(value => ({
    value,
    label: getStatusLabel(value),
  }));
}


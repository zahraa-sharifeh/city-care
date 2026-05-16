import React from "react";
import Select from "react-select";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 12,
    borderColor: state.isFocused ? "var(--c-primary)" : "var(--color-border)",
    boxShadow: state.isFocused ? "0 0 0 3px var(--color-focus-ring)" : "none",
    backgroundColor: "var(--c-paper)",
    paddingInline: "2px 4px",
  }),
  valueContainer: base => ({
    ...base,
    padding: "2px 10px",
  }),
  indicatorsContainer: base => ({
    ...base,
    paddingInlineEnd: "8px",
  }),
  dropdownIndicator: base => ({
    ...base,
    padding: "6px 8px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: base => ({
    ...base,
    zIndex: 20,
  }),
  menuPortal: base => ({
    ...base,
    zIndex: 40,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--c-primary)"
      : state.isFocused
        ? "var(--c-mist)"
        : "var(--c-paper)",
    color: state.isSelected ? "var(--c-paper)" : "var(--c-accent)",
    cursor: state.isDisabled ? "not-allowed" : "default",
    opacity: state.isDisabled ? 0.55 : 1,
  }),
  singleValue: base => ({
    ...base,
    color: "var(--c-accent)",
  }),
};

const PLACEHOLDER_OPTION_VALUE = "__placeholder__";

export function withLeadingPlaceholderOption(options, label = "Choose a category") {
  return [{ value: PLACEHOLDER_OPTION_VALUE, label, isDisabled: true }, ...options];
}

export function isPlaceholderOption(option) {
  return !option || option.value === PLACEHOLDER_OPTION_VALUE;
}

export default function DownwardSelect({
  inputId,
  instanceId,
  value,
  onChange,
  options,
  placeholder = "Select…",
  isClearable = false,
  isDisabled = false,
}) {
  return (
    <Select
      inputId={inputId}
      instanceId={instanceId || inputId}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isOptionDisabled={option => Boolean(option.isDisabled)}
      menuPlacement="bottom"
      menuPosition="fixed"
      menuShouldScrollIntoView={false}
      styles={selectStyles}
    />
  );
}

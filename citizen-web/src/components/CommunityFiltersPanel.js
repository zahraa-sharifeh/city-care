import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaFilter, FaLayerGroup, FaMapMarkedAlt, FaSortAmountDown, FaTimes } from "react-icons/fa";
import { getIssueCategorySelectOptions } from "../constants/issueCategories";

/**
 * Shared filter UI for public report lists (home feed, issue map).
 */
export default function CommunityFiltersPanel({
  idPrefix = "community",
  loading = false,
  governorateId,
  districtId,
  categoryFilter,
  sortOrder,
  governorates = [],
  districts = [],
  onGovernorateChange,
  onDistrictChange,
  onCategoryChange,
  onSortChange,
  onClear,
  secondaryLink = null,
}) {
  const { t, i18n } = useTranslation();
  const categoryOptions = React.useMemo(() => getIssueCategorySelectOptions(), [i18n.language]);

  const activeFilterCount =
    (governorateId ? 1 : 0) + (districtId ? 1 : 0) + (categoryFilter ? 1 : 0) + (sortOrder !== "recent" ? 1 : 0);

  return (
    <div
      className={`community-filters-panel${loading ? " community-filters-panel--loading" : ""}`}
      aria-label={t("filters.ariaLabel")}
    >
      <div className="community-filters-head">
        <div className="community-filters-head-text">
          <span className="community-filters-icon" aria-hidden>
            <FaFilter />
          </span>
          <div>
            <p className="community-filters-title">{t("filters.title")}</p>
            <p className="community-filters-sub">
              {activeFilterCount > 0
                ? t("filters.subActive", { count: activeFilterCount })
                : t("filters.subDefault")}
            </p>
          </div>
        </div>
        <div className="community-filters-actions">
          {activeFilterCount > 0 ? (
            <button type="button" className="community-filter-clear" onClick={onClear}>
              <FaTimes aria-hidden />
              {t("filters.clearAll")}
            </button>
          ) : null}
          {secondaryLink ? (
            <Link to={secondaryLink.to} className="community-filter-map-link">
              {secondaryLink.icon}
              {secondaryLink.label}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="community-filters-grid">
        <div className={`community-filter-field${governorateId ? " is-active" : ""}`}>
          <label htmlFor={`${idPrefix}-gov`}>
            <FaMapMarkedAlt aria-hidden />
            {t("common.governorate")}
          </label>
          <select
            id={`${idPrefix}-gov`}
            value={governorateId}
            onChange={e => onGovernorateChange(e.target.value)}
          >
            <option value="">{t("filters.allGovernorates")}</option>
            {governorates.map(g => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className={`community-filter-field${districtId ? " is-active" : ""}`}>
          <label htmlFor={`${idPrefix}-dist`}>
            <FaMapMarkedAlt aria-hidden />
            {t("common.district")}
          </label>
          <select
            id={`${idPrefix}-dist`}
            value={districtId}
            disabled={!governorateId}
            onChange={e => onDistrictChange(e.target.value)}
          >
            <option value="">
              {governorateId ? t("filters.allDistricts") : t("common.selectGovernorateFirst")}
            </option>
            {districts.map(d => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className={`community-filter-field${categoryFilter ? " is-active" : ""}`}>
          <label htmlFor={`${idPrefix}-cat`}>
            <FaLayerGroup aria-hidden />
            {t("createReport.category")}
          </label>
          <select id={`${idPrefix}-cat`} value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
            <option value="">{t("filters.allCategories")}</option>
            {categoryOptions.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className={`community-filter-field${sortOrder !== "recent" ? " is-active" : ""}`}>
          <label htmlFor={`${idPrefix}-sort`}>
            <FaSortAmountDown aria-hidden />
            {t("filters.sort")}
          </label>
          <select id={`${idPrefix}-sort`} value={sortOrder} onChange={e => onSortChange(e.target.value)}>
            <option value="recent">{t("filters.sortRecent")}</option>
            <option value="oldest">{t("filters.sortOldest")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

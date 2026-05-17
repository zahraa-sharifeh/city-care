import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBell,
  FaClipboardList,
  FaLandmark,
  FaMapMarkedAlt,
  FaPlusCircle,
  FaQuestionCircle,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";

/**
 * Mobile drawer menu rendered on document.body so it does not overlap the home layout incorrectly.
 */
export default function HomeMobileMenu({ open, onClose, isAuthenticated }) {
  const { t } = useTranslation();

  if (!open) return null;

  return createPortal(
    <>
      <button type="button" className="home-nav-backdrop" aria-label={t("nav.closeMenu")} onClick={onClose} />
      <nav id="home-nav-links" className="home-nav-links home-nav-links--drawer" aria-label={t("nav.menuLabel")} onClick={onClose}>
        <button type="button" className="home-nav-drawer-close" onClick={onClose} aria-label={t("nav.closeMenu")}>
          <FaTimes aria-hidden />
        </button>
        {isAuthenticated ? (
          <>
            <Link to="/reports">
              <FaClipboardList aria-hidden /> {t("nav.myReports")}
            </Link>
            <Link to="/reports/new" className="home-cta">
              <FaPlusCircle aria-hidden /> {t("nav.newReport")}
            </Link>
            <Link to="/map">
              <FaMapMarkedAlt aria-hidden /> {t("nav.map")}
            </Link>
            <Link to="/notifications">
              <FaBell aria-hidden /> {t("nav.alerts")}
            </Link>
            <Link to="/discover">
              <FaLandmark aria-hidden /> {t("nav.discover")}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login">{t("nav.signIn")}</Link>
            <Link to="/register" className="home-cta">
              <FaUserPlus aria-hidden /> {t("nav.register")}
            </Link>
            <Link to="/map">
              <FaMapMarkedAlt aria-hidden /> {t("nav.map")}
            </Link>
            <Link to="/discover">
              <FaLandmark aria-hidden /> {t("nav.discover")}
            </Link>
            <Link to="/help">
              <FaQuestionCircle aria-hidden /> {t("nav.help")}
            </Link>
          </>
        )}
      </nav>
    </>,
    document.body
  );
}

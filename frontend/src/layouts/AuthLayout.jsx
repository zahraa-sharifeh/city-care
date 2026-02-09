import "../styles/auth.css";
import illustration from "../assets/auth-illustration.jpg";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left: Form */}
        <div className="auth-left">
          <div className="auth-brand">
            <span className="auth-brand-text">Smart City</span>
          </div>

          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}

          {children}
        </div>

        {/* Right: Image */}
        <div className="auth-right">
          <img className="auth-img" src={illustration} alt="Smart city" />
          <div className="auth-overlay" />
          <div className="auth-right-text">
            <h3>Report. Track. Improve.</h3>
            <p>Help your city respond faster with verified reports and smart insights.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

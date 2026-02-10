import { useState } from "react";
import { loginUser } from "../../api/auth";
import AuthLayout from "../../layouts/AuthLayout";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }

    // Password validation
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to track your reports and notifications.">
      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-field">
          <label className="auth-label">Email</label>
          <input 
            className={`auth-input ${fieldErrors.email ? "auth-input-error" : ""}`}
            name="email" 
            value={form.email} 
            onChange={onChange} 
            placeholder="Email" 
          />
          {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input 
            className={`auth-input ${fieldErrors.password ? "auth-input-error" : ""}`}
            type="password" 
            name="password" 
            value={form.password} 
            onChange={onChange} 
            placeholder="Password" 
          />
          {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
        </div>

        <button className="auth-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="auth-link">
          No account? <a href="/register">Register</a>
        </div>
      </form>
    </AuthLayout>
  );
}

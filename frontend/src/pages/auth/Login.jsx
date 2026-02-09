import { useState } from "react";
import { loginUser } from "../../api/auth";
import AuthLayout from "../../layouts/AuthLayout";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
          <input className="auth-input" name="email" value={form.email} onChange={onChange} placeholder="Email" />
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" />
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

import { useState } from "react";
import { registerUser } from "../../api/auth";
import AuthLayout from "../../layouts/AuthLayout";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Your backend expects: name, email, password
      const payload = {
        name: form.username,
        email: form.email,
        password: form.password,
      };

      const res = await registerUser(payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Registration Form"
      subtitle="Create your account to start reporting city issues."
    >
      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-fields-row">
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input className="auth-input" name="username" value={form.username} onChange={onChange} placeholder="Username" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" name="email" value={form.email} onChange={onChange} placeholder="Email" />
          </div>
        </div>

        <div className="auth-fields-row">
          <div className="auth-field">
            <label className="auth-label">Phone Number</label>
            <input className="auth-input" name="phone" value={form.phone} onChange={onChange} placeholder="Phone Number" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Location</label>
            <input className="auth-input" name="location" value={form.location} onChange={onChange} placeholder="Location" />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" />
        </div>

        <button className="auth-btn" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>

        <div className="auth-link">
          Have an account? <a href="/login">Login</a>
        </div>
      </form>
    </AuthLayout>
  );
}

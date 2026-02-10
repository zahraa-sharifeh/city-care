import { useState } from "react";
import { registerUser } from "../../api/auth";
import AuthLayout from "../../layouts/AuthLayout";

const countries = [
  { code: "+1", name: "United States", flag: "us", abbr: "US" },
  { code: "+44", name: "United Kingdom", flag: "gb", abbr: "GB" },
  { code: "+91", name: "India", flag: "in", abbr: "IN" },
  { code: "+86", name: "China", flag: "cn", abbr: "CN" },
  { code: "+81", name: "Japan", flag: "jp", abbr: "JP" },
  { code: "+33", name: "France", flag: "fr", abbr: "FR" },
  { code: "+49", name: "Germany", flag: "de", abbr: "DE" },
  { code: "+39", name: "Italy", flag: "it", abbr: "IT" },
  { code: "+34", name: "Spain", flag: "es", abbr: "ES" },
  { code: "+61", name: "Australia", flag: "au", abbr: "AU" },
  { code: "+64", name: "New Zealand", flag: "nz", abbr: "NZ" },
  { code: "+27", name: "South Africa", flag: "za", abbr: "ZA" },
  { code: "+55", name: "Brazil", flag: "br", abbr: "BR" },
  { code: "+52", name: "Mexico", flag: "mx", abbr: "MX" },
  { code: "+1-778", name: "Canada", flag: "ca", abbr: "CA" },
  { code: "+966", name: "Saudi Arabia", flag: "sa", abbr: "SA" },
  { code: "+971", name: "UAE", flag: "ae", abbr: "AE" },
  { code: "+965", name: "Kuwait", flag: "kw", abbr: "KW" },
  { code: "+974", name: "Qatar", flag: "qa", abbr: "QA" },
  { code: "+973", name: "Bahrain", flag: "bh", abbr: "BH" },
  { code: "+968", name: "Oman", flag: "om", abbr: "OM" },
  { code: "+962", name: "Jordan", flag: "jo", abbr: "JO" },
  { code: "+963", name: "Syria", flag: "sy", abbr: "SY" },
  { code: "+961", name: "Lebanon", flag: "lb", abbr: "LB" },
  { code: "+970", name: "Palestine", flag: "ps", abbr: "PS" },
  { code: "+20", name: "Egypt", flag: "eg", abbr: "EG" },
  { code: "+212", name: "Morocco", flag: "ma", abbr: "MA" },
  { code: "+216", name: "Tunisia", flag: "tn", abbr: "TN" },
  { code: "+213", name: "Algeria", flag: "dz", abbr: "DZ" },
];

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    countryCode: "+1",
  });
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

    // Username validation
    if (!form.username.trim()) {
      errors.username = "Username is required";
    } else if (form.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    // Email validation
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }

    // Phone validation
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9\+\-\s\(\)]{7,}$/.test(form.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Location validation
    // Location removed

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
      // Your backend expects: name, email, password
      const payload = {
        name: form.username,
        email: form.email,
        password: form.password,
        phone: `${form.countryCode} ${form.phone}`,
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
            <input 
              className={`auth-input ${fieldErrors.username ? "auth-input-error" : ""}`}
              name="username" 
              value={form.username} 
              onChange={onChange} 
              placeholder="Username" 
            />
            {fieldErrors.username && <span className="auth-field-error">{fieldErrors.username}</span>}
          </div>

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
        </div>

        <div className="auth-fields-row">
          <div className="auth-field">
            <label className="auth-label">Phone Number</label>
            <div className="auth-phone-wrapper">
              <select 
                className="auth-country-code"
                name="countryCode" 
                value={form.countryCode} 
                onChange={onChange}
                style={{
                  backgroundImage: `url('https://flagcdn.com/w20/${countries.find(c => c.code === form.countryCode)?.flag}.png'), url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111827' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat, no-repeat',
                  backgroundPosition: '10px center, right 8px center',
                  backgroundSize: '24px, 16px',
                }}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.abbr} {country.code}
                  </option>
                ))}
              </select>
              <input 
                className={`auth-input ${fieldErrors.phone ? "auth-input-error" : ""}`}
                name="phone" 
                value={form.phone} 
                onChange={onChange} 
                placeholder="1234567890" 
              />
            </div>
            {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
          </div>
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
          {loading ? "Creating..." : "Register"}
        </button>

        <div className="auth-link">
          Have an account? <a href="/login">Login</a>
        </div>
      </form>
    </AuthLayout>
  );
}

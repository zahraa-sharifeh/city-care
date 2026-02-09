import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return (
    <div style={{ maxWidth: 700, margin: "60px auto" }}>
      <h1>Smart City Platform</h1>
      {user ? (
        <>
          <p>Welcome, {user.name} ✅</p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <p>
          <a href="/login">Login</a> or <a href="/register">Register</a>
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

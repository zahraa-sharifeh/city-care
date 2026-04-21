import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import ReportsList from "./pages/ReportsList";
import AdminReportDetail from "./pages/AdminReportDetail";
import ChangePassword from "./pages/ChangePassword";
import { useAdminAuth } from "./context/AdminAuthContext";
import { getAdminToken } from "./api/client";
import "./App.css";

function Home() {
  const { admin } = useAdminAuth();
  if (getAdminToken() && admin) return <Navigate to="/reports" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id" element={<AdminReportDetail />} />
        <Route path="/account/password" element={<ChangePassword />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

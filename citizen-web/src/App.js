import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyReports from "./pages/MyReports";
import CreateReport from "./pages/CreateReport";
import ReportDetail from "./pages/ReportDetail";
import { useAuth } from "./context/AuthContext";
import { getToken } from "./api/client";
import "./App.css";

function Home() {
  const { user } = useAuth();
  if (getToken() && user) return <Navigate to="/reports" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/reports" element={<MyReports />} />
        <Route path="/reports/new" element={<CreateReport />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

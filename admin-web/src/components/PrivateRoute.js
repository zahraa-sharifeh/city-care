import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { getAdminToken } from "../api/client";

export default function PrivateRoute({ children }) {
  const { admin } = useAdminAuth();
  const location = useLocation();
  if (!getAdminToken() || !admin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

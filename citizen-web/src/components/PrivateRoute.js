import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../api/client";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!getToken() || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

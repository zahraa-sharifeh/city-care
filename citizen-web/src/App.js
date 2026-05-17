import React from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyReports from "./pages/MyReports";
import CreateReport from "./pages/CreateReport";
import ReportDetail from "./pages/ReportDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MapPage from "./pages/MapPage";
import ChangePassword from "./pages/ChangePassword";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import DistrictDiscover from "./pages/DistrictDiscover";
import ExploreReportDetail from "./pages/ExploreReportDetail";
import NotFound from "./pages/NotFound";
import "./App.css";
import "./styles/mobile.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/help" element={<Help />} />
      <Route path="/discover" element={<DistrictDiscover />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/explore/reports/:id" element={<ExploreReportDetail />} />
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
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account/profile" element={<EditProfile />} />
        <Route path="/account/password" element={<ChangePassword />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

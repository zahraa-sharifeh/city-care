import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./i18n";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";

const googleClientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();

const inner = (
  <BrowserRouter>
    <AuthProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </AuthProvider>
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider> : inner}
  </React.StrictMode>
);

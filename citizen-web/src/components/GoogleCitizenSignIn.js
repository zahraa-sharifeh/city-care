import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const googleClientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();
const googleEnabled = googleClientId.length > 0;

export function isGoogleSignInConfigured() {
  return googleEnabled;
}

/**
 * @param {{ onSuccess: () => void | Promise<void>, onError?: (msg: string) => void, disabled?: boolean }} props
 */
export default function GoogleCitizenSignIn({ onSuccess, onError, disabled }) {
  const [busy, setBusy] = useState(false);

  if (!googleEnabled) return null;

  return (
    <div className={`auth-google-row ${disabled || busy ? "auth-google-row--disabled" : ""}`} aria-busy={busy}>
      <GoogleLogin
        onSuccess={async cred => {
          if (!cred?.credential) {
            onError?.("Missing Google credential");
            return;
          }
          setBusy(true);
          try {
            await onSuccess(cred.credential);
          } catch (e) {
            onError?.(e?.message || "Google sign-in failed");
          } finally {
            setBusy(false);
          }
        }}
        onError={() => {
          onError?.("Google sign-in was cancelled or failed");
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        locale="en"
      />
    </div>
  );
}

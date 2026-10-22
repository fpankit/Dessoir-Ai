import React, { useEffect } from "react";
import { ClerkProvider, useUser } from "@clerk/react";
import { syncUserToFirestore } from "./services/firebase";

const publishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cGVhY2VmdWwtbWF5Zmx5LTIxNzIuY2xlcmsuYWNjb3VudHMuZGV2JA";

/**
 * Background synchronizer that automatically writes signed-in/signed-up
 * user profile data to Firebase Firestore.
 */
function FirestoreAuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUserToFirestore(user, { action: "session_sync" }).catch((err) => {
        console.warn("[Clerk->Firestore Sync]", err?.message || err);
      });
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

function MissingKeyNotice() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: 24,
      background: "#0c0d0e",
      color: "#f5f5f5",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Clerk Key Missing</h1>
      <p style={{ color: "#a1a1aa", maxWidth: 440, lineHeight: 1.5, margin: "0 0 16px" }}>
        Please ensure <code>VITE_CLERK_PUBLISHABLE_KEY</code> is set in your <code>.env.local</code> file and restart the dev server.
      </p>
      <pre style={{
        background: "#18181b",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 13,
        color: "#fbbf24"
      }}>
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
      </pre>
    </div>
  );
}

export default function ClerkRoot({ children }) {
  if (!publishableKey) {
    return <MissingKeyNotice />;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={{ dividerText: "Or continue with" }}
      signInUrl="/auth.html?mode=signin"
      signUpUrl="/auth.html?mode=signup"
      signInFallbackRedirectUrl="/onboarding.html"
      signUpFallbackRedirectUrl="/onboarding.html"
      afterSignOutUrl="/"
    >
      <FirestoreAuthSync />
      {children}
    </ClerkProvider>
  );
}

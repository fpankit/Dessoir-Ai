import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBHKfdZv_oNp70bxExQMzXupjYeda2hpAY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "dessoir-db.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "dessoir-db",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "dessoir-db.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "907322620844",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:907322620844:web:d82abd27928dd8eef99809",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R7ZZ11CJNZ"
};

// Client-side Firestore writes are disabled by default: the browser is not a
// trusted writer (auth is Clerk, so Firestore sees no Firebase Auth token).
// Enable only after firestore.rules are deployed and a server-side signer
// verifies Clerk sessions. See README "Security configuration".
export const FIRESTORE_SYNC_ENABLED =
  String(import.meta.env.VITE_ENABLE_FIRESTORE_SYNC || "false").toLowerCase() === "true";

// Initialize Firebase App singleton
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics safely (only supported in certain browser environments)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((yes) => {
      if (yes) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked (e.g. adblocker)
    });
}

// In-memory cache to prevent redundant writes within the same session
const syncedSessionCache = new Set();

/**
 * Synchronizes a Clerk authenticated user's profile to Firestore.
 * Saves to collection 'users' with document ID = user.id
 *
 * @param {import('@clerk/react').UserResource} user - Clerk user object
 * @param {object} options
 * @param {string} [options.action='session_sync'] - 'sign_in', 'sign_up', or 'session_sync'
 */
export async function syncUserToFirestore(user, options = {}) {
  if (!user || !user.id) return null;

  if (!FIRESTORE_SYNC_ENABLED) {
    return { disabled: true, uid: user.id };
  }

  const { action = "session_sync" } = options;
  const cacheKey = `${user.id}:${user.lastSignInAt || ""}:${action}`;

  // If already synced for this exact sign-in timestamp in current session, skip redundant write
  if (syncedSessionCache.has(cacheKey) && action === "session_sync") {
    return { cached: true, uid: user.id };
  }

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";

  const emailList = Array.isArray(user.emailAddresses)
    ? user.emailAddresses.map((item) => item.emailAddress)
    : primaryEmail
      ? [primaryEmail]
      : [];

  const providers = Array.isArray(user.externalAccounts) && user.externalAccounts.length > 0
    ? user.externalAccounts.map((acc) => acc.provider || acc.verification?.strategy || "oauth")
    : ["email_password"];

  const payload = {
    uid: user.id,
    email: primaryEmail,
    emailAddresses: emailList,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    fullName:
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      primaryEmail.split("@")[0] ||
      "User",
    imageUrl: user.imageUrl || "",
    username: user.username || null,
    authProviders: providers,
    lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(),
    clerkCreatedAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: serverTimestamp(),
    lastAction: action,
    lastActiveAt: new Date().toISOString()
  };

  try {
    const userDocRef = doc(db, "users", user.id);
    await setDoc(userDocRef, payload, { merge: true });

    // Also record an entry in user's login history sub-collection
    try {
      const historyCollection = collection(db, "users", user.id, "auth_history");
      await addDoc(historyCollection, {
        action,
        timestamp: serverTimestamp(),
        email: primaryEmail,
        recordedAt: new Date().toISOString()
      });
    } catch (historyErr) {
      // Sub-collection write might fail if rules only allow parent doc; non-critical
      console.debug("Auth history sub-collection note:", historyErr?.message);
    }

    syncedSessionCache.add(cacheKey);

    // Keep legacy local session in sync so existing scraper/chat views immediately have access
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "dessoir.session",
          JSON.stringify({
            userId: user.id,
            email: primaryEmail,
            name: payload.fullName,
            imageUrl: user.imageUrl,
            signedInAt: Date.now()
          })
        );
      }
    } catch {
      // localStorage may be unavailable in private browsing
    }

    console.info(`[Firestore] User ${user.id.slice(0, 8)}... synced (${action}).`);
    return { success: true, uid: user.id };
  } catch (error) {
    console.error("[Firestore] Error syncing user to Firestore:", error);
    throw error;
  }
}

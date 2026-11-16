import "server-only";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import appletConfig from "@/firebase-applet-config.json";

let adminApp: App;

if (!getApps().length) {
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      appletConfig.projectId ||
      "gen-lang-client-0016737254";

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
        projectId,
      });
    } else {
      // Fallback for local emulator or default ADC
      adminApp = initializeApp({
        projectId,
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

const databaseId = process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId;

export const adminAuth = getAuth(adminApp);
export const adminDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
export default adminApp;

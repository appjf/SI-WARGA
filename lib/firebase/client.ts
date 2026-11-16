import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

import appletConfig from "@/firebase-applet-config.json";

// Initialize Firebase Client singleton instance
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (appletConfig as any).firestoreDatabaseId);

export default app;

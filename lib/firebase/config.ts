import { z } from "zod";
import appletConfig from "@/firebase-applet-config.json";

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, "Firebase API Key is required"),
  authDomain: z.string().min(1, "Firebase Auth Domain is required"),
  projectId: z.string().min(1, "Firebase Project ID is required"),
  appId: z.string().min(1, "Firebase App ID is required"),
});

const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || appletConfig.apiKey || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || appletConfig.projectId || "demo-project",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || appletConfig.appId || "1:123456789:web:abcdef",
};

export const firebaseConfig = firebaseConfigSchema.parse(rawConfig);

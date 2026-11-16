import "server-only";
import { adminAuth } from "./admin";
import { DecodedIdToken } from "firebase-admin/auth";

export async function verifyIdToken(idToken: string, checkRevoked = true): Promise<DecodedIdToken | null> {
  try {
    if (!idToken) return null;
    const decodedToken = await adminAuth.verifyIdToken(idToken, checkRevoked);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

export async function getUserRecord(uid: string) {
  try {
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error(`Error fetching user record for UID ${uid}:`, error);
    return null;
  }
}

export async function setCustomUserClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return { success: true };
  } catch (error) {
    console.error(`Error setting custom claims for UID ${uid}:`, error);
    return { success: false, error };
  }
}

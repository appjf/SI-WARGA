import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  AuthError,
} from "firebase/auth";
import { auth } from "./client";

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signIn(email: string, pass: string): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const err = error as AuthError;
    return { success: false, error: mapFirebaseAuthError(err.code, err.message) };
  }
}

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const err = error as AuthError;
    return { success: false, error: mapFirebaseAuthError(err.code, err.message) };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await fbSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const err = error as AuthError;
    return { success: false, error: err.message || "Gagal keluar dari sesi." };
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function mapFirebaseAuthError(code?: string, fallback?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi tidak sesuai. Silakan periksa kembali.";
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/user-disabled":
      return "Akun Anda dinonaktifkan sementara oleh pengurus. Hubungi Sekretariat RT 06.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan masuk. Tunggu beberapa saat sebelum mencoba lagi.";
    case "auth/popup-closed-by-user":
      return "Jendela masuk Google ditutup sebelum proses selesai.";
    case "auth/popup-blocked":
      return "Browser memblokir jendela pop-up. Izinkan pop-up untuk masuk dengan Google.";
    case "auth/network-request-failed":
      return "Koneksi jaringan terganggu. Periksa sambungan internet Anda.";
    default:
      return fallback || "Proses autentikasi gagal. Silakan coba kembali.";
  }
}

export { signInWithEmailAndPassword, onAuthStateChanged };

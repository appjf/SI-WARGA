"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "firebase/auth";
import {
  subscribeToAuthChanges,
  signIn as fbSignIn,
  signInWithGoogle as fbSignInWithGoogle,
  signOut as fbSignOut,
} from "@/lib/firebase/auth";
import { hasPermission, hasRole, type Permission, type Role } from "@/lib/rbac/matrix";
import { bffApi, BffClientError } from "@/services/api-client";
import type { VerifiedSessionProfile } from "@/types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: VerifiedSessionProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  can: (permission: Permission) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasSpecificRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VerifiedSessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncServerProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    try {
      setAuthError(null);
      const idToken = await user.getIdToken();
      await bffApi.verifyToken(idToken);
      const meRes = await bffApi.getMe();
      setProfile(meRes.data ?? null);
    } catch (err) {
      const msg =
        err instanceof BffClientError
          ? err.message
          : "Verifikasi sesi dengan server gagal.";
      setAuthError(msg);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setFirebaseUser(user);
      setLoading(true);
      void syncServerProfile(user);
    });
    return () => unsubscribe();
  }, [syncServerProfile]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    const res = await fbSignIn(email, pass);
    if (!res.success) {
      const errMsg = res.error || "Gagal masuk.";
      setAuthError(errMsg);
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const res = await fbSignInWithGoogle();
    if (!res.success) {
      const errMsg = res.error || "Gagal masuk dengan Google.";
      setAuthError(errMsg);
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await fbSignOut();
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await syncServerProfile(firebaseUser);
  }, [firebaseUser, syncServerProfile]);

  const can = useCallback(
    (permission: Permission) => {
      if (!profile) return false;
      return hasPermission(profile.roles, permission);
    },
    [profile]
  );

  const hasAnyRole = useCallback(
    (roles: Role[]) => {
      if (!profile) return false;
      if (profile.roles.includes("SUPER_ADMIN")) return true;
      return roles.some((r) => profile.roles.includes(r));
    },
    [profile]
  );

  const hasSpecificRole = useCallback(
    (role: Role) => {
      if (!profile) return false;
      return hasRole(profile.roles, role);
    },
    [profile]
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        authError,
        signInWithEmail,
        signInWithGoogle,
        logout,
        refreshProfile,
        can,
        hasAnyRole,
        hasSpecificRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

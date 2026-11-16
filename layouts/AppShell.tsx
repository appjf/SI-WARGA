"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  FileBarChart2,
  Home,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquareWarning,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getVisibleNavigation } from "@/lib/rbac/navigation";
import { ROLE_LABELS } from "@/lib/rbac/matrix";
import { COMMUNITY_IDENTITY } from "@/styles/tokens";
import { bffApi } from "@/services/api-client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";

const NAV_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  residents: Home,
  finance: Wallet,
  complaints: MessageSquareWarning,
  gis: MapIcon,
  notifications: Bell,
  reports: FileBarChart2,
  "admin-users": Users,
  profile: UserCheck,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, profile, loading, authError, logout, refreshProfile } =
    useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [loading, firebaseUser, router]);

  const loadUnreadNotifications = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await bffApi.listNotifications(true);
      setUnreadCount(res.data?.length || 0);
    } catch {
      // Non-blocking badge fetch
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadUnreadNotifications();
    });
    return () => {
      active = false;
    };
  }, [loadUnreadNotifications, pathname]);

  const visibleNav = useMemo(
    () => getVisibleNavigation(profile?.roles || []),
    [profile?.roles]
  );

  const activeNav = useMemo(
    () =>
      visibleNav.find(
        (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
      ) || visibleNav[0],
    [visibleNav, pathname]
  );

  const primaryRoleLabel = profile?.roles?.[0]
    ? ROLE_LABELS[profile.roles[0]] || profile.roles[0]
    : "Warga RT 06";

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-12 w-64 animate-pulse rounded-lg bg-[#EFF2EE]" />
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  if (authError && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F6] p-6">
        <div className="w-full max-w-md space-y-4">
          <ErrorState
            title="Verifikasi Sesi Bermasalah"
            message={authError}
            onRetry={() => void refreshProfile()}
          />
          <div className="text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[#1F5E4A] underline hover:text-[#174939]"
            >
              Keluar dan masuk kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav aria-label="Menu utama aplikasi" className="space-y-1">
      {visibleNav.map((item) => {
        const Icon = NAV_ICONS[item.id] || LayoutDashboard;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onItemClick}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#1F5E4A] ${
              isActive
                ? "bg-[#1F5E4A] text-white"
                : "text-[#1F2933] hover:bg-[#EFF2EE]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const mobileBottomItems = visibleNav.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#1F2933] lg:flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#E4E7EC] lg:bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-[#E4E7EC] px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1F5E4A] text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-[#1F5E4A]">
              {COMMUNITY_IDENTITY.code}
            </p>
            <p className="truncate text-xs text-[#667085]">
              RT 06 RW 01 · Green Garden
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {renderNavLinks()}
        </div>

        <div className="border-t border-[#E4E7EC] p-4">
          <div className="flex items-start gap-2.5 text-xs text-[#667085]">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1F5E4A]" aria-hidden="true" />
            <p className="leading-relaxed">
              Desa Cipicung, Kec. Banyuresmi, Kab. Garut
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi seluler"
        >
          <div
            className="fixed inset-0 bg-[#1F2933]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 max-w-[82vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[#E4E7EC] px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F5E4A] text-white">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-[#1F5E4A]">
                  {COMMUNITY_IDENTITY.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-2 text-[#667085] hover:bg-[#EFF2EE]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </div>
            <div className="border-t border-[#E4E7EC] p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#B42318] hover:bg-[#B42318]/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E4E7EC] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E7EC] text-[#1F2933] hover:bg-[#F7F8F6] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs text-[#667085]">
                Green Garden Residence · RT 06 RW 01
              </p>
              <h1 className="truncate text-sm font-semibold text-[#1F2933] sm:text-base">
                {activeNav?.label || "Workspace"}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/notifications"
              aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white text-[#1F2933] transition-colors hover:bg-[#F7F8F6] focus-visible:outline-2 focus-visible:outline-[#1F5E4A]"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B42318] px-1 text-[10px] font-bold text-white tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                className="flex min-h-10 items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-left transition-colors hover:bg-[#F7F8F6] focus-visible:outline-2 focus-visible:outline-[#1F5E4A]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1F5E4A]/10 text-xs font-bold text-[#1F5E4A]">
                  {(profile?.displayName || profile?.email || "W")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="max-w-36 truncate text-xs font-semibold text-[#1F2933]">
                    {profile?.displayName || profile?.email || "Pengguna"}
                  </p>
                  <p className="max-w-36 truncate text-[11px] text-[#667085]">
                    {primaryRoleLabel}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#667085]" aria-hidden="true" />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-xl border border-[#E4E7EC] bg-white p-2 shadow-lg"
                >
                  <div className="border-b border-[#E4E7EC] px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[#1F2933]">
                      {profile?.displayName || "Pengguna Terverifikasi"}
                    </p>
                    <p className="truncate text-xs text-[#667085]">
                      {profile?.email || profile?.uid}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#1F5E4A]">
                      {primaryRoleLabel}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1F2933] hover:bg-[#F7F8F6]"
                  >
                    <UserCheck className="h-4 w-4 text-[#667085]" aria-hidden="true" />
                    <span>Profil &amp; Hak Akses</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#B42318] hover:bg-[#B42318]/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation (<= 15% mobile height) */}
      <nav
        aria-label="Navigasi cepat seluler"
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-[#E4E7EC] bg-white px-1 lg:hidden"
      >
        {mobileBottomItems.map((item) => {
          const Icon = NAV_ICONS[item.id] || LayoutDashboard;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium ${
                isActive ? "text-[#1F5E4A]" : "text-[#667085]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput } from "@/components/ui/FormFields";
import { COMMUNITY_IDENTITY } from "@/styles/tokens";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, profile, loading, authError, signInWithEmail, signInWithGoogle } =
    useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && firebaseUser && profile) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, profile, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Alamat email dan kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    const res = await signInWithEmail(email.trim(), password);
    setSubmitting(false);

    if (!res.ok) {
      setFormError(res.error || "Gagal masuk.");
      return;
    }

    showToast({
      variant: "success",
      title: "Autentikasi berhasil",
      description: "Memverifikasi hak akses dengan server RT 06...",
    });
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setSubmitting(true);
    const res = await signInWithGoogle();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(res.error || "Gagal masuk dengan Google.");
      return;
    }

    showToast({
      variant: "success",
      title: "Berhasil masuk melalui Google",
      description: "Menyiapkan ruang kerja GGR-ICMS...",
    });
  };

  const activeError = formError || authError;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F6] text-[#1F2933]">
      <header className="border-b border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#667085] hover:text-[#1F2933]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-sm font-bold text-[#1F5E4A]">
            {COMMUNITY_IDENTITY.code}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-[#E4E7EC] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5E4A] text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2933]">
                Masuk Portal GGR-ICMS
              </h1>
              <p className="text-xs text-[#667085]">
                RT 06 RW 01 · Perum Green Garden Residence
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#667085]">
            Gunakan akun terverifikasi Anda. Peran dan kewenangan akses
            ditetapkan dan divalidasi langsung oleh server.
          </p>

          {activeError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-[#B42318]/30 bg-[#B42318]/5 px-4 py-3 text-xs leading-relaxed font-medium text-[#B42318]"
            >
              {activeError}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              loading={submitting}
              onClick={handleGoogleSignIn}
            >
              Masuk dengan Akun Google
            </Button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#E4E7EC]" />
              <span className="mx-3 shrink-0 text-xs text-[#667085]">
                atau masuk dengan email
              </span>
              <div className="flex-grow border-t border-[#E4E7EC]" />
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
              <FormField id="login-email" label="Alamat Email" required>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#667085]"
                    aria-hidden="true"
                  />
                  <TextInput
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@greengarden.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </FormField>

              <FormField id="login-password" label="Kata Sandi" required>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#667085]"
                    aria-hidden="true"
                  />
                  <TextInput
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-[#667085] hover:text-[#1F2933]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                Masuk ke Ruang Kerja
              </Button>
            </form>
          </div>

          <p className="mt-6 border-t border-[#E4E7EC] pt-4 text-xs leading-relaxed text-[#667085]">
            Kendala aktivasi akun? Hubungi Sekretariat RT 06 RW 01 untuk
            penautan akun warga ke unit rumah tangga Anda.
          </p>
        </div>
      </main>
    </div>
  );
}

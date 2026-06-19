"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SEKOLAH } from "@/lib/sekolah";
import Logo from "@/components/Logo";
import DevCredit from "@/components/DevCredit";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email atau kata sandi salah.");
      setLoading(false);
      return;
    }
    // Middleware resolves the role and routes to the correct dashboard.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel — gambar saja, tanpa teks */}
      <div className="hidden lg:block bg-[var(--color-brand)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/halaman-login.webp"
          alt="Si Diswa"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-[var(--bg)]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Logo size={44} rounded="rounded-xl" />
            <div>
              <p className="font-bold text-lg leading-tight">{SEKOLAH.app}</p>
              <p className="text-[var(--text-2)] text-sm">{SEKOLAH.nama}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold">Masuk ke akun Anda</h2>
          <p className="text-[var(--text-2)] mt-1 mb-6 text-sm">
            Gunakan email dan kata sandi yang terdaftar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nama@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-xs text-center text-[var(--text-3)]">
            Hubungi administrator sekolah bila lupa kata sandi.
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-brand)] font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke beranda
            </Link>
          </div>

          <DevCredit className="mt-8 text-center" />
        </div>
      </div>
    </div>
  );
}

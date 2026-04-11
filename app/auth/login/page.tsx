"use client";

import { googleSignInAction, credentialsSignInAction } from "./actions";
import { COMPANY_NAME } from "@/lib/constants";
import { MapPin, ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";

export default function ClientLoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleCredentialsSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await credentialsSignInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F7F5] via-white to-[#F1EFE9] px-4 pt-24 pb-16">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#C41230]/5" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#1B2847]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#E4E0D9]/60" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(228,224,217,0.8)] overflow-hidden">
          {/* Header stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#C41230] via-[#C8A84B] to-[#1B2847]" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C41230] mb-4 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: "var(--font-playfair)" }}>
                Welcome Back
              </h1>
              <p className="text-sm text-[#7A746D] mt-1">
                Sign in to book tours and leave reviews
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] text-[#C41230] text-sm rounded-lg border border-[#FCA5A5]/50">
                {error}
              </div>
            )}

            {/* Credentials Login */}
            <form action={handleCredentialsSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[#111]">Password</label>
                  {/* Forgot password stub */}
                  <span className="text-xs text-[#C41230] hover:underline cursor-pointer">Forgot password?</span>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || loadingGoogle}
                  className="w-full h-12 bg-[#C41230] hover:bg-[#A00F27] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                     <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In...</>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#E4E0D9]" />
              <span className="text-xs text-[#A8A29E] font-medium uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-[#E4E0D9]" />
            </div>

            {/* Google Sign In */}
            <form action={googleSignInAction}>
              <button
                type="submit"
                disabled={loadingGoogle || isPending}
                onClick={() => setLoadingGoogle(true)}
                className="w-full h-12 rounded-lg border border-[#E4E0D9] bg-white text-sm font-medium text-[#111111] hover:bg-[#F8F7F5] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-sm"
              >
                {loadingGoogle ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#A8A29E]/40 border-t-[#111111] rounded-full animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.1a6.94 6.94 0 0 1 0-4.2V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.43l3.66-3.33z" fill="#FBBC05" />
                      <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#7A746D] mt-8">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-semibold text-[#1B2847] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#A8A29E] mt-5">
          © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

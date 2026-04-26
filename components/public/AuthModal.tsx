"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, MapPin, Eye, EyeOff, Mail, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/constants";
import { googleSignInAction, credentialsSignInAction } from "@/app/auth/login/actions";
import { registerUserAction, resendVerificationAction } from "@/app/auth/register/actions";

import { Suspense } from "react";

function AuthModalContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authMode = searchParams?.get("auth"); // "login" | "register" | null
  
  const mode = (authMode === "login" || authMode === "register") ? authMode : "login";
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  if (!authMode) return null;

  function closeModal() {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    newParams.delete("auth");
    const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }

  function switchMode(newMode: "login" | "register") {
    setError(null);
    setUnverifiedEmail(null);
    setResendState("idle");
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    newParams.set("auth", newMode);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }

  async function handleLoginSubmit(formData: FormData) {
    setError(null);
    setUnverifiedEmail(null);
    startTransition(async () => {
      const result = await credentialsSignInAction(formData);
      if (result?.error) {
        if (result.needsVerification && result.email) {
          setUnverifiedEmail(result.email);
        }
        setError(result.error);
      } else {
        closeModal();
      }
    });
  }

  function handleResend() {
    if (!unverifiedEmail || resendState === "sending") return;
    setResendState("sending");
    startTransition(async () => {
      await resendVerificationAction(unverifiedEmail);
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 5000);
    });
  }

  async function handleRegisterSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerUserAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        closeModal();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 animate-fade-in">
      <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-sm" onClick={closeModal} />
      
      <div className="relative w-full max-w-110 bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="h-1.5 bg-linear-to-r from-[#C41230] via-[#C8A84B] to-[#1B2847]" />

        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 text-[#A8A29E] hover:text-[#111] hover:bg-[#F8F7F5] rounded-full transition-colors z-10"
        >
          <X className="size-5" />
        </button>

        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C41230] mb-4 shadow-md">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-playfair)" }}>
              {mode === "login" ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="text-sm text-[#7A746D] mt-1">
              {mode === "login" 
                ? "Sign in to book tours and manage reservations" 
                : `Join ${COMPANY_NAME} to book amazing tours`}
            </p>
          </div>

          {error && !unverifiedEmail && (
            <div className="mb-5 p-3 bg-[#FEE2E2] text-[#C41230] text-xs font-semibold rounded-lg border border-[#FCA5A5]/50 text-center animate-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {unverifiedEmail && (
            <div className="mb-5 p-3 bg-[#EEF4FF] rounded-xl border border-[#BFDBFE] animate-in slide-in-from-top-1">
              <div className="flex items-start gap-2.5 mb-2">
                <Mail className="w-4 h-4 text-[#1B2847] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B2847]">Email not verified</p>
                  <p className="text-[11px] text-[#7A746D] mt-0.5">
                    Verify <strong>{unverifiedEmail}</strong> to sign in.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState !== "idle" || isPending}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1B2847] hover:text-[#C41230] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendState === "sending" ? (
                  <><span className="w-3 h-3 border-2 border-[#1B2847]/30 border-t-[#1B2847] rounded-full animate-spin" /> Sending...</>
                ) : resendState === "sent" ? (
                  <><CheckCircle className="w-3 h-3 text-[#1B7849]" /> Verification email sent!</>
                ) : (
                  <><RefreshCw className="w-3 h-3" /> Resend verification email</>
                )}
              </button>
            </div>
          )}

          {mode === "login" ? (
            <form action={handleLoginSubmit} className="space-y-4">
              <input type="hidden" name="redirectTo" value={pathname} />
              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[#111]">Password</label>
                  <Link href="/auth/forgot-password" className="text-[11px] font-bold text-[#C41230] hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full h-11 px-4 pr-11 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(p => !p)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#A8A29E] hover:text-[#111] transition-colors"
                    tabIndex={-1}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || loadingGoogle}
                className="w-full h-11 mt-2 bg-[#111] hover:bg-[#333] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Sign In"}
              </button>
            </form>
          ) : (
            <form action={handleRegisterSubmit} className="space-y-3">
              <input type="hidden" name="redirectTo" value={pathname} />
              <div>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name *"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address *"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Create Password *"
                  className="w-full h-11 px-4 pr-11 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#A8A29E] hover:text-[#1B2847] transition-colors"
                  tabIndex={-1}
                  aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State/Region"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full h-11 px-4 rounded-lg bg-[#F8F7F5] border border-transparent focus:bg-white text-[#111] placeholder:text-[#A8A29E] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || loadingGoogle}
                className="w-full h-11 mt-2 bg-[#1B2847] hover:bg-[#2A3B66] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Create Account"}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E4E0D9]" />
            <span className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-widest">Or</span>
            <div className="flex-1 h-px bg-[#E4E0D9]" />
          </div>

          <form action={async (formData) => {
            setLoadingGoogle(true);
            setError(null);
            const result = await googleSignInAction(formData);
            if (result?.error) {
              setError(result.error);
              setLoadingGoogle(false);
            }
          }}>
            <input type="hidden" name="redirectTo" value={pathname} />
            <button
              type="submit"
              disabled={loadingGoogle || isPending}
              className="w-full h-11 rounded-lg border border-[#E4E0D9] bg-white text-sm font-bold text-[#111] hover:bg-[#FAFAFA] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-sm"
            >
              {loadingGoogle ? (
                <span className="w-4 h-4 border-2 border-[#A8A29E]/40 border-t-[#111111] rounded-full animate-spin" />
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

          <p className="text-center text-xs font-medium text-[#7A746D] mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-bold text-[#C41230] hover:underline focus:outline-none"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export function AuthModal() {
  return (
    <Suspense fallback={null}>
      <AuthModalContent />
    </Suspense>
  );
}

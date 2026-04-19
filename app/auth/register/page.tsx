"use client";

import { COMPANY_NAME } from "@/lib/constants";
import { MapPin, ArrowRight, Mail, RefreshCw, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { registerUserAction, resendVerificationAction } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerUserAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.needsVerification) {
        setVerifyEmail(result.email ?? null);
      }
    });
  }

  function handleResend() {
    if (!verifyEmail || resendState === "sending") return;
    setResendState("sending");
    startTransition(async () => {
      await resendVerificationAction(verifyEmail);
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 5000);
    });
  }

  // ── Verification pending screen ──────────────────────────────────────────────
  if (verifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F8F9FF] via-white to-[#F1F5F9] px-4 pt-24 pb-16">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-150 h-150 rounded-full bg-[#185FA5]/5" />
          <div className="absolute -bottom-40 -left-40 w-125 h-125 rounded-full bg-[#0C447C]/5" />
        </div>

        <div className="w-full max-w-lg relative z-10">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(228,224,217,0.8)] overflow-hidden">
            <div className="h-1.5 bg-linear-to-r from-[#185FA5] via-[#EF9F27] to-[#0C447C]" />

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#EEF4FF] mb-6">
                <Mail className="w-10 h-10 text-[#0C447C]" />
              </div>

              <h1 className="text-2xl font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                Check your inbox
              </h1>
              <p className="text-[#7A746D] mb-6 leading-relaxed">
                We've sent a verification link to<br />
                <strong className="text-[#0C447C]">{verifyEmail}</strong>
              </p>

              {/* Info card */}
              <div className="bg-[#F8F9FF] rounded-xl p-5 mb-6 text-left border border-[#E7E8EE]">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1B7849] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#111] mb-0.5">What to do next</p>
                    <ol className="text-sm text-[#7A746D] space-y-1 list-decimal list-inside">
                      <li>Open the email from {COMPANY_NAME}</li>
                      <li>Click the "Verify My Email Address" button</li>
                      <li>You'll be redirected to the sign-in page</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Expiry note */}
              <p className="text-xs text-[#A8A29E] mb-6">
                The link expires in <strong>24 hours</strong>. Check your spam folder if you don't see it.
              </p>

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={resendState !== "idle" || isPending}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C447C] hover:text-[#185FA5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendState === "sending" ? (
                  <><span className="w-4 h-4 border-2 border-[#0C447C]/30 border-t-[#0C447C] rounded-full animate-spin" /> Sending...</>
                ) : resendState === "sent" ? (
                  <><CheckCircle className="w-4 h-4 text-[#1B7849]" /> Email sent!</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Resend verification email</>
                )}
              </button>

              <p className="text-center text-sm text-[#7A746D] mt-8">
                Already verified?{" "}
                <Link href="/auth/login" className="font-semibold text-[#185FA5] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F8F9FF] via-white to-[#F1F5F9] px-4 pt-24 pb-16">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-150 h-150 rounded-full bg-[#185FA5]/5" />
        <div className="absolute -bottom-40 -left-40 w-125 h-125 rounded-full bg-[#0C447C]/5" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(228,224,217,0.8)] overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-[#185FA5] via-[#EF9F27] to-[#0C447C]" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0C447C] mb-4 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: "var(--font-playfair)" }}>
                Create an Account
              </h1>
              <p className="text-sm text-[#7A746D] mt-1">
                Join {COMPANY_NAME} to book amazing tours and manage your trips.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] text-[#185FA5] text-sm rounded-lg border border-[#FCA5A5]/50">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Full Name <span className="text-[#185FA5]">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Email Address <span className="text-[#185FA5]">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Password <span className="text-[#185FA5]">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Create a strong password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#A8A29E] hover:text-[#0C447C] transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1.5">Country <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="country"
                    placeholder="e.g. USA"
                    className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1.5">State/Region <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. California"
                    className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Phone Number <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] transition-all"
                />
              </div>

              {/* Deal subscription opt-in */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="dealSubscription"
                  name="dealSubscription"
                  value="true"
                  className="mt-0.5 w-4 h-4 rounded border-[#E7E8EE] text-[#185FA5] focus:ring-[#185FA5]"
                />
                <label htmlFor="dealSubscription" className="text-sm text-[#7A746D] cursor-pointer">
                  Send me exclusive deals and discounts on tours
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#0C447C] hover:bg-[#08315E] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-[#7A746D] mt-8">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-[#185FA5] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

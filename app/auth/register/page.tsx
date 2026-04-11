"use client";

import { COMPANY_NAME } from "@/lib/constants";
import { MapPin, ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { registerUserAction } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerUserAction(formData);
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
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(228,224,217,0.8)] overflow-hidden">
          {/* Header stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#C41230] via-[#C8A84B] to-[#1B2847]" />

          <div className="p-8">
            {/* Logo / company */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B2847] mb-4 shadow-lg">
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
              <div className="mb-6 p-4 bg-[#FEE2E2] text-[#C41230] text-sm rounded-lg border border-[#FCA5A5]/50">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Full Name <span className="text-[#C41230]">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Email Address <span className="text-[#C41230]">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Password <span className="text-[#C41230]">*</span></label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Create a strong password"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1.5">Country <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="country"
                    placeholder="e.g. USA"
                    className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1.5">State/Region <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. California"
                    className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111] mb-1.5">Phone Number <span className="text-[#A8A29E] font-normal">(Optional)</span></label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  className="w-full h-12 px-4 rounded-lg border border-[#E4E0D9] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/20 focus:border-[#1B2847] transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#1B2847] hover:bg-[#2A3B66] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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
              <Link href="/auth/login" className="font-semibold text-[#C41230] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

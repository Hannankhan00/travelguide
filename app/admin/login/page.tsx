"use client";

import { useActionState } from "react";
import { adminLoginAction } from "./actions";
import { COMPANY_NAME } from "@/lib/constants";
import { Eye, EyeOff, MapPin, Lock } from "lucide-react";
import { useState } from "react";

export default function AdminLoginPage() {
  const [error, formAction, pending] = useActionState(adminLoginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 opacity-[0.07]"
          style={{
            background: "radial-gradient(ellipse, #C41230, transparent 70%)",
          }}
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-100 relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg bg-[#C41230] flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-white font-semibold text-xl tracking-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {COMPANY_NAME}
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <h1 className="text-xl font-bold text-[#111] mb-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#7A746D]">
              Sign in to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm animate-fade-in">
              <Lock className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#374151] mb-1.5"
              >
                Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@gotripjapan.com"
                className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] bg-white text-sm text-[#111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#374151] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full h-11 px-3.5 pr-11 rounded-lg border border-[#D1D5DB] bg-white text-sm text-[#111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 rounded-lg bg-[#C41230] text-white text-sm font-semibold hover:bg-[#a50e27] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#475569] mt-6">
          © {new Date().getFullYear()} {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

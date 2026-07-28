"use client";

import { useState } from "react";
import {
  Zap,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Demo accounts (role assigned server-side in production) ─────────────────

const DEMO_ACCOUNTS: Record<string, { role: string; redirect: string }> = {
  "admin@educore.com":   { role: "admin",   redirect: "/" },
  "sarah@educore.com":   { role: "teacher", redirect: "/teacher" },
  "student@educore.com": { role: "student", redirect: "/" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; password?: string; general?: string }>({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!login.trim()) errs.login = "Login is required.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    const account = DEMO_ACCOUNTS[login.toLowerCase().trim()];
    if (!account || password.length < 6) {
      setErrors({ general: "Invalid credentials. Please check your login and password." });
      return;
    }
    setSuccess(true);
    setTimeout(() => { window.location.href = account.redirect; }, 700);
  }

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col overflow-hidden">

        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EduCore</span>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-tight tracking-tight">
              Every student&apos;s progress,<br />
              <span className="text-indigo-200">one dashboard</span> away.
            </h1>
            <p className="mt-4 text-indigo-100/75 text-base leading-relaxed max-w-sm">
              Track attendance, grades, and growth in real time — built for educators who care about outcomes.
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-indigo-300/60">
            © 2026 EduCore. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">EduCore</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your EduCore account.</p>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5 mb-5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 mb-5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Signed in! Redirecting…</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Login field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Login
                </label>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your login"
                  icon={<User className="h-4 w-4" />}
                  value={login}
                  onChange={(e) => { setLogin(e.target.value); setErrors((p) => ({ ...p, login: undefined })); }}
                  disabled={loading || success}
                  error={errors.login}
                  className="h-11"
                />
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <a
                    href="#"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    disabled={loading || success}
                    error={errors.password}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={loading || success}
                    className="absolute right-3 top-[22px] -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <Checkbox
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                label="Remember me for 30 days"
              />

              {/* Sign In button */}
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={success}
                className="w-full"
              >
                {success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Signed in
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Demo hint */}
          <p className={cn("mt-5 text-center text-xs text-slate-400")}>
            Demo — login as admin@educore.com or sarah@educore.com, any password 6+ characters.
          </p>
        </div>
      </div>
    </div>
  );
}

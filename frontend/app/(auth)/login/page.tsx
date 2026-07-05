"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Users,
  BookOpen,
  CalendarCheck,
  BarChart2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Feature list shown on left panel ────────────────────────────────────────

const FEATURES = [
  { icon: Users, label: "Student & Teacher Management" },
  { icon: CalendarCheck, label: "Attendance & Scheduling" },
  { icon: BookOpen, label: "Courses, Exams & Assignments" },
  { icon: BarChart2, label: "Grades & Performance Analytics" },
];

// ─── Decorative stat cards on left panel ─────────────────────────────────────

const STATS = [
  { value: "2,400+", label: "Students Enrolled" },
  { value: "98%", label: "Attendance Rate" },
  { value: "180+", label: "Active Courses" },
];

// ─── Demo accounts (role assigned server-side in production) ─────────────────

const DEMO_ACCOUNTS: Record<string, { role: string; redirect: string }> = {
  "admin@educore.com":   { role: "admin",   redirect: "/" },
  "sarah@educore.com":   { role: "teacher", redirect: "/teacher" },
  "student@educore.com": { role: "student", redirect: "/" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Email or username is required.";
    else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";
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
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    const account = DEMO_ACCOUNTS[email.toLowerCase().trim()];
    if (!account || password.length < 6) {
      setErrors({ general: "Invalid credentials. Please check your email and password." });
      return;
    }
    setSuccess(true);
    setTimeout(() => { window.location.href = account.redirect; }, 800);
  }

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col overflow-hidden">

        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EduCore</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-auto pt-16">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium text-white/90 mb-6 ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Education Management Platform
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Manage your<br />
              <span className="text-indigo-200">education</span> in<br />
              one place.
            </h1>
            <p className="mt-5 text-indigo-100/80 text-base leading-relaxed max-w-sm">
              EduCore helps educational centers manage students, teachers, schedules, attendance, payments, exams, and communication — all from a single dashboard.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm text-white/80">{label}</span>
                </li>
              ))}
            </ul>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-4 ring-1 ring-white/15"
                >
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-indigo-200 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-indigo-300/60 mt-8">
            © 2026 EduCore. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">

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
              <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue.</p>
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

              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="email"
                    placeholder="you@educore.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    disabled={loading || success}
                    className={cn(
                      "w-full h-10 pl-9 pr-4 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                      "focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
                      errors.email
                        ? "border-red-300 focus:ring-red-400 bg-red-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Link
                    href="#"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    disabled={loading || success}
                    className={cn(
                      "w-full h-10 pl-9 pr-10 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                      "focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
                      errors.password
                        ? "border-red-300 focus:ring-red-400 bg-red-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={loading || success}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((r) => !r)}
                  disabled={loading || success}
                  className={cn(
                    "h-4.5 w-4.5 h-[18px] w-[18px] rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                    rememberMe
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300 hover:border-indigo-400 bg-white"
                  )}
                >
                  {rememberMe && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <label
                  onClick={() => setRememberMe((r) => !r)}
                  className="text-sm text-slate-600 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading || success}
                className={cn(
                  "w-full h-10 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2",
                  "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  "disabled:opacity-60 disabled:pointer-events-none shadow-sm"
                )}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </>
                ) : success ? (
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
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Google button */}
              <button
                type="button"
                disabled={loading || success}
                className={cn(
                  "w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700",
                  "flex items-center justify-center gap-2.5 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {/* Google SVG icon */}
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <span className="text-slate-700 font-medium">Contact your administrator.</span>
          </p>

          {/* Demo hint */}
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-2">Demo credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-indigo-600">
                <span className="font-medium">Admin:</span> admin@educore.com
              </p>
              <p className="text-xs text-indigo-600">
                <span className="font-medium">Teacher:</span> sarah@educore.com
              </p>
              <p className="text-xs text-indigo-600">
                <span className="font-medium">Password:</span> any 6+ characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

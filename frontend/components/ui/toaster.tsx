"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";
import { useToastStore } from "@/lib/store/toast-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-2.5 rounded-xl border p-3.5 shadow-sm bg-white",
            t.variant === "success" ? "border-emerald-100" : "border-red-100"
          )}
        >
          {t.variant === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={cn(
              "text-sm flex-1",
              t.variant === "success" ? "text-emerald-700" : "text-red-600"
            )}
          >
            {t.message}
          </p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-300 hover:text-slate-500 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

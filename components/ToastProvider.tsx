"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Toast = {
  id: string;
  title: string;
  message?: string;
  variant?: "success" | "error" | "info";
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function toastColor(variant: Toast["variant"]) {
  switch (variant) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "error":
      return "border-red-200 bg-red-50 text-red-950";
    case "info":
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next: Toast = { id, variant: "info", ...t };
    setToasts((prev) => [next, ...prev].slice(0, 5));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "w-[320px] rounded border p-3 shadow-sm backdrop-blur",
              toastColor(t.variant),
            )}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.message && <div className="mt-1 text-sm opacity-90">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


"use client";

import React from "react";
import { cn } from "@/lib/cn";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "danger" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variant === "neutral" && "border-slate-200 bg-slate-50 text-slate-700",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "danger" && "border-red-200 bg-red-50 text-red-700",
        variant === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        variant === "info" && "border-blue-200 bg-blue-50 text-blue-700",
        className,
      )}
      {...props}
    />
  );
}


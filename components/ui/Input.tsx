"use client";

import React from "react";
import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function Input({ className, error, label, ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <input
        className={cn(
          "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
          error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


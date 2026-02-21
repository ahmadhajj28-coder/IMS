"use client";

import React from "react";
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" &&
          "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "bg-transparent text-slate-700 hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}


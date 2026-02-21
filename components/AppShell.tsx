"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/cn";

const title = "Inventory Admin";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Keep the login page clean (no chrome).
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className={cn(
              "text-lg font-semibold text-slate-900 hover:text-slate-700",
              pathname === "/dashboard" && "text-slate-900",
            )}
          >
            {title}
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

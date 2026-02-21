"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-lg",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="border-b border-slate-200 p-4">
            <div className="text-base font-semibold">{title}</div>
            {description && (
              <div className="mt-1 text-sm text-slate-600">{description}</div>
            )}
          </div>
          <div className="p-4">{children}</div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-3">
            {footer ?? (
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


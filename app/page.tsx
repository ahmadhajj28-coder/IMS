'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const schema = z.object({
      email: z.string().trim().min(1, "Email is required"),
      password: z.string().min(1, "Password is required"),
    });

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Invalid credentials");
        return;
      }

      toast({ title: "Signed in", variant: "success" });
      router.push("/dashboard");
    } catch {
      setError("Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm"
      >
        <Card className="p-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">
              Inventory admin login
            </h1>
            <p className="text-sm text-slate-600">
              Use your admin email and password from <span className="font-mono">.env</span>.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </Card>
      </form>
    </main>
  );
}

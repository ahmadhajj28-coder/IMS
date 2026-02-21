"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

export default function SuppliersPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Supplier created", variant: "success" });
        setForm({ name: "", email: "", phone: "", address: "" });
        load();
      } else {
        toast({ title: data?.error ?? "Create failed", variant: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add and manage suppliers for reordering.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Create supplier</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create supplier"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Existing suppliers</h2>
        {suppliers.length === 0 ? (
          <p className="text-sm text-slate-500">No suppliers yet. Create one above.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {suppliers.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded border border-slate-100 p-3"
              >
                <span className="font-medium text-slate-900">{s.name}</span>
                {s.email && (
                  <a
                    href={`mailto:${s.email}`}
                    className="text-slate-600 hover:underline"
                  >
                    {s.email}
                  </a>
                )}
                {s.phone && (
                  <span className="text-slate-600">{s.phone}</span>
                )}
                {s.address && (
                  <span className="w-full text-slate-500">{s.address}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

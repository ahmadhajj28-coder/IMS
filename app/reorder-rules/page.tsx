'use client';

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

type Product = { id: number; name: string; sku: string };
type Supplier = { id: number; name: string };

type Rule = {
  id: number;
  productId: number | null;
  minStock: number;
  maxStock: number;
  reorderQty: number;
  supplierId: number | null;
  product?: { id: number; name: string; sku: string } | null;
  supplier?: { id: number; name: string } | null;
};

export default function ReorderRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    productId: "",
    minStock: 0,
    maxStock: 100,
    reorderQty: 10,
    supplierId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadRules() {
    const res = await fetch("/api/reorder-rules");
    setRules(await res.json());
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.map((p: { id: number; name: string; sku: string }) => ({ id: p.id, name: p.name, sku: p.sku })));
  }

  async function loadSuppliers() {
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  useEffect(() => {
    loadRules();
    loadProducts();
    loadSuppliers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.productId) {
      setError("Select a product");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reorder-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(form.productId),
          minStock: form.minStock,
          maxStock: form.maxStock,
          reorderQty: form.reorderQty,
          supplierId: form.supplierId ? Number(form.supplierId) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Rule saved", variant: "success" });
        loadRules();
      } else {
        setError(data?.error ?? "Save failed");
        toast({ title: data?.error ?? "Save failed", variant: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reordering rules</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set min and max on-hand per product. Reorder when below min.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Add or update rule (by product)</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Min on hand"
            type="number"
            min={0}
            value={form.minStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, minStock: Number(e.target.value) }))
            }
          />
          <Input
            label="Max on hand"
            type="number"
            min={1}
            value={form.maxStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxStock: Number(e.target.value) }))
            }
          />
          <Input
            label="Reorder qty"
            type="number"
            min={1}
            value={form.reorderQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, reorderQty: Number(e.target.value) }))
            }
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Supplier (optional)
            </label>
            <select
              value={form.supplierId}
              onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-5">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save rule"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 text-sm">
        <h2 className="mb-2 font-semibold">Rules by product</h2>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded border border-slate-100 py-2 pr-2"
            >
              <span className="font-medium">
                {r.product ? `${r.product.name} (${r.product.sku})` : "—"}
              </span>
              <span className="text-slate-600">
                min {r.minStock} · max {r.maxStock} · reorder {r.reorderQty}
              </span>
              {r.supplier && (
                <span className="text-slate-500">· {r.supplier.name}</span>
              )}
            </li>
          ))}
          {rules.length === 0 && (
            <li className="text-slate-500">No rules yet. Add one above.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

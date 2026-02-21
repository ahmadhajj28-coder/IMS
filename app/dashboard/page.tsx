"use client";

import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  price: number | string;
  quantity: number;
  lowStockThreshold: number;
};

type Movement = {
  id: number;
  productId: number;
  type: string;
  quantity: number;
  movementDate: string;
  product: { name: string; sku: string };
};

type DashboardData = {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockItems: Product[];
  products: Product[];
  stockMovements: Movement[];
};

const FEATURE_CARDS = [
  { href: "/dashboard", label: "Dashboard", description: "Overview and stats" },
  { href: "/products", label: "Products", description: "Manage product catalog" },
  { href: "/stock-movements", label: "Stock movements", description: "In, out & adjustments" },
  { href: "/reorder-rules", label: "Reordering", description: "Min/max per product" },
  { href: "/suppliers", label: "Suppliers", description: "Create and manage suppliers" },
  { href: "/evaluation", label: "Evaluation", description: "Inventory evaluation" },
] as const;

function productValue(p: Product): number {
  return Number(p.price) * p.quantity;
}

export default function DashboardPage() {
  const { data, error } = useSWR<DashboardData>("/api/dashboard", fetcher);

  if (error) return <div className="p-4 text-red-600">Failed to load dashboard.</div>;
  if (!data) return <div className="p-4 text-slate-500">Loading...</div>;

  const { totalProducts, totalInventoryValue, lowStockItems, products, stockMovements } = data;
  const totalValue = totalInventoryValue || 1;
  const chartProducts = [...products]
    .map((p) => ({ ...p, value: productValue(p) }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Inventory valuation, on-hand quantities, and recent movements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FEATURE_CARDS.filter((c) => c.href !== "/dashboard").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total products</p>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total inventory value</p>
          <p className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Low-stock items</p>
          <p className="text-2xl font-bold">{lowStockItems.length}</p>
        </Card>
      </section>

      <Card className="p-4">
        <h2 className="mb-4 font-semibold">Inventory valuation by product</h2>
        {chartProducts.length === 0 ? (
          <p className="text-sm text-slate-500">No inventory value yet.</p>
        ) : (
          <div className="space-y-2">
            {chartProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-sm text-slate-700" title={p.name}>
                  {p.name}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="h-6 rounded bg-emerald-500/80 transition-all"
                    style={{
                      width: `${Math.max((p.value / totalValue) * 100, 2)}%`,
                      minWidth: "4px",
                    }}
                    title={`$${p.value.toLocaleString()}`}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm font-medium text-slate-600">
                  ${p.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <h2 className="font-semibold">Quantities on hand</h2>
          <p className="text-sm text-slate-500">Current stock per product</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Product</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">SKU</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Category</th>
                <th className="px-4 py-2 text-right font-medium text-slate-700">Qty on hand</th>
                <th className="px-4 py-2 text-right font-medium text-slate-700">Unit price</th>
                <th className="px-4 py-2 text-right font-medium text-slate-700">Value</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const value = productValue(p);
                const isLow = p.quantity <= p.lowStockThreshold;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-600">{p.sku}</td>
                    <td className="px-4 py-2 text-slate-600">{p.category ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {isLow ? (
                        <Badge variant="warning">{p.quantity}</Badge>
                      ) : (
                        p.quantity
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      ${Number(p.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${value.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No products yet.</p>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div>
            <h2 className="font-semibold">Stock movements</h2>
            <p className="text-sm text-slate-500">Latest inventory in/out and adjustments</p>
          </div>
          <Link
            href="/stock-movements"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Product</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Type</th>
                <th className="px-4 py-2 text-right font-medium text-slate-700">Qty</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-2">
                    <span className="font-medium">{m.product.name}</span>
                    <span className="ml-1 text-slate-500">({m.product.sku})</span>
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        m.type === "IN"
                          ? "success"
                          : m.type === "OUT"
                            ? "danger"
                            : "info"
                      }
                    >
                      {m.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">{m.quantity}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(m.movementDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stockMovements.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No movements yet.</p>
        )}
      </Card>
    </main>
  );
}

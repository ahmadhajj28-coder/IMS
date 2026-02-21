'use client';

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ToastProvider";

type Movement = {
  id: number;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason?: string | null;
  movementDate: string;
  product: { id: number; name: string };
  lot?: { id: number; lotNumber: string } | null;
};

type ProductOption = { id: number; name: string };

export default function StockMovementsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [items, setItems] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(0);

  const queryKey = useMemo(
    () => JSON.stringify({ productId, type, from, to }),
    [productId, type, from, to],
  );

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data.map((p: any) => ({ id: p.id, name: p.name })));
    })();
  }, []);

  async function loadFirstPage() {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (productId) sp.set("productId", productId);
      if (type) sp.set("type", type);
      if (from) sp.set("from", new Date(from).toISOString());
      if (to) sp.set("to", new Date(to).toISOString());
      sp.set("skip", "0");
      sp.set("take", "25");
      const res = await fetch(`/api/stock-movements?${sp.toString()}`);
      const data = await res.json();
      setItems(data.items);
      setHasMore(!!data.hasMore);
      setNextSkip(data.nextSkip ?? data.items?.length ?? 0);
    } catch (e: any) {
      toast({
        title: "Failed to load movements",
        message: e?.message ?? "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const sp = new URLSearchParams();
      if (productId) sp.set("productId", productId);
      if (type) sp.set("type", type);
      if (from) sp.set("from", new Date(from).toISOString());
      if (to) sp.set("to", new Date(to).toISOString());
      sp.set("skip", String(nextSkip));
      sp.set("take", "25");
      const res = await fetch(`/api/stock-movements?${sp.toString()}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.items ?? [])]);
      setHasMore(!!data.hasMore);
      setNextSkip(data.nextSkip ?? nextSkip + (data.items?.length ?? 0));
    } catch (e: any) {
      toast({
        title: "Failed to load more",
        message: e?.message ?? "Unknown error",
        variant: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  function badgeVariant(t: Movement["type"]) {
    if (t === "IN") return "success";
    if (t === "OUT") return "danger";
    return "info";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock movements</h1>
        <p className="mt-1 text-sm text-slate-600">
          Filter by product, type, and date range. Use “Load more” to paginate.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Product
            </label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Type
            </label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUST">ADJUST</option>
            </select>
          </div>

          <Input
            label="From"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium">{items.length}</span> movement(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setProductId("");
                setType("");
                setFrom("");
                setTo("");
              }}
            >
              Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={loadFirstPage}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Lot</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-600">
                  Loading…
                </td>
              </tr>
            ) : (
              <>
                {items.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">
                      {new Date(m.movementDate).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">{m.product.name}</td>
                    <td className="px-3 py-2">{m.lot?.lotNumber ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={badgeVariant(m.type)}>{m.type}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "="}
                      {m.quantity}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {m.reason ?? "—"}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      No movements found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-center">
        {hasMore ? (
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        ) : (
          <div className="text-sm text-slate-600">No more results.</div>
        )}
      </div>
    </div>
  );
}


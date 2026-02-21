'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { productSchema, stockMovementSchema } from "@/lib/validation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ToastProvider";

type Product = {
  id: number;
  name: string;
  sku: string;
  category?: string | null;
  price: number;
  quantity: number;
  lowStockThreshold: number;
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: 0,
    quantity: 0,
    lowStockThreshold: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: 0,
    lowStockThreshold: 0,
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirm");
  const [confirmDesc, setConfirmDesc] = useState<string | undefined>(undefined);
  const [onConfirm, setOnConfirm] = useState<null | (() => Promise<void>)>(null);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [quickForm, setQuickForm] = useState({
    type: "IN",
    quantity: 0,
    reason: "",
    reference: "",
    movementDate: new Date().toISOString().slice(0, 16),
  });
  const [quickErrors, setQuickErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setApiError(e?.message ?? "Failed to load products");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});

    const parsed = productSchema.safeParse({
      ...form,
      category: form.category ? form.category : null,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setFormErrors(next);
      return;
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      toast({ title: "Product created", variant: "success" });
      setForm({
        name: "",
        sku: "",
        category: "",
        price: 0,
        quantity: 0,
        lowStockThreshold: 0,
      });
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Create failed",
        message: body?.error ?? "Could not create product",
        variant: "error",
      });
    }
  }

  function openEdit(p: Product) {
    setEditTarget(p);
    setEditForm({
      name: p.name,
      sku: p.sku,
      category: p.category ?? "",
      price: p.price,
      lowStockThreshold: p.lowStockThreshold,
    });
    setEditErrors({});
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setEditErrors({});

    const schema = productSchema.pick({
      name: true,
      sku: true,
      category: true,
      price: true,
      lowStockThreshold: true,
      quantity: true,
    });

    const parsed = schema.safeParse({
      ...editForm,
      quantity: 0,
      category: editForm.category ? editForm.category : null,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setEditErrors(next);
      return;
    }

    const res = await fetch(`/api/products/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      toast({ title: "Product updated", variant: "success" });
      setEditOpen(false);
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Update failed",
        message: body?.error ?? "Could not update product",
        variant: "error",
      });
    }
  }

  function confirm(action: () => Promise<void>, title: string, desc?: string) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setOnConfirm(() => action);
    setConfirmOpen(true);
  }

  async function deleteOne(id: number) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Product deleted", variant: "success" });
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Delete failed",
        message: body?.error ?? "Could not delete product",
        variant: "error",
      });
    }
  }

  async function bulkDelete() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k))
      .filter((x) => Number.isInteger(x) && x > 0);
    if (ids.length === 0) return;
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    }
    toast({ title: `Deleted ${ids.length} product(s)`, variant: "success" });
    setSelected({});
    load();
  }

  function openQuickAdjust(p: Product) {
    setQuickProduct(p);
    setQuickForm({
      type: "IN",
      quantity: 0,
      reason: "",
      reference: "",
      movementDate: new Date().toISOString().slice(0, 16),
    });
    setQuickErrors({});
    setQuickOpen(true);
  }

  async function saveQuickAdjust() {
    if (!quickProduct) return;
    setQuickErrors({});
    if (quickForm.type === "OUT" && quickForm.quantity > quickProduct.quantity) {
      setQuickErrors({
        quantity: `Cannot remove more than current quantity (${quickProduct.quantity})`,
      });
      return;
    }
    const parsed = stockMovementSchema.safeParse({
      productId: quickProduct.id,
      type: quickForm.type,
      quantity: quickForm.quantity,
      reason: quickForm.reason,
      reference: quickForm.reference,
      movementDate: quickForm.movementDate
        ? new Date(quickForm.movementDate).toISOString()
        : undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setQuickErrors(next);
      return;
    }

    const res = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (res.ok) {
      toast({ title: "Stock updated", variant: "success" });
      setQuickOpen(false);
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Adjustment failed",
        message: body?.error ?? "Could not record movement",
        variant: "error",
      });
    }
  }

  const categories = Array.from(
    new Set(items.map((x) => (x.category ?? "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const filtered = items.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q);
    const matchesCategory =
      !categoryFilter || (p.category ?? "") === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create, search, edit, delete, and quickly adjust stock.
          </p>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600">
              {selectedCount} selected
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                confirm(
                  bulkDelete,
                  "Delete selected products?",
                  "This action cannot be undone.",
                )
              }
            >
              Delete selected
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
          <Input
            label="Name"
            placeholder="e.g. USB-C Cable"
            value={form.name}
            error={formErrors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="SKU"
            placeholder="e.g. CBL-USBC-1M"
            value={form.sku}
            error={formErrors.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          />
          <Input
            label="Category"
            placeholder="e.g. Cables"
            value={form.category}
            error={formErrors.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
          />
          <Input
            label="Price"
            type="number"
            value={form.price}
            error={formErrors.price}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
          />
          <Input
            label="Initial quantity"
            type="number"
            value={form.quantity}
            error={formErrors.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
            }
          />
          <Input
            label="Low-stock threshold"
            type="number"
            value={form.lowStockThreshold}
            error={formErrors.lowStockThreshold}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                lowStockThreshold: Number(e.target.value),
              }))
            }
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full md:w-auto">
              Add product
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Search"
            placeholder="Search by name, SKU, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Category
            </label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{filtered.length}</span> of{" "}
              <span className="font-medium">{items.length}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={load}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          {loading ? (
            <p className="p-4 text-sm">Loading…</p>
          ) : apiError ? (
            <p className="p-4 text-sm text-red-600">{apiError}</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((p) => selected[p.id])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelected((prev) => {
                          const next = { ...prev };
                          for (const p of filtered) next[p.id] = checked;
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Low-stock</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[p.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [p.id]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{p.sku}</td>
                    <td className="px-3 py-2">{p.category ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.quantity}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.lowStockThreshold}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openQuickAdjust(p)}
                        >
                          Quick adjust
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            confirm(
                              () => deleteOne(p.id),
                              `Delete ${p.name}?`,
                              "This action cannot be undone.",
                            )
                          }
                        >
                          Delete
                        </Button>
                        <Link
                          href={`/products/${p.id}`}
                          className="inline-flex h-8 items-center rounded px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center">
                      No matching products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={editOpen}
        title={editTarget ? `Edit ${editTarget.name}` : "Edit product"}
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Name"
            value={editForm.name}
            error={editErrors.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="SKU"
            value={editForm.sku}
            error={editErrors.sku}
            onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
          />
          <Input
            label="Category"
            value={editForm.category}
            error={editErrors.category}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, category: e.target.value }))
            }
          />
          <Input
            label="Price"
            type="number"
            value={editForm.price}
            error={editErrors.price}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
          />
          <Input
            label="Low-stock threshold"
            type="number"
            value={editForm.lowStockThreshold}
            error={editErrors.lowStockThreshold}
            onChange={(e) =>
              setEditForm((f) => ({
                ...f,
                lowStockThreshold: Number(e.target.value),
              }))
            }
          />
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setConfirmOpen(false);
                await onConfirm?.();
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-700">
          Please confirm you want to continue.
        </div>
      </Modal>

      <Modal
        open={quickOpen}
        title={quickProduct ? `Quick adjust – ${quickProduct.name}` : "Quick adjust"}
        onClose={() => setQuickOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQuickOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuickAdjust}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={quickForm.type}
              onChange={(e) => setQuickForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUST">ADJUST (set to)</option>
            </select>
          </div>
          <Input
            label="Quantity"
            type="number"
            value={quickForm.quantity}
            error={quickErrors.quantity}
            onChange={(e) =>
              setQuickForm((f) => ({ ...f, quantity: Number(e.target.value) }))
            }
          />
          <Input
            label="Backdated datetime"
            type="datetime-local"
            value={quickForm.movementDate}
            onChange={(e) =>
              setQuickForm((f) => ({ ...f, movementDate: e.target.value }))
            }
          />
          <Input
            label="Reason"
            value={quickForm.reason}
            onChange={(e) => setQuickForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Input
              label="Reference"
              value={quickForm.reference}
              onChange={(e) =>
                setQuickForm((f) => ({ ...f, reference: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}


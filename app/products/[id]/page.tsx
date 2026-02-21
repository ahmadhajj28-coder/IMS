'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { lotSchema, stockMovementSchema } from "@/lib/validation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ToastProvider";

type Lot = {
  id: number;
  lotNumber: string;
  expiryDate: string | null;
  quantity: number;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  category?: string | null;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  lots: Lot[];
};

export default function ProductDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = Number(params?.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [pageError, setPageError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [newLot, setNewLot] = useState({
    lotNumber: "",
    expiryDate: "",
    quantity: 0,
  });
  const [lotErrors, setLotErrors] = useState<Record<string, string>>({});

  const [movement, setMovement] = useState({
    type: "IN",
    quantity: 0,
    lotId: 0,
    reason: "",
    reference: "",
    movementDate: new Date().toISOString().slice(0, 16),
  });
  const [movementErrors, setMovementErrors] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirm");
  const [confirmDesc, setConfirmDesc] = useState<string | undefined>(undefined);
  const [onConfirm, setOnConfirm] = useState<null | (() => Promise<void>)>(null);

  async function load() {
    setPageError("");
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data);
      if (data.lots?.length) {
        setMovement((m) => ({ ...m, lotId: data.lots[0].id }));
      }
    } catch (e: any) {
      setPageError(e?.message ?? "Failed to load product");
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  function confirm(action: () => Promise<void>, title: string, desc?: string) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setOnConfirm(() => action);
    setConfirmOpen(true);
  }

  async function handleCreateLot(e: React.FormEvent) {
    e.preventDefault();
    setLotErrors({});
    const parsed = lotSchema.safeParse(newLot);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setLotErrors(next);
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/products/${id}/lots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (res.ok) {
      toast({ title: "Lot created", variant: "success" });
      setNewLot({ lotNumber: "", expiryDate: "", quantity: 0 });
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Create lot failed",
        message: body?.error ?? "Could not create lot",
        variant: "error",
      });
    }
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setMovementErrors({});
    const parsed = stockMovementSchema.safeParse({
      productId: product.id,
      lotId: movement.lotId || undefined,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      movementDate: movement.movementDate
        ? new Date(movement.movementDate).toISOString()
        : undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setMovementErrors(next);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (res.ok) {
      toast({ title: "Movement saved", variant: "success" });
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Movement failed",
        message: body?.error ?? "Could not record movement",
        variant: "error",
      });
    }
  }

  if (!product) {
    return <div className="text-sm">{pageError ? pageError : "Loading…"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            SKU <span className="font-mono">{product.sku}</span> · Category{" "}
            {product.category ?? "—"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="info">Qty {product.quantity}</Badge>
            <Badge variant="warning">
              Low-stock {product.lowStockThreshold}
            </Badge>
          </div>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to products
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">Lots</h2>
          <ul className="space-y-1 text-sm">
            {product.lots.map((lot) => (
              <li key={lot.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{lot.lotNumber}</div>
                  <div className="text-xs text-slate-600">
                    {lot.expiryDate
                      ? `Expiry: ${new Date(lot.expiryDate).toLocaleDateString()}`
                      : "No expiry"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">Qty {lot.quantity}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      confirm(
                        async () => {
                          const res = await fetch(`/api/lots/${lot.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            toast({ title: "Lot deleted", variant: "success" });
                            load();
                          } else {
                            const body = await res.json().catch(() => ({}));
                            toast({
                              title: "Delete failed",
                              message: body?.error ?? "Could not delete lot",
                              variant: "error",
                            });
                          }
                        },
                        `Delete lot ${lot.lotNumber}?`,
                        "This action cannot be undone.",
                      )
                    }
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {product.lots.length === 0 && (
              <li className="text-slate-500">No lots yet.</li>
            )}
          </ul>

          <form onSubmit={handleCreateLot} className="space-y-2 pt-3 text-sm">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Lot number"
                  placeholder="e.g. LOT-2026-001"
                  value={newLot.lotNumber}
                  error={lotErrors.lotNumber}
                  onChange={(e) =>
                    setNewLot((l) => ({ ...l, lotNumber: e.target.value }))
                  }
                />
              </div>
              <div className="w-40">
                <Input
                  label="Expiry"
                  type="date"
                  value={newLot.expiryDate}
                  error={lotErrors.expiryDate}
                  onChange={(e) =>
                    setNewLot((l) => ({ ...l, expiryDate: e.target.value }))
                  }
                />
              </div>
              <div className="w-32">
                <Input
                  label="Qty"
                  type="number"
                  value={newLot.quantity}
                  error={lotErrors.quantity}
                  onChange={(e) =>
                    setNewLot((l) => ({
                      ...l,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add lot"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">Adjust stock</h2>
          <form onSubmit={handleMovement} className="space-y-2 text-sm">
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={movement.type}
                onChange={(e) =>
                  setMovement((m) => ({ ...m, type: e.target.value }))
                }
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="ADJUST">ADJUST (set to)</option>
              </select>
              <div className="w-40">
                <Input
                  label="Qty"
                  type="number"
                  value={movement.quantity}
                  error={movementErrors.quantity}
                  onChange={(e) =>
                    setMovement((m) => ({
                      ...m,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <select
                className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm"
                value={movement.lotId}
                onChange={(e) =>
                  setMovement((m) => ({
                    ...m,
                    lotId: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>No lot</option>
                {product.lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotNumber}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Backdated datetime"
              type="datetime-local"
              value={movement.movementDate}
              onChange={(e) =>
                setMovement((m) => ({
                  ...m,
                  movementDate: e.target.value,
                }))
              }
            />
            <Input
              label="Reason"
              value={movement.reason}
              onChange={(e) =>
                setMovement((m) => ({ ...m, reason: e.target.value }))
              }
            />
            <Input
              label="Reference"
              value={movement.reference}
              onChange={(e) =>
                setMovement((m) => ({ ...m, reference: e.target.value }))
              }
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save movement"}
            </Button>
          </form>
        </Card>
      </section>

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
    </div>
  );
}
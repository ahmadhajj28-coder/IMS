import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.productId !== undefined) data.productId = body.productId;
  if (body.minStock !== undefined) data.minStock = body.minStock;
  if (body.maxStock !== undefined) data.maxStock = body.maxStock;
  if (body.reorderQty !== undefined) data.reorderQty = body.reorderQty;
  if (body.supplierId !== undefined) data.supplierId = body.supplierId;
  const rule = await prisma.reorderRule.update({
    where: { id },
    data,
    include: { product: true, supplier: true },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.reorderRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


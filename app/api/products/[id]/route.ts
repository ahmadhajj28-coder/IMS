import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const product = await prisma.product.findUnique({
    where: { id },
    include: { lots: true, movements: true, reorderRules: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();

  const parsed = productSchema
    .pick({
      name: true,
      sku: true,
      category: true,
      price: true,
      lowStockThreshold: true,
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...parsed.data,
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


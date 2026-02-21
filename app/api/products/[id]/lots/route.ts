import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lotSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const productId = Number(idParam);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const lots = await prisma.lot.findMany({
    where: { productId },
    orderBy: { expiryDate: "asc" },
  });
  return NextResponse.json(lots);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: idParam } = await params;
  const productId = Number(idParam);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = lotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { lotNumber, expiryDate, quantity } = parsed.data;

  const lot = await prisma.lot.create({
    data: {
      productId,
      lotNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      quantity: quantity ?? 0,
    },
  });

  return NextResponse.json(lot, { status: 201 });
}


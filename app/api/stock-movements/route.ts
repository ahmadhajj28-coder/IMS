import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordStockMovement } from "@/lib/inventory";
import { stockMovementSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productIdParam = url.searchParams.get("productId");
  const typeParam = url.searchParams.get("type");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const skip = Number(url.searchParams.get("skip") ?? "0");
  const take = Math.min(Number(url.searchParams.get("take") ?? "25"), 100);

  const where: any = {};
  if (productIdParam) {
    const productId = Number(productIdParam);
    if (Number.isInteger(productId) && productId > 0) where.productId = productId;
  }
  if (typeParam && ["IN", "OUT", "ADJUST"].includes(typeParam)) {
    where.type = typeParam;
  }
  if (fromParam || toParam) {
    where.movementDate = {};
    if (fromParam) {
      const d = new Date(fromParam);
      if (!Number.isNaN(d.getTime())) where.movementDate.gte = d;
    }
    if (toParam) {
      const d = new Date(toParam);
      if (!Number.isNaN(d.getTime())) where.movementDate.lte = d;
    }
  }

  const movements = await prisma.stockMovement.findMany({
    include: { product: true, lot: true },
    orderBy: [{ movementDate: "desc" }, { id: "desc" }],
    skip: Number.isInteger(skip) && skip > 0 ? skip : 0,
    take,
    where,
  });

  return NextResponse.json({
    items: movements,
    hasMore: movements.length === take,
    nextSkip: (Number.isInteger(skip) && skip > 0 ? skip : 0) + movements.length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = stockMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { productId, lotId, type, quantity, reason, reference, movementDate } =
    parsed.data;

  try {
    const result = await recordStockMovement({
      productId,
      lotId,
      type,
      quantity,
      reason,
      reference,
      movementDate: movementDate ? new Date(movementDate) : new Date(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}


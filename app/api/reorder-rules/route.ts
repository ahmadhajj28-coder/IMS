import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reorderRuleSchema } from "@/lib/validation";

export async function GET() {
  const rules = await prisma.reorderRule.findMany({
    include: { product: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = reorderRuleSchema.safeParse({
    ...body,
    supplierId: body.supplierId || null,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { productId, minStock, maxStock, reorderQty, supplierId } = parsed.data;
  // Upsert: one rule per product (update if exists)
  const existing = await prisma.reorderRule.findFirst({
    where: { productId },
  });
  const data = {
    productId,
    minStock,
    maxStock,
    reorderQty,
    supplierId: supplierId ?? null,
  };
  const rule = existing
    ? await prisma.reorderRule.update({
        where: { id: existing.id },
        data,
        include: { product: true, supplier: true },
      })
    : await prisma.reorderRule.create({
        data,
        include: { product: true, supplier: true },
      });
  return NextResponse.json(rule, { status: 201 });
}

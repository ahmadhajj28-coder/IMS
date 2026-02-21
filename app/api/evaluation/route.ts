import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "current";

  if (mode !== "current") {
    return NextResponse.json(
      { error: "Only mode=current is implemented" },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany();

  const totalValue = products.reduce(
    (sum: number, p: { price: unknown; quantity: number }) =>
      sum + Number(p.price) * p.quantity,
    0
  );

  return NextResponse.json({
    mode,
    totalValue,
    totalProducts: products.length,
  });
}
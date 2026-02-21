import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      include: { product: true },
      orderBy: { movementDate: "desc" },
      take: 50,
    }),
  ]);

  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum: number, p) => sum + Number(p.price) * p.quantity,
    0
  );
  const lowStockItems = products.filter(
    (p) => p.quantity <= p.lowStockThreshold
  );

  return NextResponse.json({
    totalProducts,
    totalInventoryValue,
    lowStockItems,
    products,
    stockMovements: movements,
  });
}
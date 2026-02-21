import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validation";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = supplierSchema.safeParse({
    ...body,
    email: body.email || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = {
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  };
  const supplier = await prisma.supplier.create({ data });
  return NextResponse.json(supplier, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ lotId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { lotId } = await params;
  const id = Number(lotId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid lot id" }, { status: 400 });
  }
  const { lotNumber, expiryDate } = await req.json();

  const lot = await prisma.lot.update({
    where: { id },
    data: {
      lotNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });

  return NextResponse.json(lot);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { lotId } = await params;
  const id = Number(lotId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid lot id" }, { status: 400 });
  }
  await prisma.lot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


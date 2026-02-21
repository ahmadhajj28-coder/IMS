import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Demo-only: accept credentials based solely on env vars.
  return NextResponse.json({ ok: true });
}


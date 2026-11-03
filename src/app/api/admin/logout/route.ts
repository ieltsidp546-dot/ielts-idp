import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession, hasTrustedOrigin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

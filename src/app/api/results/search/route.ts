import { NextRequest, NextResponse } from "next/server";
import { searchResultController } from "@/server/controllers/result.controller";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await searchResultController(payload);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store, private" }
  });
}

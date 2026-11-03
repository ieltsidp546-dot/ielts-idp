import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const records = await prisma.studentResult.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, givenName: true, familyName: true, identification: true,
      dateOfBirth: true, originalName: true, mimeType: true, createdAt: true
    },
    take: 500
  });
  return NextResponse.json({ records }, { headers: { "Cache-Control": "no-store" } });
}

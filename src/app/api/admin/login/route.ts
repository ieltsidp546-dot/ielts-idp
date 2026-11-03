import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSession, hasTrustedOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });

  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password || password.length > 200) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const genericError = () => NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!admin) {
    // Perform a dummy hash comparison to reduce account-enumeration timing differences.
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEe.4h9Q6P2lM2L6w8dQqQ2Q0J8l8yY5Y5Yy");
    return genericError();
  }
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return NextResponse.json({ error: "Sign-in temporarily unavailable. Try again later." }, { status: 429 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedLoginCount + 1;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginCount: attempts >= 8 ? 0 : attempts,
        lockedUntil: attempts >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null
      }
    });
    return genericError();
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginCount: 0, lockedUntil: null }
  });
  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}

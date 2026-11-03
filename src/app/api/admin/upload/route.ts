import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "@/lib/prisma";
import { getAdmin, hasTrustedOrigin } from "@/lib/auth";
import { storeDocument } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, max = 100) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });

  try {
    const form = await request.formData();
    const givenName = cleanText(form.get("givenName"));
    const familyName = cleanText(form.get("familyName"));
    const identification = cleanText(form.get("identification"));
    const dob = cleanText(form.get("dateOfBirth"), 10);
    const file = form.get("file");

    if (!givenName || !familyName || !identification || !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
        !(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Complete all fields and select a file up to 10 MB." }, { status: 400 });
    }

    const dateOfBirth = new Date(`${dob}T00:00:00.000Z`);
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.toISOString().slice(0, 10) !== dob) {
      return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(bytes);
    const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!detected || !allowed.has(detected.mime)) {
      return NextResponse.json({ error: "Only valid PDF, JPEG, PNG, or WebP files are accepted." }, { status: 400 });
    }

    const storageKey = `results/${randomUUID()}.${detected.ext}`;
    await storeDocument(storageKey, bytes, detected.mime);

    try {
      const record = await prisma.studentResult.create({
        data: {
          givenName, familyName, identification, dateOfBirth,
          storageKey, originalName: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 150),
          mimeType: detected.mime
        }
      });
      await prisma.adminAuditEvent.create({ data: { adminId: admin.id, action: "CREATE_RESULT", recordId: record.id } });
      return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
    } catch (error) {
      // Avoid orphaned files if the database write fails.
      const { deleteDocument } = await import("@/lib/storage");
      await deleteDocument(storageKey).catch(() => undefined);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Upload could not be completed. Check for duplicate or invalid record details." }, { status: 500 });
  }
}

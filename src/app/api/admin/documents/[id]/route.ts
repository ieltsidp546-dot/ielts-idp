import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "@/lib/prisma";
import { getAdmin, hasTrustedOrigin } from "@/lib/auth";
import { deleteDocument, storeDocument } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });

  const { id } = await context.params;
  const current = await prisma.studentResult.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Record not found." }, { status: 404 });

  try {
    const form = await request.formData();
    const givenName = String(form.get("givenName") ?? "").trim();
    const familyName = String(form.get("familyName") ?? "").trim();
    const identification = String(form.get("identification") ?? "").trim();
    const dob = String(form.get("dateOfBirth") ?? "");
    const dateOfBirth = new Date(`${dob}T00:00:00.000Z`);
    if (!givenName || !familyName || !identification || givenName.length > 100 ||
        familyName.length > 100 || identification.length > 100 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(dateOfBirth.getTime()) ||
        dateOfBirth.toISOString().slice(0, 10) !== dob) {
      return NextResponse.json({ error: "Invalid record details." }, { status: 400 });
    }

    const file = form.get("file");
    let storageKey = current.storageKey;
    let originalName = current.originalName;
    let mimeType = current.mimeType;
    let newKey: string | null = null;

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) return NextResponse.json({ error: "Maximum file size is 10 MB." }, { status: 400 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const detected = await fileTypeFromBuffer(bytes);
      if (!detected || !new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]).has(detected.mime)) {
        return NextResponse.json({ error: "Unsupported or invalid file type." }, { status: 400 });
      }
      newKey = `results/${randomUUID()}.${detected.ext}`;
      await storeDocument(newKey, bytes, detected.mime);
      storageKey = newKey;
      originalName = file.name.replace(/[^\w.\- ]/g, "_").slice(0, 150);
      mimeType = detected.mime;
    }

    try {
      const updated = await prisma.studentResult.update({
        where: { id },
        data: { givenName, familyName, identification, dateOfBirth, storageKey, originalName, mimeType }
      });
      if (newKey) await deleteDocument(current.storageKey).catch(() => undefined);
      await prisma.adminAuditEvent.create({ data: { adminId: admin.id, action: "UPDATE_RESULT", recordId: id } });
      return NextResponse.json({ ok: true, id: updated.id });
    } catch (error) {
      if (newKey) await deleteDocument(newKey).catch(() => undefined);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Unable to update record." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });

  const { id } = await context.params;
  const record = await prisma.studentResult.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });

  await prisma.studentResult.delete({ where: { id } });
  await deleteDocument(record.storageKey).catch(() => undefined);
  await prisma.adminAuditEvent.create({ data: { adminId: admin.id, action: "DELETE_RESULT", recordId: id } });
  return NextResponse.json({ ok: true });
}

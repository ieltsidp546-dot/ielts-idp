
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "@/lib/prisma";
import { getAdmin, hasTrustedOrigin } from "@/lib/auth";
import { storeDocument, deleteDocument } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, max = 100) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  let uploadStage = "authentication";

  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!hasTrustedOrigin(request)) {
      return NextResponse.json(
        { error: "Request rejected." },
        { status: 403 }
      );
    }

    uploadStage = "form_validation";

    const form = await request.formData();

    const givenName = cleanText(form.get("givenName"));
    const familyName = cleanText(form.get("familyName"));
    const identification = cleanText(form.get("identification"));
    const dob = cleanText(form.get("dateOfBirth"), 10);
    const file = form.get("file");

    if (
      !givenName ||
      !familyName ||
      !identification ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      !(file instanceof File) ||
      file.size < 1 ||
      file.size > MAX_BYTES
    ) {
      return NextResponse.json(
        { error: "Complete all fields and select a file up to 10 MB." },
        { status: 400 }
      );
    }

    const dateOfBirth = new Date(`${dob}T00:00:00.000Z`);

    if (
      Number.isNaN(dateOfBirth.getTime()) ||
      dateOfBirth.toISOString().slice(0, 10) !== dob
    ) {
      return NextResponse.json(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }

    uploadStage = "file_validation";

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(bytes);

    const allowed = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!detected || !allowed.has(detected.mime)) {
      return NextResponse.json(
        {
          error:
            "Only valid PDF, JPEG, PNG, or WebP files are accepted.",
        },
        { status: 400 }
      );
    }

    const storageKey = `results/${randomUUID()}.${detected.ext}`;

    uploadStage = "supabase_storage";

    await storeDocument(storageKey, bytes, detected.mime);

    let record;

    try {
      uploadStage = "database_record";

      record = await prisma.studentResult.create({
        data: {
          givenName,
          familyName,
          identification,
          dateOfBirth,
          storageKey,
          originalName: file.name
            .replace(/[^\w.\- ]/g, "_")
            .slice(0, 150),
          mimeType: detected.mime,
        },
      });
    } catch (error) {
      await deleteDocument(storageKey).catch((cleanupError) => {
        console.error("[UPLOAD CLEANUP ERROR]", cleanupError);
      });

      throw error;
    }

    try {
      uploadStage = "audit_event";

      await prisma.adminAuditEvent.create({
        data: {
          adminId: admin.id,
          action: "CREATE_RESULT",
          recordId: record.id,
        },
      });
    } catch (error) {
      console.error("[ADMIN AUDIT ERROR]", {
        name: error instanceof Error ? error.name : "Unknown",
        message:
          error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json(
      { ok: true, id: record.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("[ADMIN UPLOAD ERROR]", {
      stage: uploadStage,
      name: error instanceof Error ? error.name : "Unknown",
      message:
        error instanceof Error ? error.message : "Unknown error",
      code:
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? error.code
          : undefined,
    });

    return NextResponse.json(
      {
        error: "Upload could not be completed.",
        stage: uploadStage,
      },
      { status: 500 }
    );
  }
}

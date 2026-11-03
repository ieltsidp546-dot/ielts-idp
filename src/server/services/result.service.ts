import { createDocumentUrl } from "@/lib/storage";
import { findExactResult } from "@/server/repositories/result.repository";
import type { ResultSearchInput } from "@/lib/validation";

export async function searchStudentResult(input: ResultSearchInput) {
  const dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.toISOString().slice(0, 10) !== input.dateOfBirth) {
    throw new Error("Invalid date of birth.");
  }

  const record = await findExactResult({ ...input, dateOfBirth });
  if (!record) return null;

  const documentUrl = await createDocumentUrl(record.storageKey);
  return {
    documentUrl,
    fileType: record.mimeType === "application/pdf" ? "pdf" : "image",
    fileName: record.originalName
  };
}

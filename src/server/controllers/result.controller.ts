import { resultSearchSchema } from "@/lib/validation";
import { searchStudentResult } from "@/server/services/result.service";

export async function searchResultController(payload: unknown) {
  const parsed = resultSearchSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "Please check all four fields and try again." } };
  }

  try {
    const result = await searchStudentResult(parsed.data);
    if (!result) return { status: 404, body: { error: "Record not found." } };
    return { status: 200, body: result };
  } catch {
    // Do not expose database, storage, or infrastructure errors to public clients.
    return { status: 500, body: { error: "We could not process your request. Please try again later." } };
  }
}

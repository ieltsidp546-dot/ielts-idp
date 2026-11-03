import { z } from "zod";

export const resultSearchSchema = z.object({
  givenName: z.string().trim().min(1).max(100),
  familyName: z.string().trim().min(1).max(100),
  identification: z.string().trim().min(3).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
}).strict();

export type ResultSearchInput = z.infer<typeof resultSearchSchema>;

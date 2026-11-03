import { prisma } from "@/lib/prisma";

export async function findExactResult(input: {
  givenName: string;
  familyName: string;
  identification: string;
  dateOfBirth: Date;
}) {
  return prisma.studentResult.findFirst({
    where: {
      givenName: { equals: input.givenName, mode: "insensitive" },
      familyName: { equals: input.familyName, mode: "insensitive" },
      identification: { equals: input.identification },
      dateOfBirth: input.dateOfBirth
    },
    select: { id: true, storageKey: true, mimeType: true, originalName: true }
  });
}

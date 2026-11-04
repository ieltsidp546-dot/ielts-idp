
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const endpoint = process.env.AWS_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

function getS3Client() {
  if (
    !region ||
    !bucket ||
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    throw new Error("Supabase S3 storage configuration is incomplete.");
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function createDocumentUrl(
  storageKey: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: 60,
  });
}

export async function storeDocument(
  key: string,
  bytes: Uint8Array,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentType: contentType,
  });

  await getS3Client().send(command);
}

export async function deleteDocument(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await getS3Client().send(command);
}

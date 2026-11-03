import {
  S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

function getS3Client() {
  if (!region || !bucket) throw new Error("Private document storage is not configured.");
  return new S3Client({ region });
}

export async function createDocumentUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ResponseContentDisposition: "inline"
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 60 });
}

export async function storeDocument(key: string, bytes: Uint8Array, contentType: string) {
  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: bytes, ContentType: contentType,
    ServerSideEncryption: "AES256"
  }));
}

export async function deleteDocument(key: string) {
  await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

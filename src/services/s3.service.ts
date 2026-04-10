import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.js";

export async function getUploadUrl({
  filename,
  contentType,
}: {
  filename: string;
  contentType: string;
}) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 20 }); // URL expires in 20 minutes

  return url;
}

export async function getDownloadUrl({ key }: { key: string }) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60 * 24 * 2,
  }); // URL expires in 2 days

  return url;
}

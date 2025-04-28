import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

export async function uploadImageToS3(imageData: string, key: string, isBase64 = false): Promise<string> {
  let buffer: Buffer;
  
  if (isBase64) {
    // Handle base64 encoded image
    buffer = Buffer.from(imageData, 'base64');
  } else {
    // Handle image URL
    const response = await fetch(imageData);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }
  
  const bucketName = process.env.AD_IMAGES_BUCKET_NAME || "ad-images-bucket";
  
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  }));
  
  return `https://${bucketName}.s3.amazonaws.com/${key}`;
}

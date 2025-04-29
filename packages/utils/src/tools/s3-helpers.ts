import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { storeS3Image } from "./s3-utils";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export async function getCloudFrontUrl(key: string): Promise<string> {
  const cdnDomain = Resource.AdsBucketRouter.url;
  return `${cdnDomain}/${key}`;
}

export async function uploadImageToS3(imageData: string, key: string, isBase64 = false): Promise<string> {
  try {
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
    
    const bucketName = Resource.AdsBucket.name;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    }));
    
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

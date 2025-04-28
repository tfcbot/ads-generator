import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const s3Client = new S3Client({ region: "us-east-1" });

export async function uploadImageToS3(imageUrl: string, key: string): Promise<string> {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  
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

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  HeadObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from 'stream';
import {
  GetS3ImageInput,
  GetS3ImageOutput,
  StoreS3ImageInput,
  StoreS3ImageOutput,
  GetPresignedUrlInput,
  GetPresignedUrlOutput,
  GetImageMetadataInput,
  GetImageMetadataOutput
} from '../metadata/s3-schemas';
import { Resource } from 'sst';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Retrieves an image from S3
 */
export const getS3Image = async (input: GetS3ImageInput): Promise<GetS3ImageOutput> => {
  try {
    const parsedInput = GetS3ImageInput.parse(input);
    const getCommand = new GetObjectCommand({
      Bucket: parsedInput.bucket,
      Key: parsedInput.key,
    });

    const { Body } = await s3Client.send(getCommand);
    const buffer = await streamToBuffer(Body as Readable);

    return GetS3ImageOutput.parse(buffer);
  } catch (error) {
    console.error('Error retrieving image from S3:', error);
    throw error;
  }
};

/**
 * Stores an image in S3
 */
export const storeS3Image = async (input: StoreS3ImageInput): Promise<StoreS3ImageOutput> => {
  try {
    const parsedInput = StoreS3ImageInput.parse(input);
    console.info("Uploading to S3 bucket:", parsedInput.bucket);
    
    const command = new PutObjectCommand({
      Bucket: parsedInput.bucket,
      Key: parsedInput.key,
      Body: parsedInput.buffer,
      ContentType: parsedInput.contentType,
      ACL: 'public-read' // Make the image publicly accessible
    });
    
    const result = await s3Client.send(command);

    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to upload image to S3");
    }   

    console.info("Image uploaded to S3 bucket");
    const imageUrl = `https://${parsedInput.bucket}.s3.amazonaws.com/${parsedInput.key}`;
    return StoreS3ImageOutput.parse(imageUrl);
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
};

/**
 * Generates a presigned URL for client-side uploads
 */
export const getPresignedUrl = async (input: GetPresignedUrlInput): Promise<GetPresignedUrlOutput> => {
  try {
    const parsedInput = GetPresignedUrlInput.parse(input);
    console.info("Creating presigned URL");

    const command = new PutObjectCommand({
      Bucket: parsedInput.bucket,
      Key: parsedInput.key,
      ContentType: parsedInput.contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: parsedInput.expiresIn });
    console.info("Presigned URL generated");
    
    return GetPresignedUrlOutput.parse({
      presignedUrl: signedUrl,
      key: parsedInput.key
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

/**
 * Retrieves metadata for an image in S3
 */
export const getImageMetadata = async (input: GetImageMetadataInput): Promise<GetImageMetadataOutput> => {
  try {
    const parsedInput = GetImageMetadataInput.parse(input);
    const headCommand = new HeadObjectCommand({
      Bucket: parsedInput.bucket,
      Key: parsedInput.key
    });

    const headResult = await s3Client.send(headCommand);
    const metadata = headResult.Metadata; 
    
    if (!metadata) {
      throw new Error('No metadata found for the object');
    }
    
    console.info("Image metadata retrieved");
    return GetImageMetadataOutput.parse(metadata);
  } catch (error) {
    console.error('Error retrieving image metadata:', error);
    throw new Error('Failed to retrieve image metadata');
  }
};

/**
 * Helper function to convert stream to buffer
 */
export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

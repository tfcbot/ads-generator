import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

export const s3Mock = mockClient(S3Client);

const inMemoryS3: Record<string, any> = {};

export const resetS3Mock = () => {
  s3Mock.reset();
  
  s3Mock.on(PutObjectCommand).callsFake((params) => {
    const key = params.Key;
    inMemoryS3[key] = params.Body;
    
    return {
      $metadata: { httpStatusCode: 200 }
    };
  });
};

export const mockUploadImageToS3 = async (imageData: string, key: string, isBase64 = false): Promise<string> => {
  inMemoryS3[key] = imageData;
  return `https://test-bucket.s3.amazonaws.com/${key}`;
};

export const mockGetCloudFrontUrl = async (key: string): Promise<string> => {
  return `https://test-cdn.example.com/${key}`;
};

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import {
    GetS3ImageInput,
    GetS3ImageOutput,
    StoreS3ImageInput,
    StoreS3ImageOutput,
  } from '@metadata/s3-schemas'

import { Resource } from 'sst';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
});

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

// Helper function to convert stream to buffer
const streamToBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
};

export const storeS3Image = async (input: StoreS3ImageInput): Promise<StoreS3ImageOutput> => {
    try {
        const parsedInput = StoreS3ImageInput.parse(input);
        console.info("Uploading to Bucket");
       
        const command = new PutObjectCommand({
            Bucket: parsedInput.bucket,
            Key: parsedInput.key,
            Body: parsedInput.buffer,
            ContentType: parsedInput.contentType,
        });
        const result = await s3Client.send(command);

        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error("Failed to upload image to S3");
        }   

        console.info("Image Uploaded to Bucket");
        return StoreS3ImageOutput.parse(parsedInput.key);
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload image to S3');
    }
};
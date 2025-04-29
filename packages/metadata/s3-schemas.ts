import { z } from 'zod';

export const GetS3ImageInput = z.object({
  key: z.string(),
  bucket: z.string(),
});

export const GetS3ImageOutput = z.instanceof(Buffer);

export const StoreS3ImageInput = z.object({
  buffer: z.instanceof(Buffer),
  key: z.string(),
  bucket: z.string(),
  contentType: z.string(),
});

export const StoreS3ImageOutput = z.string();

export const GetPresignedUrlInput = z.object({
  key: z.string(),
  bucket: z.string(),
  contentType: z.string(),
  expiresIn: z.number().default(3600),
});

export const GetPresignedUrlOutput = z.object({
  presignedUrl: z.string(),
  key: z.string(),
});

export const GetImageMetadataInput = z.object({
  key: z.string(),
  bucket: z.string(),
});

export const GetImageMetadataOutput = z.record(z.string());

export type GetS3ImageInput = z.infer<typeof GetS3ImageInput>;
export type GetS3ImageOutput = z.infer<typeof GetS3ImageOutput>;
export type StoreS3ImageInput = z.infer<typeof StoreS3ImageInput>;
export type StoreS3ImageOutput = z.infer<typeof StoreS3ImageOutput>;
export type GetPresignedUrlInput = z.infer<typeof GetPresignedUrlInput>;
export type GetPresignedUrlOutput = z.infer<typeof GetPresignedUrlOutput>;
export type GetImageMetadataInput = z.infer<typeof GetImageMetadataInput>;
export type GetImageMetadataOutput = z.infer<typeof GetImageMetadataOutput>;

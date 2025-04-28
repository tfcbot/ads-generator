import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

export enum AdsStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
} 

export const RequestAdsFormInputSchema = z.object({
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  stylePreferences: z.string(),
});

export const RequestAdsInputSchema = z.object({
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  stylePreferences: z.string(),
  id: z.string().optional().default(uuidv4()),
  userId: z.string(),
  keyId: z.string(),
});

export const PendingAdsSchema = z.object({
  adId: z.string(),
  userId: z.string(),
  title: z.string(), 
  content: z.string(),
  imageUrl: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  stylePreferences: z.string(),
  adStatus: z.nativeEnum(AdsStatus).default(AdsStatus.PENDING),
});

export const RequestAdsOutputSchema = z.object({
  adId: z.string(),
  title: z.string(), 
  content: z.string(),
  imageUrl: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  stylePreferences: z.string(),
  adStatus: z.nativeEnum(AdsStatus).default(AdsStatus.PENDING),
});

export const SaveAdsSchema = z.object({
  adId: z.string(),
  userId: z.string(),
  title: z.string(), 
  content: z.string(),
  imageUrl: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  stylePreferences: z.string(),
});

export const GetAdsInputSchema = z.object({  
  userId: z.string(),
  adId: z.string(),
});

export const GetAllUserAdsInputSchema = z.object({
  userId: z.string(),
});

export type RequestAdsOutput = z.infer<typeof RequestAdsOutputSchema>;
export type RequestAdsInput = z.infer<typeof RequestAdsInputSchema>;
export type GetAdsInput = z.infer<typeof GetAdsInputSchema>; 
export type RequestAdsFormInput = z.infer<typeof RequestAdsFormInputSchema>;
export type GetAllUserAdsInput = z.infer<typeof GetAllUserAdsInputSchema>;
export type SaveAdsInput = z.infer<typeof SaveAdsSchema>;
export type PendingAds = z.infer<typeof PendingAdsSchema>;

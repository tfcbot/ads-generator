import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

export enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
} 

export const RequestAdFormInputSchema = z.object({
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  style: z.string().optional(),
});

export const RequestAdInputSchema = z.object({
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  style: z.string().optional(),
  id: z.string().optional().default(uuidv4()),
  userId: z.string(),
  keyId: z.string(),
});

export const systemPrompt = `
You are an ad generation agent.

You are responsible for creating compelling ad images based on the provided information.

You will be given a prompt, target audience, brand information, and optional style preferences.
Use this information to create an effective ad image.
`;

export const userPrompt = (input: RequestAdInput): string => `
Generate an ad image according to the following information:

Prompt: ${input.prompt}
Target Audience: ${input.targetAudience}
Brand Information: ${input.brandInfo}
${input.style ? `Style Preferences: ${input.style}` : ''}
`;

export const PendingAdSchema = z.object({
  adId: z.string(),
  userId: z.string(),
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  style: z.string().optional(),
  imageUrl: z.string().optional(),
  adStatus: z.nativeEnum(AdStatus).default(AdStatus.PENDING),
});

export const RequestAdOutputSchema = z.object({
  adId: z.string(),
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  style: z.string().optional(),
  imageUrl: z.string(),
  adStatus: z.nativeEnum(AdStatus).default(AdStatus.COMPLETED),
});

export const SaveAdSchema = z.object({
  adId: z.string(),
  userId: z.string(),
  prompt: z.string(),
  targetAudience: z.string(),
  brandInfo: z.string(),
  style: z.string().optional(),
  imageUrl: z.string(),
});

export const GetAdInputSchema = z.object({  
  userId: z.string(),
  adId: z.string(),
});

export const GetAllUserAdsInputSchema = z.object({
  userId: z.string(),
});

export type RequestAdOutput = z.infer<typeof RequestAdOutputSchema>;
export type RequestAdInput = z.infer<typeof RequestAdInputSchema>;
export type GetAdInput = z.infer<typeof GetAdInputSchema>; 
export type RequestAdFormInput = z.infer<typeof RequestAdFormInputSchema>;
export type GetAllUserAdsInput = z.infer<typeof GetAllUserAdsInputSchema>;
export type SaveAdInput = z.infer<typeof SaveAdSchema>;
export type PendingAd = z.infer<typeof PendingAdSchema>;

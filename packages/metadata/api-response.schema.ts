import { z } from 'zod';

// Generic API response wrapper
export const ApiResponseSchema = z.object({
  message: z.string(),
  data: z.any(),
  status: z.enum(['success', 'error']).default('success'),
  timestamp: z.string().datetime().optional(),
});

// User credits response
export const UserCreditsResponseSchema = z.object({
  credits: z.number(),
});



// API Key response
export const ApiKeyResponseSchema = z.object({
  key: z.string(),
  keyId: z.string(),
});

// Checkout response
export const CheckoutResponseSchema = z.object({
  url: z.string(),
});

// Type exports for use in both frontend and backend
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data: T };
export type UserCreditsResponse = z.infer<typeof UserCreditsResponseSchema>;

export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

// Helper function to create standard API responses (for backend)
export const createApiResponse = <T>(data: T, message: string = 'Success', status: 'success' | 'error' = 'success'): ApiResponse<T> => {
  return {
    data,
    message,
    status,
    timestamp: new Date().toISOString(),
  };
};

// Helper function to parse API responses (for frontend)
export const parseApiResponse = <T>(responseData: any, schema: z.ZodType<T>): T => {
  try {
    // Try to parse as a wrapped response first
    const apiResponse = ApiResponseSchema.parse(responseData);
    return schema.parse(apiResponse.data);
  } catch (error) {
    // If that fails, try to parse the data directly
    return schema.parse(responseData);
  }
};    
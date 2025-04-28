import { z } from 'zod';

export enum TransactionType {
   CREDIT = 'CREDIT', 
   DEBIT = 'DEBIT'
}

export enum PaymentStatus {
    VALID = 'Valid',
    INVALID = 'Invalid',
    COMPLETE = 'Complete', 
    NOT_PAID = 'NotPaid'
}

export enum Messages {
    SUCCESS = 'success',
    FAILURE = 'failure'
}

export const UserSchema = z.object({
    userId: z.string(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    credits: z.number().optional(),
    apiKeyId: z.string().optional(),
});

export const CheckoutInfoSchema = z.object({
    userId: z.string(),
    priceId: z.string().optional(),
    quantity: z.number(),
    creditsPurchased: z.number().optional(),
});

export const TransactionDtoSchema = z.object({
    userId: z.string(),
    timestamp: z.string(),
    amount: z.number(),
    type: z.nativeEnum(TransactionType),
    keyId: z.string().optional(),
});

export const CheckoutSessionInputSchema = z.object({
  userId: z.string(),
  keyId: z.string(),
  quantity: z.number().default(1),
});

export const MetadataRefillSchema = z.object({
    userId: z.string(),
    keyId: z.string(),
    amount: z.string(),
  });

export const CheckoutSessionCompletedSchema = z.object({
  id: z.string(),
  metadata: MetadataRefillSchema,
});

export const UpdateUserCreditsCommandSchema = z.object({
    userId: z.string(),
    keyId: z.string(),
    operation: z.enum(['increment', 'decrement']),
    amount: z.number()
});

export const ApiKeySchema = z.object({
    keyId: z.string(),
    userId: z.string(),
    apiKey: z.string(),
    name: z.string().optional(),
    expires: z.string().optional(),
    createdTimestamp: z.string()
});

export const CreateApiKeyInputSchema = z.object({
    userId: z.string(),
    name: z.string().optional(),
    expires: z.string().optional(),
});

export const ValidateApiKeyInputSchema = z.object({
    key: z.string()
});

export const GetUserCreditsInputSchema = z.object({
    userId: z.string(),
    keyId: z.string()
});



export type User = z.infer<typeof UserSchema>;
export type CheckoutInfo = z.infer<typeof CheckoutInfoSchema>;
export type TransactionDto = z.infer<typeof TransactionDtoSchema>;
export type CheckoutSessionCompleted = z.infer<typeof CheckoutSessionCompletedSchema>;
export type CheckoutSessionInput = z.infer<typeof CheckoutSessionInputSchema>;
export type UpdateUserCreditsCommand = z.infer<typeof UpdateUserCreditsCommandSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;
export type ValidateApiKeyInput = z.infer<typeof ValidateApiKeyInputSchema>;
export type GetUserCreditsInput = z.infer<typeof GetUserCreditsInputSchema>;
export type MetadataRefill = z.infer<typeof MetadataRefillSchema>;
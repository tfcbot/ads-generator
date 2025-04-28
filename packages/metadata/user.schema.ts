import { z } from "zod";

// Enums
export enum PaymentStatus {
    PAID = 'PAID',
    NOT_PAID = 'NOT_PAID'
}

export enum OnboardingStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETE = 'COMPLETE'
}

// Schemas
export const UserDetailsSchema = z.object({
    id: z.string(),
});

export const NewUserSchema = z.object({
    userId: z.string(),
});

export const UserSchema = z.object({
    userId: z.string(),
    onboardingStatus: z.nativeEnum(OnboardingStatus),
    paymentStatus: z.nativeEnum(PaymentStatus),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    credits: z.number().default(0),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});

export const UpdateUserOnboardingDetailsInputSchema = z.object({
    userId: z.string(),
    onboardingComplete: z.boolean(),
    onboardingDetails: z.any()
});

// Types
export type UserDetails = z.infer<typeof UserDetailsSchema>;
export type NewUser = z.infer<typeof NewUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUserOnboardingDetailsInput = z.infer<typeof UpdateUserOnboardingDetailsInputSchema>;

export const BaseTaskPayloadSchema = z.object({
    taskId: z.string(),
    userId: z.string(),
  });

  
export const OnboardUserInputSchema = BaseTaskPayloadSchema.extend({
    userId: z.string(),
    onboardingComplete: z.boolean(),
    onboardingDetails: z.object({
        useCase: z.string(),
    })
})

export type OnboardUserInput = z.infer<typeof OnboardUserInputSchema>;

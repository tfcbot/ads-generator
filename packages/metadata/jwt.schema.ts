import { z } from 'zod';

export const DecodedJwtSchema = z.object({
    sub: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
})

export const UpdatePropertyCommandInputSchema = z.object({
  userId: z.string(),
  params: z.object({
    publicMetadata: z.record(z.string(), z.any()),
  }),
});

export type DecodedJwt = z.infer<typeof DecodedJwtSchema>;
export type UpdatePropertyCommandInput = z.infer<typeof UpdatePropertyCommandInputSchema>;

import { z } from 'zod';

export const ResponseBodySchema = z.object({
  message: z.string(),
  data: z.any()
});

export const MessageSchema = z.object({
  message: z.string(),
  data: z.any()
});

export type Message = z.infer<typeof MessageSchema>;
export type ResponseBody = z.infer<typeof ResponseBodySchema>;

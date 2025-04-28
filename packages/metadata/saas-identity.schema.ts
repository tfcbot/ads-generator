import { z } from 'zod';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { JwtPayload } from '@clerk/types';
import { WebhookEvent } from '@clerk/backend';

export const ValidUserSchema = z.object({
  userId: z.string(),
  keyId: z.string().optional(),
});

export const MessageSchema = z.object({
  message: z.string(),
});

export type ValidUser = z.infer<typeof ValidUserSchema>;
export type Message = z.infer<typeof MessageSchema>;

export interface ISaasIdentityVendingMachine {
  decodeJwt(token: string): Promise<JwtPayload>
  getValidUserFromAuthHeader(event: APIGatewayProxyEventV2): Promise<ValidUser | null>
  getValidUser(event: APIGatewayProxyEventV2): Promise<ValidUser>
}

import { ClerkClient, createClerkClient, WebhookEvent } from "@clerk/backend";
import { verifyToken } from "@clerk/backend";
import { Jwt, JwtPayload } from "@clerk/types";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { UpdatePropertyCommandInput } from "@metadata/jwt.schema";
import { Resource } from "sst";
import { Webhook } from 'svix';

export interface IJwtService {
  validateWebhookEvent(event: APIGatewayProxyEventV2): Promise<WebhookEvent>
  extractTokenFromHeader(event: APIGatewayProxyEventV2): Promise<string>
  decodeToken(token: string): Promise<JwtPayload>
  validateToken(token: string): Promise<JwtPayload>
  updateUserProperties(command: UpdatePropertyCommandInput): Promise<string>
}

export class ClerkService implements IJwtService {
  private clerkClientSecretKey: string;
  private clerkClientPublishableKey: string;
  private clerkClient: ClerkClient;
  private clerkWebhookSecret: string;

  constructor() {
    this.clerkClientSecretKey = Resource.ClerkClientSecretKey.value;
    this.clerkClientPublishableKey = Resource.ClerkClientPublishableKey.value;
    this.clerkWebhookSecret = Resource.ClerkClientWebhookSecret.value;

    this.clerkClient = createClerkClient({
      secretKey: this.clerkClientSecretKey,
      publishableKey: this.clerkClientPublishableKey,
    });
  }

  async validateToken(token: string): Promise<JwtPayload> {
    const decodedToken = await verifyToken(token, {
      secretKey: this.clerkClientSecretKey,
    });
    console.info("Token decoded");
    return decodedToken;
  }

  async updateUserProperties(command: UpdatePropertyCommandInput): Promise<string> {
    try {
      console.info("Updating user properties metadata with params", command.params);
      await this.clerkClient.users.updateUserMetadata(command.userId, command.params);
      return "User properties updated";
    } catch (error) {
      console.error('Error updating user properties:', error);
      throw new Error('Failed to update user properties');
    }
  }

  async validateWebhookEvent(event: APIGatewayProxyEventV2): Promise<WebhookEvent> {
    this.validateWebhookSecret();
    const { headers, payload } = this.extractEventData(event);
    this.validateSvixHeaders(headers);
    return this.verifyWebhook(payload, headers);
  }
  
  private validateWebhookSecret(): void {
    if (!this.clerkWebhookSecret) {
      throw new Error('Missing WEBHOOK_SECRET');
    }
  }
  
  private extractEventData(event: APIGatewayProxyEventV2): { headers: any, payload: string } {
    const headers = event.headers;
    const payload = event.body;
  
    if (!payload) {
      throw new Error('Missing payload');
    }
  
    return { headers, payload };
  }
  
  private validateSvixHeaders(headers: any): void {
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];
  
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing Svix headers');
    }
  }
  
  private verifyWebhook(payload: string, headers: any): WebhookEvent {
    const wh = new Webhook(this.clerkWebhookSecret);
  
    try {
      const evt = wh.verify(payload, {
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      }) as WebhookEvent;
  
      return evt;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      throw new Error('Webhook verification failed');
    }
  }

  async extractTokenFromHeader(event: APIGatewayProxyEventV2): Promise<string> {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    return token;
  }

  async decodeToken(token: string): Promise<JwtPayload> {
    return await this.validateToken(token);
  }
}

// Mock for SaaSIdentityVendingMachine for testing
import { ValidUser } from '@metadata/saas-identity.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export class MockSaaSIdentityVendingMachine {
  async getValidUser(event: APIGatewayProxyEventV2): Promise<ValidUser> {
    // Always return a valid user for testing
    return {
      userId: 'user-123',
      keyId: 'key-456'
    };
  }

  async getValidUserFromAuthHeader(event: APIGatewayProxyEventV2): Promise<ValidUser | null> {
    // Always return a valid user for testing
    return {
      userId: 'user-123',
      keyId: 'key-456'
    };
  }

  async decodeJwt(token: string): Promise<any> {
    return {
      sub: 'user-123',
      metadata: {
        keyId: 'key-456'
      }
    };
  }
} 
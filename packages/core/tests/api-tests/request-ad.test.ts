import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';
import { mockResource } from '../mocks/sst-resource.mock';
import { MockSaaSIdentityVendingMachine } from '../mocks/saas-identity.mock';
import { AdStatus } from '@metadata/agents/ads-agent.schema';

// Fix paths to correctly point to the actual modules
const requestAdAdapterPath = '../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/request-ad.adapter';
const adUsecasePath = '../../src/orchestrator/agent-runtime/ads-generator/usecase/ad.usecase';

describe('Request Ad Adapter', () => {
  // Mock console methods to suppress error output
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Silence console output during tests
    console.error = () => {};
    console.info = () => {};
    console.warn = () => {};
    
    resetDynamoMock();
    
    // Mock SST Resource
    mock.module('sst', () => {
      return {
        Resource: mockResource
      };
    });

    // Mock Clerk JWT Service
    mock.module('@utils/vendors/jwt-vendor', () => {
      return {
        ClerkService: class MockClerkService {
          validateToken() { return Promise.resolve({ sub: 'user-123' }); }
          extractTokenFromHeader() { return Promise.resolve('test-token'); }
          decodeToken() { return Promise.resolve({ sub: 'user-123' }); }
        }
      };
    });

    // Mock SaaSIdentityVendingMachine
    mock.module('@utils/tools/saas-identity', () => {
      return {
        SaaSIdentityVendingMachine: MockSaaSIdentityVendingMachine
      };
    });

    // Mock API Key Service
    mock.module('@utils/vendors/api-key-vendor', () => {
      return {
        apiKeyService: {
          updateUserCredits: () => Promise.resolve({ credits: 99 }),
          validateApiKey: () => Promise.resolve({ userId: 'user-123', keyId: 'key-456' })
        }
      };
    });
    
    mock.module(adUsecasePath, () => {
      return {
        runAdUsecase: () => Promise.resolve({
          message: 'Ad generated successfully',
          data: {
            adId: 'test-ad-id',
            adStatus: AdStatus.COMPLETED
          }
        })
      };
    });
  });

  afterEach(() => {
    // Restore console methods after tests
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
  });

  test('requestAdAdapter should process valid input and return a pending ad', async () => {
    const { requestAdAdapter } = await import(requestAdAdapterPath);
    
    const event = {
      body: JSON.stringify({
        prompt: 'Create an ad for a coffee shop',
        targetAudience: 'Coffee lovers',
        brandInfo: 'Morning Brew',
        style: 'Modern'
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      }
    } as unknown as APIGatewayProxyEventV2;
    
    const result = await requestAdAdapter(event);
    
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Ad retrieved successfully');
    expect(body.data).toHaveProperty('adId');
    expect(body.data).toHaveProperty('adStatus', AdStatus.PENDING);
  });

  test('requestAdAdapter should reject requests with missing required fields', async () => {
    const { requestAdAdapter } = await import(requestAdAdapterPath);
    
    const event = {
      body: JSON.stringify({
        prompt: 'Create an ad for a coffee shop'
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      }
    } as unknown as APIGatewayProxyEventV2;
    
    const result = await requestAdAdapter(event);
    
    expect(result.statusCode).toBe(400);
  });
});

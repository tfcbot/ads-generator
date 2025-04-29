import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';
import { mockResource } from '../mocks/sst-resource.mock';
import { MockSaaSIdentityVendingMachine } from '../mocks/saas-identity.mock';
import { AdStatus } from '@metadata/agents/ads-agent.schema';

// Fix paths to correctly point to the actual modules
const getAdByIdAdapterPath = '../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/get-ad-by-id.adapter';
const getAdUsecasePath = '../../src/orchestrator/agent-runtime/ads-generator/usecase/get-ad.usecase';

describe('Get Ad By Id Adapter', () => {
  const sampleAd = {
    adId: 'test-ad-id',
    prompt: 'Create an ad for a coffee shop',
    targetAudience: 'Coffee lovers',
    brandInfo: 'Morning Brew',
    style: 'Modern',
    imageUrl: 'https://example.com/image.jpg',
    adStatus: AdStatus.COMPLETED
  };

  // Mock console methods to suppress error output
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;

  beforeEach(() => {
    // Silence console output during tests
    console.error = () => {};
    console.info = () => {};
    
    resetDynamoMock();
    
    // Mock SST Resource
    mock.module('sst', () => {
      return {
        Resource: mockResource
      };
    });

    // Mock @utils/vendors/jwt-vendor
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
    
    mock.module(getAdUsecasePath, () => {
      return {
        getAdUsecase: () => Promise.resolve(sampleAd)
      };
    });
  });

  afterEach(() => {
    // Restore console methods after tests
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
  });

  test('getAdByIdAdapter should return the ad for a valid ID', async () => {
    const { getAdByIdAdapter } = await import(getAdByIdAdapterPath);
    
    const event = {
      pathParameters: {
        id: 'test-ad-id'
      },
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
    
    const result = await getAdByIdAdapter(event);
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Ad retrieved successfully');
    expect(body.data).toEqual(sampleAd);
  });

  test('getAdByIdAdapter should return an error for missing ID', async () => {
    const { getAdByIdAdapter } = await import(getAdByIdAdapterPath);
    
    const event = {
      pathParameters: {},
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
    
    const result = await getAdByIdAdapter(event);
    
    expect(result.statusCode).toBe(500);
  });
});

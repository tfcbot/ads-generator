import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';
import { mockResource } from '../mocks/sst-resource.mock';
import { MockSaaSIdentityVendingMachine } from '../mocks/saas-identity.mock';
import { AdStatus } from '@metadata/agents/ads-agent.schema';

// Fix paths to correctly point to the actual modules
const getAllAdsAdapterPath = '../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/get-all-ads.adapter';
const getAllAdsUsecasePath = '../../src/orchestrator/agent-runtime/ads-generator/usecase/get-all-ads.usecase';

describe('Get All Ads Adapter', () => {
  const sampleAds = [
    {
      adId: 'test-ad-id-1',
      prompt: 'Create an ad for a coffee shop',
      targetAudience: 'Coffee lovers',
      brandInfo: 'Morning Brew',
      style: 'Modern',
      imageUrl: 'https://example.com/image1.jpg',
      adStatus: AdStatus.COMPLETED
    },
    {
      adId: 'test-ad-id-2',
      prompt: 'Create an ad for a bookstore',
      targetAudience: 'Book enthusiasts',
      brandInfo: 'Book Haven',
      imageUrl: 'https://example.com/image2.jpg',
      adStatus: AdStatus.COMPLETED
    }
  ];

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
    
    mock.module(getAllAdsUsecasePath, () => {
      return {
        getUserAdsUsecase: () => Promise.resolve({
          message: 'User ads retrieved successfully',
          data: sampleAds
        })
      };
    });
  });

  afterEach(() => {
    // Restore console methods after tests
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
  });

  test('getAllUserAdsAdapter should return all ads for a user', async () => {
    const { getAllUserAdsAdapter } = await import(getAllAdsAdapterPath);
    
    const event = {
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
    
    const result = await getAllUserAdsAdapter(event);
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Update expectation to match the actual response structure
    expect(body).toHaveProperty('message', 'User ads retrieved successfully');
    expect(body).toHaveProperty('data');
    expect(body.data).toEqual(sampleAds);
  });
});

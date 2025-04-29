import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';

const getAllAdsAdapterPath = '../../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/get-all-ads.adapter';
const getAllAdsUsecasePath = '../../../src/orchestrator/agent-runtime/ads-generator/usecase/get-all-ads.usecase';

enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

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

  beforeEach(() => {
    resetDynamoMock();
    
    mock.module(getAllAdsUsecasePath, () => {
      return {
        getUserAdsUsecase: () => Promise.resolve({
          message: 'User ads retrieved successfully',
          data: sampleAds
        })
      };
    });
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
    expect(body).toEqual(sampleAds);
  });
});

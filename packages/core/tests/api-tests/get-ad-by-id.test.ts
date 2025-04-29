import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';

const getAdByIdAdapterPath = '../../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/get-ad-by-id.adapter';
const getAdUsecasePath = '../../../src/orchestrator/agent-runtime/ads-generator/usecase/get-ad.usecase';

enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

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

  beforeEach(() => {
    resetDynamoMock();
    
    mock.module(getAdUsecasePath, () => {
      return {
        getAdUsecase: () => Promise.resolve(sampleAd)
      };
    });
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
    
    expect(result.statusCode).toBe(400);
  });
});

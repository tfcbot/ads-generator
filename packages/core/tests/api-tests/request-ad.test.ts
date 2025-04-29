import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resetDynamoMock } from '../mocks/dynamodb.mock';

const requestAdAdapterPath = '../../../src/orchestrator/agent-runtime/ads-generator/adapters/primary/request-ad.adapter';
const adUsecasePath = '../../../src/orchestrator/agent-runtime/ads-generator/usecase/ad.usecase';

enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

describe('Request Ad Adapter', () => {
  beforeEach(() => {
    resetDynamoMock();
    
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
    
    mock.module('@utils/vendors/api-key-vendor', () => {
      return {
        apiKeyService: {
          updateUserCredits: () => Promise.resolve()
        }
      };
    });
    
    const result = await requestAdAdapter(event);
    
    expect(result.statusCode).toBe(202);
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

import { describe, expect, test, mock, beforeEach } from 'bun:test';
enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

interface RequestAdInput {
  id?: string;
  prompt: string;
  targetAudience: string;
  brandInfo: string;
  style?: string;
  userId: string;
  keyId: string;
}

interface SaveAdInput {
  adId: string;
  userId: string;
  prompt: string;
  targetAudience: string;
  brandInfo: string;
  style?: string;
  imageUrl?: string;
  adStatus: AdStatus;
}
import { mockGenerateAd, mockRunAdGeneration } from '../mocks/openai.mock';
import { mockUploadImageToS3, mockGetCloudFrontUrl } from '../mocks/s3.mock';

const adUsecasePath = '../../../src/orchestrator/agent-runtime/ads-generator/usecase/ad.usecase';
const openaiAdapterPath = '../../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/openai.adapter';
const s3HelpersPath = '../../../packages/utils/src/tools/s3-helpers';

describe('Ad Usecase', () => {
  const sampleInput: RequestAdInput = {
    id: 'test-ad-id',
    prompt: 'Create an ad for a coffee shop',
    targetAudience: 'Coffee lovers',
    brandInfo: 'Morning Brew',
    style: 'Modern',
    userId: 'user-123',
    keyId: 'key-456'
  };

  const mockAdRepository = {
    saveAd: () => Promise.resolve('Ad saved successfully'),
    getAdById: () => Promise.resolve(null),
    getAdsByUserId: () => Promise.resolve([])
  };

  beforeEach(() => {
    mock.module(openaiAdapterPath, () => {
      return {
        generateAd: mockGenerateAd,
        runAdGeneration: mockRunAdGeneration
      };
    });

    mock.module(s3HelpersPath, () => {
      return {
        uploadImageToS3: mockUploadImageToS3,
        getCloudFrontUrl: mockGetCloudFrontUrl
      };
    });

    mock.module('../../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/datastore.adapter', () => {
      return {
        adRepository: mockAdRepository
      };
    });

  });

  test('runAdUsecase should generate an ad, upload to S3, and save to repository', async () => {
    const { runAdUsecase } = await import(adUsecasePath);
    
    const result = await runAdUsecase(sampleInput);
    
    expect(result.message).toBe('Ad generated successfully');
    expect(result.data).toHaveProperty('adId', 'test-ad-id');
    expect(result.data).toHaveProperty('adStatus', AdStatus.COMPLETED);
    
  });
});

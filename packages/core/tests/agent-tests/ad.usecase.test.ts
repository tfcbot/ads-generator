import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { AdStatus, RequestAdInput, SaveAdInput } from '@metadata/agents/ads-agent.schema';
import { mockGenerateAd, mockRunAdGeneration } from '../mocks/openai.mock';
import { mockUploadImageToS3, mockGetCloudFrontUrl } from '../mocks/s3.mock';

// Fix paths to correctly point to the actual modules
const adUsecasePath = '../../src/orchestrator/agent-runtime/ads-generator/usecase/ad.usecase';
const openaiAdapterPath = '../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/openai.adapter';
const s3HelpersPath = '../../../packages/utils/src/tools/s3-helpers';

// Mock for SST Resource
const mockResource = {
  AdsBucket: {
    name: 'test-ads-bucket'
  },
  AdsBucketRouter: {
    url: 'https://test-cdn.example.com'
  },
  OpenAiApiKey: {
    value: 'test-api-key'
  }
};

describe('Ad Usecase', () => {
  // Mock console methods to suppress output
  const originalConsoleInfo = console.info;
  const originalConsoleError = console.error;

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
    // Silence console output during tests
    console.info = () => {};
    console.error = () => {};

    // Mock SST Resource
    mock.module('sst', () => {
      return {
        Resource: mockResource
      };
    });

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

    mock.module('../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/datastore.adapter', () => {
      return {
        adRepository: mockAdRepository
      };
    });
  });

  afterEach(() => {
    // Restore console methods after tests
    console.info = originalConsoleInfo;
    console.error = originalConsoleError;
  });

  test('runAdUsecase should generate an ad, upload to S3, and save to repository', async () => {
    const { runAdUsecase } = await import(adUsecasePath);
    
    const result = await runAdUsecase(sampleInput);
    
    expect(result.message).toBe('Ad saved successfully');
    expect(result.data).toHaveProperty('adId', 'test-ad-id');
    expect(result.data).toHaveProperty('adStatus', AdStatus.COMPLETED);
  });
});

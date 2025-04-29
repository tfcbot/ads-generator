import { describe, expect, test, mock, beforeEach } from 'bun:test';
interface RequestAdInput {
  id?: string;
  prompt: string;
  targetAudience: string;
  brandInfo: string;
  style?: string;
  userId: string;
  keyId: string;
}
import { MockOpenAI, mockGenerateAd } from '../mocks/openai.mock';

const openaiAdapterPath = '../../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/openai.adapter';

describe('OpenAI Adapter', () => {
  const sampleInput: RequestAdInput = {
    id: 'test-ad-id',
    prompt: 'Create an ad for a coffee shop',
    targetAudience: 'Coffee lovers',
    brandInfo: 'Morning Brew',
    style: 'Modern',
    userId: 'user-123',
    keyId: 'key-456'
  };

  beforeEach(() => {
    mock.module(openaiAdapterPath, () => {
      return {
        generateAd: mockGenerateAd,
        runAdGeneration: mockGenerateAd
      };
    });
  });

  test('generateAd should return a base64 encoded image', async () => {
    const { generateAd } = await import(openaiAdapterPath);
    
    const result = await generateAd(sampleInput);
    
    expect(result).toBe('MockedBase64Image');
  });

  test('generateAd should handle errors properly', async () => {
    mock.module(openaiAdapterPath, () => {
      return {
        generateAd: () => Promise.reject(new Error('OpenAI API error')),
        runAdGeneration: () => Promise.reject(new Error('OpenAI API error'))
      };
    });
    
    const { generateAd } = await import(openaiAdapterPath);
    
    await expect(generateAd(sampleInput)).rejects.toThrow('OpenAI API error');
  });
});

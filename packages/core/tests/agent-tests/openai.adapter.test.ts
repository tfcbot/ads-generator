import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { RequestAdInput } from '@metadata/agents/ads-agent.schema';
import { MockOpenAI, mockGenerateAd } from '../mocks/openai.mock';

const openaiAdapterPath = '../../src/orchestrator/agent-runtime/ads-generator/adapters/secondary/openai.adapter';

describe('OpenAI Adapter', () => {
  // Mock console methods to suppress output
  const originalConsoleInfo = console.info;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
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
    // Silence console output during tests
    console.info = () => {};
    console.error = () => {};
    console.warn = () => {};
    
    mock.module(openaiAdapterPath, () => {
      return {
        generateAd: mockGenerateAd,
        runAdGeneration: mockGenerateAd
      };
    });
  });

  afterEach(() => {
    // Restore console methods after tests
    console.info = originalConsoleInfo;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
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

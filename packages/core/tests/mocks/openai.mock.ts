import { RequestAdInput } from '../../../packages/metadata/agents/ads-agent.schema';

export class MockOpenAI {
  images = {
    generate: async (params: any) => {
      return {
        data: [
          {
            b64_json: 'MockedBase64Image' // Mock base64 image data
          }
        ]
      };
    }
  };
}

export const mockGenerateAd = async (input: RequestAdInput): Promise<string> => {
  return 'MockedBase64Image';
};

export const mockRunAdGeneration = (input: RequestAdInput): Promise<string> => {
  return Promise.resolve('MockedBase64Image');
};

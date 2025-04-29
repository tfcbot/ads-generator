import { beforeAll } from 'bun:test';
import dotenv from 'dotenv';
import path from 'path';

declare global {
  var Resource: {
    Ads: { name: string };
    AdsBucket: { name: string };
    AdsBucketRouter: { url: string };
    OpenAiApiKey: { value: string };
  };
}

beforeAll(() => {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
  
  global.Resource = {
    Ads: { name: 'ads-test-table' },
    AdsBucket: { name: 'ads-test-bucket' },
    AdsBucketRouter: { url: 'https://test-cdn.example.com' },
    OpenAiApiKey: { value: 'test-openai-api-key' }
  };
});


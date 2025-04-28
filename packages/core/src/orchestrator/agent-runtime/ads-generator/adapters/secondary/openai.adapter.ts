import OpenAI from "openai";
import { RequestAdInput, RequestAdOutput, RequestAdOutputSchema, systemPrompt, userPrompt } from "@metadata/agents/ads-generator.schema";
import { Resource } from "sst";
import { withRetry } from "@utils/tools/retry";

const client = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value
});

export const generateAd = async (input: RequestAdInput): Promise<string> => {
  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: userPrompt(input),
      n: 1,
      size: "1024x1024",
    });

    // gpt-image-1 model returns base64 encoded images instead of URLs
    const imageBase64 = response.data[0].b64_json;
    
    if (!imageBase64) {
      throw new Error('No image data returned from OpenAI');
    }
    
    // Upload the base64 image to S3
    return imageBase64;
  } catch (error) {
    console.error('Error generating ad:', error);
    throw error;
  }
};

export const runAdGeneration = withRetry(generateAd, { 
  retries: 3, 
  delay: 1000, 
  onRetry: (error: Error) => console.warn('Retrying ad generation due to error:', error) 
});

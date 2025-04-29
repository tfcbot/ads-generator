import OpenAI from "openai";
import { RequestAdInput, RequestAdOutput, RequestAdOutputSchema, systemPrompt, userPrompt } from "@metadata/agents/ads-agent.schema";
import { Resource } from "sst";
import { withRetry } from "@utils/tools/retry";

const client = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value
});

export const generateAd = async (input: RequestAdInput): Promise<string> => {
  console.info("Starting ad generation with OpenAI");
  console.info(`Generating ad for prompt with target audience: ${input.targetAudience}`);
  
  try {
    console.info("Sending request to OpenAI image generation API");
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: userPrompt(input),
      n: 1,
      size: "1024x1024",
    });
    console.info("Received response from OpenAI image generation API");

    // gpt-image-1 model returns base64 encoded images instead of URLs
    const imageBase64 = response.data[0].b64_json;
    if (!imageBase64) {
      console.error("No image data returned from OpenAI");
      throw new Error('No image data returned from OpenAI');
    }
    
    console.info("Successfully generated image for ad");
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

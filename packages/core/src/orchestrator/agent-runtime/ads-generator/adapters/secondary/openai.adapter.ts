import OpenAI from "openai";
import { RequestAdInput, RequestAdOutput, RequestAdOutputSchema, systemPrompt, userPrompt } from "@metadata/agents/ads-generator.schema";
import { Resource } from "sst";
import { withRetry } from "@utils/tools/retry";
import { uploadImageToS3 } from "@utils/tools/s3-helpers";

const client = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value
});

export const generateAd = async (input: RequestAdInput): Promise<RequestAdOutput> => {
  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: userPrompt(input),
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    const s3Url = await uploadImageToS3(imageUrl, `ads/${input.id}.png`);
    
    const adData = RequestAdOutputSchema.parse({
      adId: input.id,
      prompt: input.prompt,
      targetAudience: input.targetAudience,
      brandInfo: input.brandInfo,
      style: input.style,
      imageUrl: s3Url,
      adStatus: "completed"
    });
    
    return adData;
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

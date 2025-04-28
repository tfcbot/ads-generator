import { SaveAdSchema, RequestAdInput, AdStatus } from '@metadata/agents/ads-agent.schema';
import { Message } from '@metadata/message.schema';
import { runAdGeneration } from '../adapters/secondary/openai.adapter';
import { adRepository } from '../adapters/secondary/datastore.adapter';
import { uploadImageToS3 } from '@utils/tools/s3-helpers';

export const runAdUsecase = async (input: RequestAdInput): Promise<Message> => {
  console.info("Generating ad for User");

  try {
    console.info("Running ad generation");
    const imageData = await runAdGeneration(input); // returns base64 encoded image
    console.info("Ad generated successfully");
    
    // Upload the base64 image to S3
    const s3Url = await uploadImageToS3(imageData, `ads/${input.id}.png`, true);
    console.info("Ad uploaded to S3 successfully");

    const ad = {
      adId: input.id,
      prompt: input.prompt,
      targetAudience: input.targetAudience,
      brandInfo: input.brandInfo,
      style: input.style,
      imageUrl: s3Url,
      adStatus: AdStatus.COMPLETED
    };

    const adWithUserId = SaveAdSchema.parse({
      ...ad,
      userId: input.userId,
    });
    
    console.info("Ad completed");
    const message = await adRepository.saveAd(adWithUserId);
    console.info("Ad saved successfully");
    
    return {
      message: message,
      data: ad
    };
  } catch (error: any) {
    console.error('Error generating ad:', error);
    throw new Error(`Failed to generate ad: ${error.message || 'Unknown error'}`);
  }
};

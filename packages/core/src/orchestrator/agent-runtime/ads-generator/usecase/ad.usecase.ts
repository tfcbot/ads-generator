import { SaveAdSchema, RequestAdInput, AdStatus } from '@metadata/agents/ads-generator.schema';
import { Message } from '@metadata/message.schema';
import { runAdGeneration } from '../adapters/secondary/openai.adapter';
import { adRepository } from '../adapters/secondary/datastore.adapter';

export const runAdUsecase = async (input: RequestAdInput): Promise<Message> => {
  console.info("Generating ad for User");

  try {
    console.info("Running ad generation");
    const ad = await runAdGeneration(input);
    console.info("Ad generated successfully");
    
    const adWithUserId = SaveAdSchema.parse({
      ...ad,
      userId: input.userId,
      adStatus: AdStatus.COMPLETED
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

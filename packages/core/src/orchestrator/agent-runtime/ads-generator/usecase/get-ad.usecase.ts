import { Message } from '@metadata/message.schema';
import { GetAdInput } from '@metadata/agents/ads-generator.schema';
import { adRepository } from '../adapters/secondary/datastore.adapter';

export const getAdUsecase = async (input: GetAdInput): Promise<Message> => {
  console.info("Getting ad for id:", input.adId);

  try {
    const ad = await adRepository.getAdById(input.adId);
    
    if (!ad) {
      throw new Error('Ad not found');
    }

    return {
      message: 'Ad retrieved successfully',
      data: ad,
    };
  } catch (error: any) {
    console.error('Error retrieving ad:', error);
    throw new Error(`Failed to retrieve ad: ${error.message || 'Unknown error'}`);
  }
};

import { Message } from '@metadata/message.schema';
import { GetAllUserAdsInput } from '@metadata/agents/ads-generator.schema';
import { adRepository } from '../adapters/secondary/datastore.adapter';

export const getUserAdsUsecase = async (input: GetAllUserAdsInput): Promise<Message> => {
  console.info("Getting ad entries for user:", input.userId);

  try {
    const userAds = await adRepository.getAdsByUserId(input.userId);
    
    return {
      message: 'User ads retrieved successfully',
      data: userAds,
    };
  } catch (error: any) {
    console.error('Error retrieving user ads:', error);
    throw new Error(`Failed to retrieve user ads: ${error.message || 'Unknown error'}`);
  }
};

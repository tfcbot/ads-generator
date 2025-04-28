import { CreateApiKeyInput } from '@metadata/credits.schema';
import { apiKeyService } from '@utils/vendors/api-key-vendor';

export async function createApiKeyUseCase(params: CreateApiKeyInput) {
  try {
    const expires = params.expires ? new Date(params.expires) : undefined;
    
    const result = await apiKeyService.createApiKey({
      userId: params.userId,
      name: params.name,
      expires
    });
    
    return result;
  } catch (error) {
    console.error('Error in create API key usecase:', error);
    throw error;
  }
}

import { Unkey } from "@unkey/api";
import { Resource } from "sst";
import { 
  UpdateUserCreditsCommand, 
  UpdateUserCreditsCommandSchema 
} from '@metadata/credits.schema';

/**
 * Interface for the API key adapter
 */
export interface IApiKeyAdapter {
  unkey: Unkey;
  apiId: string;
  updateUserCredits(command: UpdateUserCreditsCommand): Promise<{ credits: number }>;
  getRemainingCredits(keyId: string): Promise<number>;
}

/**
 * API Key adapter implementation using Unkey
 */
export class ApiKeyAdapter implements IApiKeyAdapter {
  public unkey: Unkey;
  public apiId: string;

  constructor() {
    const rootKey = Resource.UnkeyRootKey.value;
    const apiId = Resource.UnkeyApiId.value;
    
    if (!rootKey) {
      throw new Error('UNKEY_ROOT_KEY environment variable is not set');
    }
    
    if (!apiId) {
      throw new Error('UNKEY_API_ID environment variable is not set');
    }
    
    this.unkey = new Unkey({ rootKey });
    this.apiId = apiId;
  }

  /**
   * Update user credits through Unkey API
   */
  async updateUserCredits(command: UpdateUserCreditsCommand): Promise<{ credits: number }> {
    console.log('Updating user credits for user:', command.userId, 'operation:', command.operation, 'amount:', command.amount);
    
    try {
      if (!command.keyId) {
        // Get the user's active API key
        const { result: userResponse } = await this.unkey.apis.listKeys({
          apiId: this.apiId,
          ownerId: command.userId,
          limit: 1
        });
        
        if (!userResponse?.keys || userResponse.keys.length === 0) {
          throw new Error('User has no API keys');
        }
        
        command.keyId = userResponse.keys[0].id;
      }
      
      // Update the remaining credits on the API key
      const { result, error } = await this.unkey.keys.updateRemaining({
        keyId: command.keyId,
        op: command.operation === 'increment' ? 'increment' : 'decrement',
        value: command.amount
      });
      
      if (error) {
        throw new Error(`Failed to update credits: ${error.message}`);
      }
      
      const newCredits = result.remaining || 0;
      
      return { credits: newCredits };
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }

  /**
   * Get the remaining credits for a key
   */
  async getRemainingCredits(keyId: string): Promise<number> {
    try {
      const { result, error } = await this.unkey.keys.get({ keyId });
      
      if (error) {
        throw new Error(`Failed to get key: ${error.message}`);
      }
      
      return result.remaining || 0;
    } catch (error) {
      console.error('Error getting remaining credits:', error);
      throw error;
    }
  }
}

export const apiKeyAdapter = new ApiKeyAdapter(); 
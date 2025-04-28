import { Unkey } from "@unkey/api";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand 
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateUserCreditsCommand } from "@metadata/credits.schema";
import { Resource } from "sst";

export interface ValidUser {
  userId: string;
  keyId?: string;
}

export interface SaveApiKeyCommand {
  keyId: string;
  userId: string;
  name?: string;
  expires?: string;
}

export class ApiKeyRepository {
  private dbClient: DynamoDBDocumentClient;

  constructor() {
    this.dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async getUserDetailsByApiKey(apiKey: string): Promise<ValidUser> {
    try {
      const params = {
        TableName: Resource.UserKeys.name,
        IndexName: "ApiKeyIndex",
        KeyConditionExpression: "apiKey = :apiKey",
        ExpressionAttributeValues: {
          ":apiKey": apiKey
        }
      };

      const result = await this.dbClient.send(new QueryCommand(params));

      if (!result.Items || result.Items.length === 0) {
        throw new Error('API key not found');
      }

      const item = result.Items[0];
      return {
        userId: item.userId,
        keyId: item.keyId,
      };
    } catch (error) {
      console.warn('Error retrieving user details via API Key', error);
      throw new Error('Failed to retrieve user details');
    }
  }

  async saveApiKey(command: SaveApiKeyCommand): Promise<void> {
    try {
      const params = {
        TableName: Resource.UserKeys.name,
        Item: {
          keyId: command.keyId,
          userId: command.userId,
          name: command.name || `API Key for ${command.userId}`,
          expires: command.expires,
          createdTimestamp: new Date().toISOString()
        }
      };
      await this.dbClient.send(new PutCommand(params));
    } catch (error) {
      console.error("Error storing API key:", error);
      throw new Error("Failed to store API key");
    }
  }
}

export class ApiKeyService {
  private unkey: Unkey;
  private apiKeyRepository: ApiKeyRepository;
  private apiId: string;

  constructor() {
    const rootKey = Resource.UnkeyRootKey.value;
    const apiId = Resource.UnkeyApiId.value;
    
    if (!apiId) {
      throw new Error('UNKEY_API_ID environment variable is not set');
    }
    if (!rootKey) {
      throw new Error('UNKEY_ROOT_KEY environment variable is not set');
    }
    
    this.unkey = new Unkey({ rootKey });
    this.apiId = apiId;
    this.apiKeyRepository = new ApiKeyRepository();
  }

  async createApiKey(params: { userId: string, name?: string, expires?: Date }) {
    console.log("Creating API key for user:", params.userId);
    const result = await this.unkey.keys.create({
      apiId: this.apiId,
      name: params.name || `API Key for ${params.userId}`,
      ownerId: params.userId,
      remaining: 100,
      meta: {
        userId: params.userId,
      },
    });

    if (!result.result) {
      throw new Error("Failed to create API key: " + result.error);
    }

    await this.apiKeyRepository.saveApiKey({
      keyId: result.result.keyId,
      userId: params.userId,
      name: params.name,
      expires: params.expires?.toISOString(),
    });

    return {
      key: result.result.key,
      keyId: result.result.keyId,
    };
  }

  async validateApiKey(key: string): Promise<ValidUser> {
    try {
      const result = await this.unkey.keys.verify({ key });

      if (!result.result || !result.result.valid) {
        throw new Error('Invalid API key');
      }

      const userId = result.result.meta?.userId as string;
      const keyId = result.result.keyId;

      if (!userId) {
        throw new Error('Invalid API key');
      }

      return {
        userId,
        keyId,
      };
    } catch (error) {
      console.error("Error validating API key:", error);
      throw new Error('Unauthorized');
    }
  }

  /**
   * Update user credits through Unkey API
   */
  async updateUserCredits(command: UpdateUserCreditsCommand): Promise<{ credits: number }> {
    console.log('Updating user credits for user:', command.userId, 'operation:', command.operation, 'amount:', command.amount);
    
    try {
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

  
}

export const apiKeyService = new ApiKeyService();

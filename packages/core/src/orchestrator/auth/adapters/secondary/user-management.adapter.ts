import { apiKeyService } from "@utils/vendors/api-key-vendor";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NewUser, User, UpdateUserOnboardingDetailsInput } from '@metadata/user.schema';
import { authManagerAdapter } from './auth-manager.adapter';
import { UpdatePropertyCommandInput } from '@metadata/jwt.schema';
import { Resource } from "sst";

export interface IUserAdapter {
  registerUser(user: NewUser): Promise<void>;
  getUserData(userId: string): Promise<User | null>;
  updateUserOnboardingDetails(input: UpdateUserOnboardingDetailsInput): Promise<void>;
  generateApiKeys(userId: string): Promise<string>;
  sendWelcomeEmail(userId: string): Promise<void>;
  deleteApiKeys(userId: string, apiKey: string): Promise<void>;
  markWelcomeEmailCancelled(userId: string): Promise<void>;
  updateUserClaims(userId: string, claimsData: Record<string, any>): Promise<void>;
  removeApiKeyFromDatabase(userId: string, apiKey: string): Promise<void>;
  saveApiKeyToDatabase(userId: string, apiKey: string): Promise<void>;
}

export class UserAdapter implements IUserAdapter {
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async registerUser(user: NewUser): Promise<void> {
    console.info("Registering user in DynamoDB:", user.userId);
    try {
      // Add timestamps
      const now = new Date().toISOString();
      const userData = {
        ...user,
        createdAt: now,
        updatedAt: now
      };
      
      const command = new PutCommand({
        TableName: Resource.Users.name,
        Item: userData,
      });
    
      await this.dynamoClient.send(command);
      console.info("User registered successfully:", user.userId);
    } catch (error) {
      console.error('Error creating user in DynamoDB:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserData(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: Resource.Users.name,
        Key: { userId }
      });

      const result = await this.dynamoClient.send(command);
      if (!result.Item) {
        return null;
      }

      return result.Item as User;
    } catch (error) {
      console.error('Error fetching user data from DynamoDB:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async updateUserOnboardingDetails(input: UpdateUserOnboardingDetailsInput): Promise<void> {
    try {
      // Remove userId from the fields to update
      const { userId, ...updateFields } = input;

      // Dynamically build update expression and attribute values
      const updateExpressionParts: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      // Always update the updatedAt timestamp
      updateExpressionParts.push('#updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      expressionAttributeNames['#updatedAt'] = 'updatedAt';

      // Handle onboardingComplete by mapping to onboardingStatus
      if (updateFields.onboardingComplete !== undefined) {
        updateExpressionParts.push('#onboardingStatus = :onboardingStatus');
        expressionAttributeValues[':onboardingStatus'] = updateFields.onboardingComplete ? 
          'COMPLETE' : 'IN_PROGRESS';
        expressionAttributeNames['#onboardingStatus'] = 'onboardingStatus';
      }

      // Handle any additional fields in onboardingDetails
      if (updateFields.onboardingDetails) {
        Object.entries(updateFields.onboardingDetails).forEach(([key, value]) => {
          const attributeName = `#${key}`;
          const attributeValue = `:${key}`;
          updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
          expressionAttributeValues[attributeValue] = value;
          expressionAttributeNames[attributeName] = key;
        });
      }

      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      });

      await this.dynamoClient.send(command);
      console.info("User onboarding details updated successfully:", userId);
    } catch (error) {
      console.error('Error updating user onboarding details in DynamoDB:', error);
      throw new Error('Failed to update user onboarding details');
    }
  }

  async generateApiKeys(userId: string): Promise<string> {
    console.info("Generating API keys for user:", userId);
    try {
      // Use the Unkey service to generate a secure API key
      const result = await apiKeyService.createApiKey({
        userId,
        name: `API Key for ${userId}`,
      });
      
      console.info("API key generated successfully for user:", userId);
      
      return result.keyId;
    } catch (error) {
      console.error("Error generating API key:", error);
      throw new Error("Failed to generate API key");
    }
  }

  async deleteApiKeys(userId: string, apiKey: string): Promise<void> {
    console.info("Deleting API keys for user:", userId);
    try {
      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: "REMOVE apiKey SET updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":currentApiKey": apiKey,
          ":updatedAt": new Date().toISOString()
        },
        ConditionExpression: "apiKey = :currentApiKey"
      });
      
      await this.dynamoClient.send(command);
      console.info("API key deleted successfully for user:", userId);
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  async sendWelcomeEmail(userId: string): Promise<void> {
    console.info("Sending welcome email to user:", userId);
    try {
      // Get user data to retrieve email
      const userData = await this.getUserData(userId);
      
      if (!userData) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // In a real system, integrate with an email service provider
      // For demonstration, we'll just update a field to indicate the email was sent
      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: "SET welcomeEmailSent = :sent, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":sent": true,
          ":updatedAt": new Date().toISOString()
        }
      });
      
      await this.dynamoClient.send(command);
      console.info("Welcome email marked as sent for user:", userId);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async saveApiKeyToDatabase(userId: string, apiKey: string): Promise<void> {
    console.info("Saving API key to database for user:", userId);
    try {
      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: "SET keyId = :keyId, apiKeystatus = :apiKeystatus, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":keyId": apiKey,
          ":apiKeystatus": "ACTIVE",
          ":updatedAt": new Date().toISOString()
        }
      });
      
      await this.dynamoClient.send(command);
      console.info("API key saved successfully to database for user:", userId);
    } catch (error) {
      console.error('Error saving API key to database:', error);
      throw new Error('Failed to save API key to database');
    }
  }

  async markWelcomeEmailCancelled(userId: string): Promise<void> {
    console.info("Marking welcome email as cancelled for user:", userId);
    try {
      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: "SET welcomeEmailStatus = :welcomeEmailStatus, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":welcomeEmailStatus": "CANCELLED",
          ":updatedAt": new Date().toISOString()
        }
      });
      
      await this.dynamoClient.send(command);
      console.info("Welcome email marked as cancelled for user:", userId);
    } catch (error) {
      console.error('Error marking welcome email as cancelled:', error);
      throw new Error('Failed to mark welcome email as cancelled');
    }
  }

  async updateUserClaims(userId: string, claimsData: Record<string, any>): Promise<void> {
    console.info("Updating user claims in Clerk for user:", userId);
    try {
      const command: UpdatePropertyCommandInput = {
        userId,
        params: {
          publicMetadata: claimsData
        }
      };
      
      await authManagerAdapter.updateUserProperties(command);
      console.info("User claims updated successfully for user:", userId);
    } catch (error) {
      console.error('Error updating user claims:', error);
      throw new Error('Failed to update user claims');
    }
  }

  async removeApiKeyFromDatabase(userId: string, apiKey: string): Promise<void> {
    console.info("Removing API key from database for user:", userId);
    try {
      const command = new UpdateCommand({
        TableName: Resource.Users.name,
        Key: { userId },
        UpdateExpression: "REMOVE keyId, status SET updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":keyId": apiKey,
          ":updatedAt": new Date().toISOString()
        },
        ConditionExpression: "keyId = :keyId"
      });
      
      await this.dynamoClient.send(command);
      console.info("API key removed successfully from database for user:", userId);
    } catch (error) {
      console.error('Error removing API key from database:', error);
      throw new Error('Failed to remove API key from database');
    }
  }
}

// Export singleton instance
export const userAdapter: IUserAdapter = new UserAdapter(); 
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SaveAdInput, RequestAdOutput, RequestAdOutputSchema } from '@metadata/agents/ads-agent.schema';
import { Resource } from 'sst';

export interface AdRepository {
  saveAd(ad: SaveAdInput): Promise<string>;
  getAdById(adId: string): Promise<RequestAdOutput | null>;
  getAdsByUserId(userId: string): Promise<RequestAdOutput[]>;
}

const tableName = Resource.Ads.name;

export const createAdRepository = (
  dynamoDbClient: DynamoDBDocumentClient
): AdRepository => {
  console.info("Saving ad to table", tableName);
  return {
    async saveAd(ad: SaveAdInput): Promise<string> {
      await dynamoDbClient.send(
        new PutCommand({
          TableName: tableName,
          Item: ad
        })
      );

      return "Ad saved successfully";
    },

    async getAdById(adId: string): Promise<RequestAdOutput | null> {
      const response = await dynamoDbClient.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            adId,
          },
        })
      );

      if (!response.Item) {
        return null;
      }

      return RequestAdOutputSchema.parse(response.Item);
    },

    async getAdsByUserId(userId: string): Promise<RequestAdOutput[]> {
      const response = await dynamoDbClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        })
      );

      if (!response.Items || response.Items.length === 0) {
        return [];
      }

      return response.Items.map((item) => RequestAdOutputSchema.parse(item));
    }
  };
};

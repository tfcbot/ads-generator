import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { SaveAdInput, RequestAdOutput } from '../../../packages/metadata/agents/ads-agent.schema';

export const dynamoDBMock = mockClient(DynamoDBDocumentClient);

const inMemoryDb: Record<string, any> = {
  ads: {},
  userAdsIndex: {}
};

export const resetDynamoMock = () => {
  dynamoDBMock.reset();
  inMemoryDb.ads = {};
  inMemoryDb.userAdsIndex = {};

  dynamoDBMock.on(PutCommand).callsFake((params) => {
    const item = params.Item;
    const adId = item.adId;
    const userId = item.userId;

    inMemoryDb.ads[adId] = { ...item };
    
    if (!inMemoryDb.userAdsIndex[userId]) {
      inMemoryDb.userAdsIndex[userId] = [];
    }
    
    if (!inMemoryDb.userAdsIndex[userId].includes(adId)) {
      inMemoryDb.userAdsIndex[userId].push(adId);
    }
    
    return { $metadata: { httpStatusCode: 200 } };
  });

  dynamoDBMock.on(GetCommand).callsFake((params) => {
    const adId = params.Key.adId;
    const item = inMemoryDb.ads[adId] || null;
    
    return {
      $metadata: { httpStatusCode: 200 },
      Item: item
    };
  });

  dynamoDBMock.on(QueryCommand).callsFake((params) => {
    const expressionValues = params.ExpressionAttributeValues;
    const userId = expressionValues[':userId'];
    const adIds = inMemoryDb.userAdsIndex[userId] || [];
    const items = adIds.map((adId: string) => inMemoryDb.ads[adId]);
    
    return {
      $metadata: { httpStatusCode: 200 },
      Items: items
    };
  });
};

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { createAdRepository } from './ad.repository';

const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const adRepository = createAdRepository(dynamoDbClient);

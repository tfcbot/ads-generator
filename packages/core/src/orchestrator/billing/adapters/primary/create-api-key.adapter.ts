import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createApiKeyUseCase } from '../../usecases/create-api-key.usecase';
import { CreateApiKeyInput, CreateApiKeyInputSchema } from '@metadata/credits.schema';
import { SaaSIdentityVendingMachine } from '@utils/tools/saas-identity';

export const createApiKeyAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const body = JSON.parse(event.body);
    const svm = new SaaSIdentityVendingMachine();
    const validUser = await svm.getValidUser(event);
    
    const params: CreateApiKeyInput = CreateApiKeyInputSchema.parse({
      ...body,
      userId: validUser.userId
    });
    
    const result = await createApiKeyUseCase(params);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return {
      statusCode: error instanceof Error ? (error.message === 'Unauthorized' ? 401 : 400) : 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }),
    };
  }
};

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getUserCreditsUseCase } from '../../usecases/credit-management.usecase';
import { GetUserCreditsInput, GetUserCreditsInputSchema } from '@metadata/credits.schema';
import { SaaSIdentityVendingMachine } from '@utils/tools/saas-identity';
import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { createApiResponse, UserCreditsResponseSchema } from '@metadata/api-response.schema';

export const getUserCreditsAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const svm = new SaaSIdentityVendingMachine();
    const validUser = await svm.getValidUser(event);
    
    const params: GetUserCreditsInput = GetUserCreditsInputSchema.parse({
      userId: validUser.userId,
      keyId: validUser.keyId
    });
    
    const result = await getUserCreditsUseCase(params);
    
    // Validate the response with our schema
    const creditsResponse = UserCreditsResponseSchema.parse(result);
    
    // Create standardized API response
    const apiResponse = createApiResponse(
      creditsResponse,
      'User credits retrieved successfully'
    );

    return OrchestratorHttpResponses.OK({
      body: apiResponse
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    return OrchestratorHttpResponses.INTERNAL_SERVER_ERROR({
      body: createApiResponse(
        null, 
        error instanceof Error ? error.message : 'Error getting user credits',
        'error'
      )
    });
  }
};

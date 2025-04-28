/**
 * Get User Research Adapter
 * 
 * This module provides a Lambda adapter for retrieving research items for the authenticated user.
 * It uses the lambda adapter factory to create a standardized Lambda handler
 * with authentication, validation, and error handling.
 */

import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { 
  createLambdaAdapter, 
  EventParser,
  LambdaAdapterOptions 
} from '@lib/lambda-adapter.factory';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { getUserResearchUsecase } from '@agent-runtime/researcher/usecase/get-all-research.usecase';
import { z } from 'zod';
import { GetAllUserResearchInput, GetAllUserResearchInputSchema } from '@metadata/agents/research-agent.schema';


/**
 * Parser function that transforms the API Gateway event into the format
 * expected by the get user research use case
 */
const getAllResearchEventParser: EventParser<GetAllUserResearchInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  return {
    userId: validUser.userId
  };
};

/**
 * Configuration options for the get all user research adapter
 */
const getAllUserResearchAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: false // GET requests don't have a body
};

/**
 * Lambda adapter for handling get user research requests
 * 
 * This adapter:
 * 1. Validates authentication
 * 2. Executes the get user research use case with the authenticated user's ID
 * 3. Formats and returns the response with the user's research items
 */
export const getAllUserResearchAdapter = createLambdaAdapter({
  schema: GetAllUserResearchInputSchema,
  useCase: getUserResearchUsecase,
  eventParser: getAllResearchEventParser,
  options: getAllUserResearchAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.OK({ body: result })
}); 
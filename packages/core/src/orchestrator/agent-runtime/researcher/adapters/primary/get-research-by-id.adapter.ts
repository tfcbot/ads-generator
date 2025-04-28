/**
 * Research By ID Request Adapter
 * 
 * This module provides a Lambda adapter for retrieving a specific research item by ID.
 * It uses the lambda adapter factory to create a standardized Lambda handler
 * with authentication, validation, and error handling.
 */

import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { 
  createLambdaAdapter, 
  EventParser,
  LambdaAdapterOptions 
} from '@lib/lambda-adapter.factory';
import { GetResearchInput, GetResearchInputSchema } from '@metadata/agents/research-agent.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { getResearchUsecase } from '@agent-runtime/researcher/usecase/get-research.usecase';

/**
 * Parser function that transforms the API Gateway event into the format
 * expected by the research use case
 */
const getResearchByIdEventParser: EventParser<GetResearchInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  if (!event.pathParameters?.id) {
    throw new Error('Research ID is required');
  }

  return {
    userId: validUser.userId,
    researchId: event.pathParameters.id
  };
};

/**
 * Configuration options for the research adapter
 */
const researchByIdAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: false // GET requests don't have a body
};

/**
 * Lambda adapter for handling research by ID requests
 * 
 * This adapter:
 * 1. Extracts the research ID from the path parameters
 * 2. Validates the input using the schema
 * 3. Executes the research use case to fetch a specific research item
 * 4. Formats and returns the response
 */
export const getResearchByIdAdapter = createLambdaAdapter({
  schema: GetResearchInputSchema,
  useCase: getResearchUsecase,
  eventParser: getResearchByIdEventParser,
  options: researchByIdAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.OK({ body: result })
}); 
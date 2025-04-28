/**
 * Research Generation Request Adapter
 * 
 * This module provides a Lambda adapter for handling research generation requests.
 * It uses the lambda adapter factory to create a standardized Lambda handler
 * with authentication, validation, and error handling.
 */
import { randomUUID } from 'crypto';
import { 
    createLambdaAdapter, 
    EventParser,
    LambdaAdapterOptions,
    GetUserInfo
  } from '@lib/lambda-adapter.factory';
import { RequestResearchInputSchema, RequestResearchInput, ResearchStatus, PendingResearchSchema } from "@metadata/agents/research-agent.schema";
import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { apiKeyService } from '@utils/vendors/api-key-vendor';
import { UpdateUserCreditsCommand } from '@metadata/credits.schema';
import { runResearchUsecase } from '../../usecase/research.usecase';
import { researchRepository } from '@agent-runtime/researcher/adapters/secondary/datastore.adapter';

/**
 * Parser function that transforms the API Gateway event into the format
 * expected by the research generation use case.
 * The validUser parameter contains the user information returned by getUserInfo.
 */
const researchEventParser: EventParser<RequestResearchInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  // Parse the request body
  if (!event.body) {
    throw new Error("Missing request body");
  }
  const parsedBody = JSON.parse(event.body);
  

  const parsedBodyWithIds = RequestResearchInputSchema.parse({
    ...parsedBody,
    ...validUser,

  });

  
  // Combine user information with parsed body
  return parsedBodyWithIds;   
};

/**
 * Configuration options for the research generation adapter
 */
const researchAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: true,
  requiredFields: ['prompt']
};

/**
 * Decrement user credits
 */
const decrementUserCredits = async (input: UpdateUserCreditsCommand) => {
  await apiKeyService.updateUserCredits({
    userId: input.userId,
    keyId: input.keyId,
    operation: 'decrement',
    amount: 1
  });
};

/**
 * Creates an initial pending research entry in the database
 */
const createPendingResearch = async (input: RequestResearchInput) => {
  await decrementUserCredits({
      userId: input.userId,
      keyId: input.keyId,
      operation: 'decrement',
      amount: 1
  });

  const initialResearch = PendingResearchSchema.parse({
    researchId: input.id,
    userId: input.userId,
    title: `Research for: ${input.prompt.substring(0, 50)}...`,
    content: '',
    citation_links: [],
    researchStatus: ResearchStatus.PENDING,
  });

  await researchRepository.saveResearch(initialResearch);
  return initialResearch;
};

/**
 * Use case for directly executing research request.
 * This replaces the previous message publishing approach with direct execution.
 * The function creates a pending entry, returns it immediately, and then
 * asynchronously processes the research request.
 */
const executeResearchUsecase = async (input: RequestResearchInput) => {
  // Create a pending research entry
  const pendingResearch = await createPendingResearch(input);
  
  // Start the research process asynchronously
  // We don't await this so we can return the pending state immediately
  runResearchUsecase(input).catch(error => {
    console.error('Error executing research:', error);
    // In a production system, you might want to update the research status to ERROR
    // and provide error details in the database
  });

  // Return the pending research entry immediately
  return pendingResearch;
}

/**
 * Lambda adapter for handling research generation requests
 * 
 * This adapter:
 * 1. Validates the request body
 * 2. Parses and validates the input using researchEventParser
 * 3. Creates a pending research entry and returns it immediately with a 202 status
 * 4. Asynchronously executes the research process
 */
export const requestResearchAdapter = createLambdaAdapter({
  schema: RequestResearchInputSchema,
  useCase: executeResearchUsecase,
  eventParser: researchEventParser,
  options: researchAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.ACCEPTED({ body: result })
});

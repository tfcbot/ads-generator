/**
 * Lambda Adapter Factory
 * 
 * This module provides a factory function for creating AWS Lambda adapters with standardized
 * error handling, authentication, request validation, and response formatting.
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { createError, handleError } from '@utils/tools/custom-error';
import { SaaSIdentityVendingMachine } from '@utils/tools/saas-identity';
import { HttpStatusCode } from '@utils/tools/http-status';
import { ZodSchema, z } from 'zod';

/**
 * Configuration options for the Lambda adapter.
 */
export interface LambdaAdapterOptions {
  /** Whether authentication is required for this endpoint. Default: true */
  requireAuth?: boolean;
  
  /** Whether a request body is required. Default: true */
  requireBody?: boolean;
  
  /** List of fields that must be present in the request body. Default: [] */
  requiredFields?: string[];
}

/**
 * Function for parsing the API Gateway event into the input format expected by the use case.
 * This can handle any part of the event including path parameters, query parameters, 
 * headers, and the request body.
 */
export type EventParser<TInput> = (
  /** The original API Gateway event */
  event: APIGatewayProxyEventV2,
  
  /** The authenticated user information */
  validUser: ValidUser
) => TInput;

/**
 * Function to format the use case result into an HTTP response
 */
export type ResponseFormatter<TOutput> = (
  /** The result from the use case */
  result: TOutput
) => APIGatewayProxyResultV2;

/**
 * Use case function that processes the input and returns a result
 */
export type UseCase<TInput, TOutput> = (
  /** The validated input */
  input: TInput
) => Promise<TOutput>;

/**
 * Lambda handler function created by the factory
 */
export type LambdaHandler = (
  /** The Lambda event */
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyResultV2>;

/**
 * Function to get user information from the event
 */
export type GetUserInfo = (
  /** The Lambda event */
  event: APIGatewayProxyEventV2
) => Promise<ValidUser>;

/**
 * Default options for the lambda adapter
 */
const defaultOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: true,
  requiredFields: []
};

/**
 * Default function to get user information using SaaSIdentityVendingMachine
 */
const defaultGetUserInfo: GetUserInfo = async (event) => {
  const svm = new SaaSIdentityVendingMachine();
  return await svm.getValidUser(event);
};

/**
 * Parameters for creating a lambda adapter
 */
export interface LambdaAdapterParams<TSchema extends ZodSchema, TInput = z.infer<TSchema>, TOutput = any> {
  /** Zod schema for validating the input */
  schema: TSchema;
  
  /** The use case function to execute */
  useCase: UseCase<TInput, TOutput>;
  
  /** Function to parse the event into the input format */
  eventParser: EventParser<TInput>;
  
  /** Configuration options for the adapter */
  options?: LambdaAdapterOptions;
  
  /** Function to format the use case result into an HTTP response */
  responseFormatter: ResponseFormatter<TOutput>;
  
  /** Custom function to get user information. If not provided, the default SaaSIdentityVendingMachine is used */
  getUserInfo?: GetUserInfo;
}

/**
 * Creates a Lambda adapter function that handles common concerns like authentication,
 * input validation, and error handling.
 * 
 * Example:
 * ```typescript
 * export const requestValueStrategyAdapter = createLambdaAdapter({
 *   schema: RequestValueStrategyInputSchema,
 *   useCase: publishValueStrategyUseCase,
 *   eventParser: valueStrategyEventParser,
 *   options: {
 *     requireAuth: true,
 *     requireBody: true,
 *     requiredFields: ['applicationIdea', 'idealCustomer', 'problem', 'solution']
 *   },
 *   responseFormatter: (result) => OrchestratorHttpResponses.ValueStrategyRequestReceived({ body: result }),
 *   getUserInfo: async (event) => {
 *     // Custom user authentication logic
 *     const user = await customAuthService.authenticate(event);
 *     return { userId: user.id, keyId: user.apiKey };
 *   }
 * });
 * ```
 */
export const createLambdaAdapter = <
  TSchema extends ZodSchema,
  TInput = z.infer<TSchema>,
  TOutput = any
>(
  params: LambdaAdapterParams<TSchema, TInput, TOutput>
): LambdaHandler => {
  const {
    schema,
    useCase,
    eventParser,
    options = defaultOptions,
    responseFormatter,
    getUserInfo = defaultGetUserInfo
  } = params;

  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
      // Authentication handling
      let validUser: ValidUser = { userId: '' };
      
      if (options.requireAuth !== false) {
        validUser = await getUserInfo(event);

        if (!validUser.userId) {
          throw createError(HttpStatusCode.BAD_REQUEST, "Missing user id");
        }
      }

      // Body validation if required
      if (options.requireBody !== false) {
        if (!event.body) {
          throw createError(HttpStatusCode.BAD_REQUEST, "Missing request body");
        }
        
        const parsedBody = JSON.parse(event.body);
        
        // Check required fields
        if (options.requiredFields && options.requiredFields.length > 0) {
          for (const field of options.requiredFields) {
            if (parsedBody[field] === undefined) {
              throw createError(HttpStatusCode.BAD_REQUEST, `Missing required field: ${field}`);
            }
          }
        }
      }

      // Parse and validate input
      const input = eventParser(event, validUser);
      const parsedInput = schema.parse(input) as TInput;

      // Execute use case
      const result = await useCase(parsedInput);

      // Format and return response
      return responseFormatter(result);
    } catch (error) {
      return handleError(error);
    }
  };
};

// For backward compatibility
export type EventBodyParser<TInput> = EventParser<TInput>;

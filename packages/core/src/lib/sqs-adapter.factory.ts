/**
 * SQS Adapter Factory
 * 
 * This module provides a factory function for creating AWS SQS adapters with standardized
 * message parsing, validation, error handling, and logging.
 * It uses Zod for both parsing and validation of SQS records.
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ZodSchema, z } from 'zod';
import { handleError } from '@utils/tools/custom-error';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Resource } from 'sst';

/**
 * Configuration options for the SQS adapter.
 */
export interface SqsAdapterOptions {
  /** Whether to process records in parallel (Promise.all) or sequentially. Default: true */
  processInParallel?: boolean;
  
  /** Whether to continue processing other records if one fails. Default: true */
  continueOnError?: boolean;
  
  /** Custom logger prefix for this adapter. Default: 'SQS-ADAPTER' */
  loggerPrefix?: string;
  
  /** Whether to include detailed logging. Default: false */
  verboseLogging?: boolean;
}

// Initialize SQS client
const sqsClient = new SQSClient({});

// Helper function to get Queue URL from ARN
function getQueueUrlFromArn(arnString: string): string {
  try {
    // ARN format: arn:aws:sqs:region:account-id:queue-name
    const parts = arnString.split(':');
    if (parts.length < 6) {
      throw new Error('Invalid ARN format');
    }
    const region = parts[3];
    const accountId = parts[4];
    const queueName = parts[5];
    
    return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
  } catch (error) {
    console.error('Error parsing Queue ARN:', error);
    throw error;
  }
}

/**
 * Function for extracting the raw message from an SQS record.
 * This handles the initial JSON parsing but leaves schema validation to Zod.
 */
export type MessageExtractor = (
  /** The SQS record to extract from */
  record: SQSRecord
) => unknown;

/**
 * Default message extractor that handles both direct payloads and SNS-wrapped messages.
 * Supports messages from topic-publisher and traditional payload format.
 */
export const defaultMessageExtractor: MessageExtractor = (record: SQSRecord): unknown => {
  // Parse the message body
  const parsedBody = JSON.parse(record.body);
  
  // Extract the message data - handle both direct payloads and SNS-wrapped messages
  if (parsedBody.Message) {
    // Handle SNS-wrapped message
    try {
      const parsedMessage = JSON.parse(parsedBody.Message);
      console.log('parsedMessage', parsedMessage);
      // Return the message as is - it's already the payload from topic-publisher
      return parsedMessage;
    } catch (parseError) {
      throw new Error('Invalid SNS message format: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
    }
  } else {
    // Handle direct payload
    if (!parsedBody || typeof parsedBody !== 'object') {
      throw new Error('Invalid message format in SQS message');
    }
    
    return parsedBody.payload;
  }
};

/**
 * Use case function that processes the input and returns a result
 */
export type UseCase<TInput, TOutput> = (
  /** The validated input */
  input: TInput
) => Promise<TOutput>;

/**
 * SQS handler function created by the factory
 */
export type SqsHandler = (
  /** The SQS event */
  event: SQSEvent
) => Promise<any>;

/**
 * Default options for the SQS adapter
 */
const defaultOptions: SqsAdapterOptions = {
  processInParallel: true,
  continueOnError: true,
  loggerPrefix: 'SQS-ADAPTER',
  verboseLogging: false
};

/**
 * Parameters for creating an SQS adapter
 */
export interface SqsAdapterParams<TSchema extends ZodSchema, TInput = z.infer<TSchema>, TOutput = any> {
  /** Zod schema for parsing and validating the input */
  schema: TSchema;
  
  /** The use case function to execute */
  useCase: UseCase<TInput, TOutput>;
  
  /** Function to extract the raw message from an SQS record */
  messageExtractor?: MessageExtractor;
  
  /** Configuration options for the adapter */
  options?: SqsAdapterOptions;
  
  /** Descriptive name for this adapter (used in logging) */
  adapterName: string;
}

/**
 * Creates an SQS adapter function that handles common concerns like message parsing,
 * input validation, and error handling.
 * 
 * Example:
 * ```typescript
 * export const blogToVideoActionAdapter = createSqsAdapter({
 *   schema: RequestBlogToVideoInputSchema,
 *   useCase: blogToVideoUseCase,
 *   adapterName: 'BLOG-TO-VIDEO',
 *   options: {
 *     verboseLogging: true
 *   }
 * });
 * ```
 */
export const createSqsAdapter = <
  TSchema extends ZodSchema,
  TInput = z.infer<TSchema>,
  TOutput = any
>(
  params: SqsAdapterParams<TSchema, TInput, TOutput>
): SqsHandler => {
  const {
    schema,
    useCase,
    messageExtractor = defaultMessageExtractor,
    options = defaultOptions,
    adapterName
  } = params;

  const mergedOptions = { ...defaultOptions, ...options };
  const logPrefix = `[${mergedOptions.loggerPrefix}-${adapterName}]`;

  return async (event: SQSEvent): Promise<any> => {
    console.info(`${logPrefix} Received SQS event:`, { 
      recordCount: event.Records?.length || 0
    });
    
    try {
      if (!event.Records || event.Records.length === 0) {
        console.warn(`${logPrefix} No records found in SQS event`);
        throw new Error("Missing SQS Records");
      }
      
      const processRecord = async (record: SQSRecord) => {
        if (mergedOptions.verboseLogging) {
          console.log(`${logPrefix} Processing record:`, { 
            messageId: record.messageId,
            bodySize: record.body?.length || 0 
          });
        }
        
        try {
          // Extract the raw message from the record
          const rawMessage = messageExtractor(record);
         
          if (mergedOptions.verboseLogging) {
            console.log(`${logPrefix} Extracted message:`, {
              messageType: typeof rawMessage
            });
          }
          
          // Use Zod schema to parse and validate the message in one step
          const validatedInput = schema.parse(rawMessage) as TInput;
          
          console.info(`${logPrefix} Processing request`);
       
          
          // Execute the use case with the parsed and validated input
          const result = await useCase(validatedInput);
          
          if (mergedOptions.verboseLogging) {
            console.log(`${logPrefix} Successfully processed request`);
          }

          if (!record.eventSourceARN) {
            throw new Error('Missing eventSourceARN in SQS record');
          }

          // Delete the message after successful processing using proper Queue URL format
          const queueUrl = getQueueUrlFromArn(record.eventSourceARN);
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: record.receiptHandle
          }));
          
          if (mergedOptions.verboseLogging) {
            console.log(`${logPrefix} Successfully deleted message from queue:`);
          }
          
          return result;
        } catch (recordError: unknown) {
          const errorMessage = recordError instanceof Error ? recordError.message : 'Unknown error';
          const errorStack = recordError instanceof Error ? recordError.stack : undefined;
          
          console.error(`${logPrefix} Error processing record:`, { 
            messageId: record.messageId,
            error: errorMessage,
            stack: errorStack, 
          });
          
          if (mergedOptions.continueOnError) {
            return { error: errorMessage };
          } else {
            throw recordError;
          }
        }
      };
      
      // Process records in parallel or sequentially
      if (mergedOptions.processInParallel) {
        return await Promise.all(event.Records.map(processRecord));
      } else {
        const results = [];
        for (const record of event.Records) {
          results.push(await processRecord(record));
        }
        return results;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error(`${logPrefix} Fatal error in adapter:`, {
        error: errorMessage,
        stack: errorStack
      });
      
      return handleError(error);
    }
  };
}; 
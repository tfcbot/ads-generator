import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { FunctionTool, ResponseInput } from 'openai/resources/responses/responses';

/**
 * Options for creating a tool definition
 */
export interface CreateToolOptions {
  /**
   * The name of the function to be called
   */
  name: string;
  
  /**
   * A description of what the function does
   */
  description: string;
  
  /**
   * A Zod schema defining the parameters for the function
   */
  parameters: z.AnyZodObject;
  
  /**
   * Whether to allow additional properties in the parameters
   */
  additionalProperties?: boolean;

  /**
   * Whether to enforce strict validation
   */
  strict?: boolean;
}

/**
 * Recursively processes a JSON schema to extract properties and required fields
 * @param schema The JSON schema to process
 * @returns The processed schema with properties and required fields
 */
function processSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Handle different schema types
  if (schema.type === 'object') {
    const properties = schema.properties || {};
    const requiredProps = Object.keys(properties);
    
    return {
      type: "object",
      properties,
      required: requiredProps.length > 0 ? requiredProps : undefined
    };
  }
  
  return schema;
}

/**
 * Creates a tool definition for the OpenAI API based on a function
 * @param options Options for creating the tool
 * @returns A tool definition compatible with OpenAI API
 */
export function createTool(options: CreateToolOptions) {
  const { name, description, parameters, additionalProperties = false, strict = true } = options;
  
  // Convert the Zod schema to JSON schema
  const jsonSchema = zodToJsonSchema(parameters) as any;
  
  // Process the schema to extract properties and required fields
  const processedSchema = processSchema(jsonSchema);
  
  // Extract required fields from the Zod schema directly
  const requiredFields = Object.keys(parameters.shape).filter(key => {
    const property = parameters.shape[key];
    return !property.isOptional?.();
  });
  
  return {
    type: "function" as const,
    name,
    description, 
    parameters: {
      type: "object",
      properties: processedSchema.properties || {},
      required: requiredFields.length > 0 ? requiredFields : undefined,
      additionalProperties
    },
    strict
  };
}

/**
 * Creates multiple tool definitions for the OpenAI API
 * @param toolOptions Array of options for creating tools
 * @returns An array of tool definitions compatible with OpenAI API
 */
export function createTools(toolOptions: CreateToolOptions[]) {
  return toolOptions.map(createTool);
}

/**
 * Unified type definition for a tool call from either API
 */
export interface ToolCall {
  type: "function_call"
  id: string;
  call_id: string;
  name: string;
  arguments: string;
}

/**
 * Type definition for a tool response to be sent back to OpenAI
 */
export interface ToolResponse {
  type: "function_call_output";
  call_id: string;
  output: string;
}

/**
 * Parses the arguments from a tool call
 * @param toolCall The tool call object
 * @returns The parsed arguments as an object
 */
export function parseToolCallArguments<T = any>(toolCall: ToolCall): T {
  try {
    return JSON.parse(toolCall.arguments);
  } catch (error) {
    console.error('Error parsing tool call arguments:', error);
    throw new Error(`Failed to parse arguments for tool call ${toolCall.id}`);
  }
}


/**
 * Executes a tool call using the provided tool implementations
 * @param toolCall The tool call to execute
 * @param toolImplementations An object mapping tool names to their implementations
 * @returns A promise that resolves to a tool response
 */
export async function executeToolCall(
  toolCall: ToolCall,
  toolImplementations: Record<string, (args: any) => Promise<any> | any>
): Promise<any> {
  const call_id = toolCall.call_id;
  
  const implementation = toolImplementations[toolCall.name];
  
  try {
    const args = parseToolCallArguments(toolCall);
    const result = await implementation(args);
    const toolResponse = {
      type: "function_call_output",
      call_id: call_id,
      output: JSON.stringify(result)
    };
    return toolResponse
  } catch (error: any) {
    console.error(`Error executing tool call ${toolCall.name}:`, error);
    return {
      type: "function_call_output",
      call_id: toolCall.id,
      output: `Failed to execute ${toolCall.name}: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Executes multiple tool calls using the provided tool implementations
 * @param toolCalls The tool calls to execute
 * @param toolImplementations An object mapping tool names to their implementations
 * @returns A promise that resolves to an array of tool responses
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  toolImplementations: Record<string, (args: any) => Promise<any> | any>
): Promise<ToolResponse[]> {
  return Promise.all(toolCalls.map(toolCall => executeToolCall(toolCall, toolImplementations)));
}

/**
 * Executes all function calls found in an OpenAI Response object
 * @param response The OpenAI Response object containing function calls in its output
 * @param toolImplementations An object mapping function names to their implementations
 * @returns A promise that resolves to an array of tool responses, or an empty array if no function calls were found
 */
export async function executeResponseToolCalls(
  response: any,
  toolImplementations: Record<string, (args: any) => Promise<any> | any>
): Promise<any> {
  const toolCalls = response.output;
  let toolCallResult: any;
  
  for (const toolCall of toolCalls) {
    if (toolCall.type !== "function_call") {
      continue;
    }

    toolCallResult = await executeToolCall(toolCall, toolImplementations);
  }
  
  return toolCallResult
}
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Recursively processes a JSON schema to ensure all objects have required fields
 * @param schema The JSON schema to process
 * @returns The processed schema with required fields
 */
function ensureRequiredFields(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // If it's an object with properties, ensure it has required fields
  if (schema.type === 'object' && schema.properties) {
    // Get all property keys that aren't marked as optional
    const requiredProps = Object.keys(schema.properties);
    
    // Set required field if there are properties
    if (requiredProps.length > 0) {
      schema.required = requiredProps;
    }
    
    // Process nested properties
    for (const key of Object.keys(schema.properties)) {
      schema.properties[key] = ensureRequiredFields(schema.properties[key]);
    }
  }
  
  // If it's an array, process items
  if (schema.type === 'array' && schema.items) {
    schema.items = ensureRequiredFields(schema.items);
  }
  
  return schema;
}

/**
 * Converts a Zod schema to the format required by OpenAI Responses API
 * @param schema The Zod schema to convert
 * @param name The name to use for the schema in the API
 * @param options Additional options for the schema
 * @returns An object formatted for use in the text.format property
 */
export function zodToOpenAIFormat<T extends z.ZodType>(
  schema: T, 
  name: string,
  options: {
    additionalProperties?: boolean;
  } = { additionalProperties: false }
) {
  const jsonSchema = zodToJsonSchema(schema);
  
  // Process the schema to ensure all objects have required fields
  const processedSchema = ensureRequiredFields(jsonSchema);
  
  return {
    format: {
      type: "json_schema" as const,
      name: name,
      schema: {
        ...processedSchema,
        additionalProperties: options.additionalProperties
      },
    }
  };
} 
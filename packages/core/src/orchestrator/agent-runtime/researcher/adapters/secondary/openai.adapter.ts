import OpenAI from "openai";
import { citationsSchema, RequestResearchInput, 
  RequestResearchOutput, 
    RequestResearchOutputSchema,
    systemPrompt, userPromt } from "@metadata/agents/research-agent.schema";
import { Resource } from "sst";
import { withRetry } from "@utils/tools/retry";
import { zodToOpenAIFormat } from "@utils/vendors/openai/schema-helpers";
import { z } from "zod";

const client = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value
});


export const executeResearch = async (input: RequestResearchInput): Promise<RequestResearchOutput> => {
  try {
    // Construct the prompt

   
    const response = await client.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "web_search_preview", 
        search_context_size: "high",
      }],
      instructions: systemPrompt,
      input: [
        {"role": "user", "content": userPromt(input)}
      ],
  
      tool_choice: "required"
    });
    

       
    const deepResearch = await client.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "web_search_preview", 
        search_context_size: "high",
      }],
      instructions: systemPrompt,
      input: [
        {"role": "user", "content": `Deep research on the following topic: ${response.output_text}`}
      ],
      tool_choice: "required"
    });
    

    const title = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {"role": "user", "content": `Generate a title for the following research: ${deepResearch.output_text}`}
      ],
    });

  

    const extractCitations = await client.responses.create({
      model: "gpt-4o",
      input: [
        {"role": "user", "content": `Extract the citations from the following research: ${response.output_text}`}
      ],
      text: zodToOpenAIFormat(citationsSchema, "citation_links")
    });

    const summary = await client.responses.create({
      model: "gpt-4.5-preview",
      input: [
        {"role": "user", "content": `Generate a summary for the following research: ${deepResearch.output_text}`}
      ],
    });

    const citations = citationsSchema.parse(JSON.parse(extractCitations.output_text));
    
    const content = RequestResearchOutputSchema.parse({
      researchId: input.id,
      title: title.output_text,
      content: summary.output_text,
      citation_links: citations.links
    });
    
    return content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

// Keep the existing retry wrapper
export const runResearch = withRetry(executeResearch, { 
  retries: 3, 
  delay: 1000, 
  onRetry: (error: Error) => console.warn('Retrying content generation due to error:', error) 
});

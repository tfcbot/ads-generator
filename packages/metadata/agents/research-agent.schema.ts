import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

export enum ResearchStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
} 


export const RequestResearchFormInputSchema = z.object({
    prompt: z.string(),
});

export const RequestResearchInputSchema = z.object({
    prompt: z.string(),
    id: z.string().optional().default(uuidv4()),
    userId: z.string(),
    keyId: z.string(),
});

export const systemPrompt = `
You are a research agent.

You are responsible for creating detailed research for a given topic.

You will be given a prompt and you will need to create comprehensive research according to the prompt.

Search the web for relevant information and use it to create the research.

You will need to provide a list of citations for the research.

The citations should be in the format of a list of URLs.
`

export const userPromt = (input: RequestResearchInput): string  => `
Generate research according to the following prompt:

${input.prompt}
`
export const PendingResearchSchema = z.object({
    researchId: z.string(),
    userId: z.string(),
    title: z.string(), 
    content: z.string(),
    citation_links: z.array(z.string()),
    researchStatus: z.nativeEnum(ResearchStatus).default(ResearchStatus.PENDING),
});


export const RequestResearchOutputSchema = z.object({
    researchId: z.string(),
    title: z.string(), 
    content: z.string(),
    citation_links: z.array(z.string()),
    researchStatus: z.nativeEnum(ResearchStatus).default(ResearchStatus.PENDING),
});

export const SaveResearchSchema = z.object({
    researchId: z.string(),
    userId: z.string(),
    title: z.string(), 
    content: z.string(),
    citation_links: z.array(z.string()),
});

export const GetResearchInputSchema = z.object({  
    userId: z.string(),
    researchId: z.string(),
});

export const GetAllUserResearchInputSchema = z.object({
    userId: z.string(),
});

export const citationsSchema = z.object({
    links: z.array(z.string())
  });

export type RequestResearchOutput = z.infer<typeof RequestResearchOutputSchema>;
export type RequestResearchInput = z.infer<typeof RequestResearchInputSchema>;
export type GetResearchInput = z.infer<typeof GetResearchInputSchema>; 
export type RequestResearchFormInput = z.infer<typeof RequestResearchFormInputSchema>;
export type GetAllUserResearchInput = z.infer<typeof GetAllUserResearchInputSchema>;
export type SaveResearchInput = z.infer<typeof SaveResearchSchema>;
export type PendingResearch = z.infer<typeof PendingResearchSchema>;
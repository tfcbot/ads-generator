import { Queue, Topic } from "./orchestrator.schema";
import { z } from "zod";
import { RequestResearchInputSchema } from "./agents/research-agent.schema";

export const AgentMessageSchema = z.object({
  topic: z.nativeEnum(Topic),
  id: z.string(),
  timestamp: z.string(),
  queue: z.string(),
  payload: z.object({
    id: z.string(),
  })
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

/**
 * Deliverable Schemas
 */
export const DeliverableSchema = z.object({
    deliverableId: z.string(),
});

/**
 * Task Schemas
 */
export const ResearchRequestTaskSchema = AgentMessageSchema.extend({
  payload: RequestResearchInputSchema,
});

export type ResearchRequestTask = z.infer<typeof ResearchRequestTaskSchema>;

export type AgentTask =
  | ResearchRequestTask;




import { Topic } from "./orchestrator.schema";
import { z } from "zod";

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

export type AgentTask = Record<string, never>;




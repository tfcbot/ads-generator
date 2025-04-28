import { createHandler } from "@utils/tools/custom-handler";
import { authWebhookAdapter } from "../../core/src/orchestrator/auth/adapters/primary/webhook.adapter";

export const registerWebhookHandler = createHandler(authWebhookAdapter); 
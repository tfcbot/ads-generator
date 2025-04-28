import { createHandler } from "@utils/tools/custom-handler";
import { checkoutAdapter } from "../../core/src/orchestrator/billing/adapters/primary/checkout.adapter";
import { webhookAdapter } from "../../core/src/orchestrator/billing/adapters/primary/webhook.adapter";
import { createApiKeyAdapter } from "../../core/src/orchestrator/billing/adapters/primary/create-api-key.adapter";
import { getUserCreditsAdapter } from "../../core/src/orchestrator/billing/adapters/primary/get-credits.adapter";

export const checkoutHandler = createHandler(checkoutAdapter);
export const webhookHandler = createHandler(webhookAdapter);
export const createApiKeyHandler = createHandler(createApiKeyAdapter);
export const getUserCreditsHandler = createHandler(getUserCreditsAdapter);

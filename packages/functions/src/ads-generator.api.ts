import { createHandler } from "@utils/tools/custom-handler";
import { createAdAdapter } from "../../core/src/orchestrator/ads-generator/adapters/primary/create-ad.adapter";
import { getAdByIdAdapter } from "../../core/src/orchestrator/ads-generator/adapters/primary/get-ad-by-id.adapter";
import { getAllUserAdsAdapter } from "../../core/src/orchestrator/ads-generator/adapters/primary/get-all-ads.adapter";

export const createAdHandler = createHandler(createAdAdapter);
export const getAllUserAdsHandler = createHandler(getAllUserAdsAdapter);
export const getAdByIdHandler = createHandler(getAdByIdAdapter);

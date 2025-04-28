import { createHandler } from "@utils/tools/custom-handler";
import { requestAdAdapter } from "@agent-runtime/ads-generator/adapters/primary/request-ad.adapter";
import { getAdByIdAdapter } from "@agent-runtime/ads-generator/adapters/primary/get-ad-by-id.adapter";
import { getAllUserAdsAdapter } from "@agent-runtime/ads-generator/adapters/primary/get-all-ads.adapter";

export const requestAdHandler = createHandler(requestAdAdapter);
export const getAllUserAdsHandler = createHandler(getAllUserAdsAdapter);
export const getAdByIdHandler = createHandler(getAdByIdAdapter);

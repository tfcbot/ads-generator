import { createHandler } from "@utils/tools/custom-handler";
import { requestResearchAdapter } from "@agent-runtime/researcher/adapters/primary/request-research.adapter";
import { getResearchByIdAdapter } from "@agent-runtime/researcher/adapters/primary/get-research-by-id.adapter";
import { getAllUserResearchAdapter } from "@agent-runtime/researcher/adapters/primary/get-all-research.adapter";

export const requestResearchHandler = createHandler(requestResearchAdapter);
export const getAllUserResearchHandler = createHandler(getAllUserResearchAdapter);
export const getResearchByIdHandler = createHandler(getResearchByIdAdapter);

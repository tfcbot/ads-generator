import { GetUserCreditsInput } from "@metadata/credits.schema";
import { apiKeyAdapter } from "../adapters/secondary/api-key.adapter";


export async function getUserCreditsUseCase(input: GetUserCreditsInput) {
  try {

    const credits = await apiKeyAdapter.getRemainingCredits(input.keyId);
    
    return { 
      credits,
    };
  } catch (error) {
    console.error("Error getting user credits:", error);
  }
}

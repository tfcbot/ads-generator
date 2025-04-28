import { SaveResearchSchema, RequestResearchInput, ResearchStatus } from '@metadata/agents/research-agent.schema';
import { Message } from '@metadata/message.schema';
import { runResearch } from '../adapters/secondary/openai.adapter';
import { researchRepository } from '../adapters/secondary/datastore.adapter';

export const runResearchUsecase = async (input: RequestResearchInput): Promise<Message> => {
  console.info("Performing research for User");

  try {
    console.info("Running research");
    const research = await runResearch(input);
    console.info("Research completed successfully");
    research.researchStatus = ResearchStatus.COMPLETED; 
    const researchWithUserId = SaveResearchSchema.parse({
      ...research,
      userId: input.userId
    });
    console.info("Research with completed");
    const message = await researchRepository.saveResearch(researchWithUserId);
    console.info("Research saved successfully");
    return {
      message: message
    };
  } catch (error) {
    console.error('Error performing research:', error);
    throw new Error('Failed to perform research', { cause: error }  );
  }
};

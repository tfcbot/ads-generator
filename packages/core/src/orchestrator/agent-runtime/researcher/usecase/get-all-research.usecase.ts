/**
 * Get User Research Usecase
 * 
 * This module provides the implementation for retrieving all research entries for a specific user.
 * It processes the request and returns a list of research results for the authenticated user.
 */

import { Message } from '@metadata/message.schema';
import { RequestResearchOutput, GetAllUserResearchInput } from '@metadata/agents/research-agent.schema';
import { researchRepository } from '../adapters/secondary/datastore.adapter';

/**
 * Executes the process to retrieve all research entries for a user
 * 
 * This usecase:
 * 1. Processes the request through the research repository
 * 2. Returns all research results for the specified user
 * 
 * @param input - The input containing the user ID
 * @returns A message with the user's research results
 */
export const getUserResearchUsecase = async (input: GetAllUserResearchInput): Promise<Message> => {
  console.info("Getting research entries for user:", input.userId);

  try {
    const userResearch = await researchRepository.getResearchByUserId(input.userId);
    
    return {
      message: 'User research retrieved successfully',
      data: userResearch,
    };
  } catch (error) {
    console.error('Error retrieving user research:', error);
    throw new Error('Failed to retrieve user research');
  }
}; 
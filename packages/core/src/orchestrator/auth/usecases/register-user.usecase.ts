import { NewUser } from '@metadata/user.schema';
import { userRegistrationSagaBuilder } from '../adapters/secondary/user-registration.saga';

export async function registerUserUseCase(newUserData: NewUser): Promise<{ message: string }> {
  console.info("Processing register user usecase for:", newUserData.userId);
  
  try {
    // Build and execute the saga for user registration
    const saga = userRegistrationSagaBuilder.forUser(newUserData).build();
    await saga.execute();
    
    return {
      message: 'User registered successfully'
    };
  } catch (error) {
    console.error('Failed to register user:', error);
    throw new Error('User registration failed');
  }
} 
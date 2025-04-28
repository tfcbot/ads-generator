import { NewUser } from '@metadata/user.schema';
import { Saga } from '../../../../lib/transaction.util';
import { userAdapter } from './user-management.adapter';

export class UserRegistrationSagaBuilder {
  private newUserData!: NewUser;
  private generatedKeyId!: string;

  constructor() {}

  /**
   * Configure the saga for a specific user
   * @param newUserData The user data to register
   * @returns This builder instance for chaining
   */
  forUser(newUserData: NewUser): UserRegistrationSagaBuilder {
    this.newUserData = newUserData;
    return this;
  }

  /**
   * Build the user registration saga with all necessary steps
   * @returns A configured Saga instance ready to execute
   */
  build(): Saga {
    if (!this.newUserData) {
      throw new Error('User data must be provided before building the saga');
    }

    const saga = new Saga();
    
    // Step 1: Register the user
    saga.addStep<void>({
      execute: async () => {
        console.info("Executing step: Register user");
        await userAdapter.registerUser(this.newUserData);
      },
      compensate: async () => {
        console.info("Compensating step: Register user - would delete user");
        console.warn("User deletion compensation not implemented");
      }
    });
    
    // Step 2: Generate API keys
    saga.addStep<string>({
      execute: async () => {
        console.info("Executing step: Generate API keys");
        this.generatedKeyId = await userAdapter.generateApiKeys(this.newUserData.userId);
        return this.generatedKeyId;
      },
      compensate: async () => {
        console.info("Compensating step: Generate API keys - deleting keys");
        if (this.generatedKeyId) {
          await userAdapter.deleteApiKeys(this.newUserData.userId, this.generatedKeyId);
        }
      }
    });
    
    // Step 3: Save API key to user keys database
    saga.addStep<void>({
      execute: async () => {
        console.info("Executing step: Save API key to database");
        if (this.generatedKeyId) {
          await userAdapter.saveApiKeyToDatabase(this.newUserData.userId, this.generatedKeyId);
        } else {
          throw new Error('No API key generated to save to database');
        }
      },
      compensate: async () => {
        console.info("Compensating step: Save API key to database - removing saved key");
        if (this.generatedKeyId) {
          await userAdapter.removeApiKeyFromDatabase(this.newUserData.userId, this.generatedKeyId);
        }
      }
    });
    
    // Step 4: Update user claims in auth provider
    saga.addStep<void>({
      execute: async () => {
        console.info("Executing step: Update user claims in auth provider");
        const claimsData = {
          keyId: this.generatedKeyId,
          hasApiKey: true,
          userStatus: 'active',
          registrationCompleted: true,
          registrationDate: new Date().toISOString()
        };
        await userAdapter.updateUserClaims(this.newUserData.userId, claimsData);
      },
      compensate: async () => {
        console.info("Compensating step: Update user claims in auth provider - resetting claims");
        // Reset claims to indicate registration failed
        const resetClaims = {
          hasApiKey: false,
          userStatus: 'pending',
          registrationCompleted: false
        };
        await userAdapter.updateUserClaims(this.newUserData.userId, resetClaims);
      }
    });
    
    return saga;
  }
}

// Export singleton instance for easy access
export const userRegistrationSagaBuilder = new UserRegistrationSagaBuilder(); 
import { ClerkService } from "@utils/vendors/jwt-vendor";
import { UpdatePropertyCommandInput } from "@metadata/jwt.schema";

export interface IAuthManagerAdapter {
  updateUserProperties(command: UpdatePropertyCommandInput): Promise<string>;
}

export class AuthManagerAdapter implements IAuthManagerAdapter {
  private clerkService: ClerkService;

  constructor() {
    this.clerkService = new ClerkService();
  }

  async updateUserProperties(command: UpdatePropertyCommandInput): Promise<string> {
    console.info("Updating user properties in Clerk:", command.userId);
    const result = await this.clerkService.updateUserProperties(command);
    return result;
  }
}

// Export singleton instance
export const authManagerAdapter: IAuthManagerAdapter = new AuthManagerAdapter(); 
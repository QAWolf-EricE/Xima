import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * User Management Page - Agent licensing and user administration
 */
export class UserManagementPage extends BasePage {
  
  private readonly agentLicensingTitle = this.getByText('Agent Licensing');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.agentLicensingTitle);
  }

  async verifyAgentLicensingVisible(): Promise<void> {
    await this.expectVisible(this.agentLicensingTitle);
  }
}

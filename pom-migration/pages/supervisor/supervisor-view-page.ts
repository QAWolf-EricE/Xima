import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Supervisor View Page - Real-time agent monitoring and management
 */
export class SupervisorViewPage extends BasePage {
  
  private readonly supervisorViewTitle = this.getByText('Supervisor View');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.supervisorViewTitle);
  }
}

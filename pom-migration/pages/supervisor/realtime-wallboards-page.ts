import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Real-Time Wallboards Page - Dashboard visualization and monitoring
 */
export class RealTimeWallboardsPage extends BasePage {
  
  private readonly wallboardsTitle = this.getByText('Wallboards');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.wallboardsTitle);
  }
}

import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Active Media Page - Manages active calls, chats, and emails
 */
export class ActiveMediaPage extends BasePage {
  
  private readonly activeMediaSection = this.getByText('Active Media');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.activeMediaSection);
  }
}

import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Channel State Page - Manages agent channel availability and status
 */
export class ChannelStatePage extends BasePage {
  
  private readonly channelStatesSection = this.getByText('Channel States');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.channelStatesSection);
  }
}

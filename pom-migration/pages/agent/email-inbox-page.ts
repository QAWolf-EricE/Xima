import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Email Inbox Page - Manages email inbox view and email selection
 * Handles email list display and email selection for reading/responding
 */
export class EmailInboxPage extends BasePage {
  
  // Email inbox elements
  private readonly activeEmailTiles = this.locator('xima-active-media-tile');
  private readonly activeChatEmail = this.getByDataCy('active-media-chat-email');
  private readonly emailChannelIcon = this.getByDataCy('channel-state-channel-EMAIL-icon');
  private readonly channelStateLabel = this.getByDataCy('channel-state-label');
  
  // Email status indicators
  private readonly emailReadyColor = 'rgb(49, 180, 164)'; // Green color when email channel is ready
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.channelStateLabel);
  }

  /**
   * Check if email channel is enabled and ready (green color)
   */
  async isEmailChannelReady(): Promise<boolean> {
    try {
      await this.expectElementToHaveCSS(this.emailChannelIcon, 'color', this.emailReadyColor, 3000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for email channel to become ready
   */
  async waitForEmailChannelReady(timeoutMs: number = 30000): Promise<void> {
    await this.expectElementToHaveCSS(this.emailChannelIcon, 'color', this.emailReadyColor, timeoutMs);
    console.log('Email channel is ready and enabled');
  }

  /**
   * Check if there are active emails
   */
  async hasActiveEmails(): Promise<boolean> {
    const emailCount = await this.getCount(this.activeChatEmail);
    return emailCount > 0;
  }

  /**
   * Get the number of active emails
   */
  async getActiveEmailCount(): Promise<number> {
    return await this.getCount(this.activeChatEmail);
  }

  /**
   * Wait for new email to arrive
   */
  async waitForNewEmail(timeoutMs: number = 60000): Promise<void> {
    console.log('Waiting for new email to arrive...');
    await this.expectVisible(this.activeChatEmail, timeoutMs);
    console.log('New email received');
  }

  /**
   * Click on the first active email to open it
   */
  async openFirstEmail(): Promise<void> {
    await this.expectVisible(this.activeChatEmail);
    await this.clickElement(this.activeChatEmail.first());
    console.log('Opened first email');
  }

  /**
   * Click on specific email by index
   */
  async openEmailByIndex(index: number): Promise<void> {
    await this.expectVisible(this.activeChatEmail);
    await this.clickElement(this.activeChatEmail.nth(index));
    console.log(`Opened email at index ${index}`);
  }

  /**
   * Mark current email as complete
   */
  async markEmailAsComplete(): Promise<void> {
    const markCompleteButton = this.getByText('Mark as Complete');
    await this.clickElement(markCompleteButton);
    console.log('Marked email as complete');
  }

  /**
   * Clean up all active emails by marking them as complete
   */
  async cleanupAllActiveEmails(maxEmails: number = 10): Promise<void> {
    console.log('Cleaning up active emails...');
    
    let counter = 0;
    while ((await this.hasActiveEmails()) && counter < maxEmails) {
      try {
        // Click on first email tile
        await this.clickElement(this.activeEmailTiles.first());
        
        // Mark as complete
        await this.markEmailAsComplete();
        
        // Wait for email channel to become ready (green) indicating no more emails
        try {
          await this.waitForEmailChannelReady(8000);
        } catch {
          // Continue if channel doesn't turn green immediately
        }
        
        counter++;
        console.log(`Cleaned up email ${counter}`);
        
      } catch (error) {
        console.warn(`Error cleaning up email ${counter}: ${error.message}`);
        break;
      }
    }
    
    console.log(`Email cleanup completed. Processed ${counter} emails.`);
  }

  /**
   * Verify email channel is in ready state after email processing
   */
  async verifyEmailChannelReady(): Promise<void> {
    await this.waitForEmailChannelReady();
  }

  /**
   * Helper method to expect element to have specific CSS property
   */
  private async expectElementToHaveCSS(
    locator: any, 
    property: string, 
    value: string, 
    timeout: number = 10000
  ): Promise<void> {
    await this.page.waitForFunction(
      ({ selector, property, value }) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.getPropertyValue(property).trim() === value;
      },
      { selector: await locator.first().getAttribute('data-cy') ? `[data-cy="${await locator.first().getAttribute('data-cy')}"]` : await locator.first().evaluate(el => el.tagName.toLowerCase()), property, value },
      { timeout }
    );
  }
}

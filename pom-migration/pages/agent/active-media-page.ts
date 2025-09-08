import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Active Media Page - Manages active calls, chats, and emails
 * Enhanced for auto-answer testing and call management
 */
export class ActiveMediaPage extends BasePage {
  
  // Page section elements
  private readonly activeMediaSection = this.getByText('Active Media');
  
  // Call dialog elements
  private readonly callActiveHeader = this.locator('xima-dialog-header').getByText('Call Active');
  private readonly callEndedHeader = this.locator('xima-dialog-header').getByText('Call Ended');
  private readonly activeMediaTile = this.locator('xima-active-media-tile');
  
  // Call control elements
  private readonly endCallButton = this.getByDataCy('end-call-btn');
  private readonly iAmDoneButton = this.getByRole('button', { name: 'I Am Done' });
  private readonly closeButton = this.getByRole('button', { name: 'Close' });
  
  // Call details sidebar elements
  private readonly detailsSidebar = this.locator('[data-cy="details-sidebar"]');
  private readonly waitTimeElement = this.getByDataCy('details-sidebar-details-MEDIA_WAIT_TIME');
  private readonly afterCallWorkTitle = this.getByDataCy('alert-after-call-work-title');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.activeMediaSection);
  }

  /**
   * Wait for incoming call to be automatically answered and become active
   * @param timeoutMs - Maximum time to wait for call to become active
   */
  async expectCallAutoAnswered(timeoutMs: number = 300000): Promise<void> {
    console.log('Waiting for call to be automatically answered...');
    await this.expectVisible(this.callActiveHeader, timeoutMs);
    console.log('Call is now active - auto-answer successful');
  }

  /**
   * Verify active media tile appears for the call
   */
  async expectActiveMediaTileVisible(): Promise<void> {
    await this.expectVisible(this.activeMediaTile);
    console.log('Active media tile is visible');
  }

  /**
   * Verify call wait time shows as expected (usually 00:00:00 for auto-answered calls)
   * @param expectedWaitTime - Expected wait time format (e.g., "00:00:00")
   */
  async verifyCallWaitTime(expectedWaitTime: string = "00:00:00"): Promise<void> {
    await this.expectText(this.waitTimeElement, expectedWaitTime);
    console.log(`Call wait time verified: ${expectedWaitTime}`);
  }

  /**
   * Wait for call to automatically end
   * @param timeoutMs - Maximum time to wait for call to end
   */
  async expectCallEnded(timeoutMs: number = 180000): Promise<void> {
    console.log('Waiting for call to end...');
    await this.expectVisible(this.callEndedHeader, timeoutMs);
    console.log('Call has ended');
  }

  /**
   * Verify after call work (ACW) tile appears
   */
  async expectAfterCallWorkVisible(): Promise<void> {
    await this.expectVisible(this.afterCallWorkTitle);
    console.log('After Call Work tile is visible');
  }

  /**
   * Complete after call work by clicking "I Am Done"
   */
  async completeAfterCallWork(): Promise<void> {
    console.log('Completing after call work...');
    await this.clickElement(this.iAmDoneButton);
    await this.waitForTimeout(1000, 'After call work completion');
  }

  /**
   * Close call dialog
   */
  async closeCallDialog(): Promise<void> {
    console.log('Closing call dialog...');
    await this.clickElement(this.closeButton);
    await this.waitForTimeout(1000, 'Dialog close');
  }

  /**
   * Handle complete call cleanup (ACW + close dialog)
   */
  async completeCallCleanup(): Promise<void> {
    try {
      await this.completeAfterCallWork();
      await this.closeCallDialog();
      console.log('Call cleanup completed successfully');
    } catch (error) {
      console.warn('Call cleanup encountered an issue:', error.message);
      throw error;
    }
  }

  /**
   * Emergency cleanup - end active call if present
   */
  async emergencyEndCall(): Promise<void> {
    console.log('Performing emergency call cleanup...');
    
    try {
      // Check if end call button is visible and click it
      const endCallVisible = await this.isVisible(this.endCallButton);
      if (endCallVisible) {
        await this.clickElement(this.endCallButton);
        console.log('End call button clicked');
        
        // Complete after call work
        await this.completeAfterCallWork();
        
        // Close dialog
        await this.closeCallDialog();
      } else {
        console.log('No active call found to end');
      }
    } catch (error) {
      console.warn('Emergency cleanup failed:', error.message);
      // Don't re-throw - this is cleanup code
    }
  }

  /**
   * Verify no active call is in progress
   */
  async verifyNoActiveCall(): Promise<void> {
    await this.expectHidden(this.endCallButton, 5000);
    console.log('Verified no active call in progress');
  }

  /**
   * Get call details from sidebar
   */
  async getCallDetails(): Promise<Record<string, string>> {
    const details: Record<string, string> = {};
    
    try {
      // Wait time
      const waitTime = await this.getText(this.waitTimeElement);
      details.waitTime = waitTime;
      
      // Add more details as needed
      console.log('Call details retrieved:', details);
      
    } catch (error) {
      console.warn('Could not retrieve all call details:', error.message);
    }
    
    return details;
  }

  /**
   * Verify specific call flow elements for auto-answer testing
   */
  async verifyAutoAnswerFlow(): Promise<void> {
    // 1. Verify call becomes active
    await this.expectCallAutoAnswered();
    
    // 2. Verify active media tile appears
    await this.expectActiveMediaTileVisible();
    
    // 3. Verify wait time is minimal (auto-answer should be immediate)
    await this.verifyCallWaitTime("00:00:00");
    
    // 4. Wait for call to end naturally
    await this.expectCallEnded();
    
    // 5. Verify after call work appears
    await this.expectAfterCallWorkVisible();
    
    console.log('Auto-answer flow verification completed successfully');
  }
}

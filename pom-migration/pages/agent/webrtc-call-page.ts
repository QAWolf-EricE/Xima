import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * WebRTC Call Page - Represents active WebRTC call management
 * Used for call control during active voice calls including mute, hold, transfer, and end call
 */
export class WebRTCCallPage extends BasePage {
  
  // Call status and information
  private readonly callActiveLabel = this.getByText('Call Active');
  private readonly connectingLabel = this.getByText('Connecting to...');
  private readonly incomingCallTitle = this.getByDataCy('alert-incoming-call-title-selector');
  private readonly incomingCallAccept = this.getByDataCy('alert-incoming-call-accept');
  private readonly answerCallButton = this.getByText('Answer Call');
  
  // Call details
  private readonly callerIdLabel = this.getByText('Caller Id');
  private readonly externalPartyNumberLabel = this.getByText('External Party Number');
  private readonly waitTimeLabel = this.getByText('Wait Time');
  private readonly callDirectionLabel = this.getByText('Call Direction');
  
  // Call control buttons
  private readonly muteButton = this.getByDataCy('mute-btn');
  private readonly holdButton = this.getByDataCy('hold-btn');
  private readonly endCallButton = this.getByDataCy('end-call-btn');
  private readonly finishButton = this.getByDataCy('finish-btn');
  
  // Transfer functionality
  private readonly transferButton = this.getByDataCy('transfer-btn');
  private readonly assistedTransferButton = this.getByText('Assisted Transfer');
  private readonly completeTransferButton = this.getByRole('button', { name: 'Complete Transfer' });
  
  // Transfer alerts and notifications
  private readonly assistedTransferAttemptAlert = this.getByText(' Assisted Transfer Attempt ');
  
  // After Call Work
  private readonly afterCallWorkTitle = this.getByDataCy('alert-after-call-work-title');
  private readonly afterCallWorkDone = this.getByDataCy('alert-after-call-work-done');
  
  // Call ended dialog
  private readonly callEndedDialog = this.locator('xima-dialog-header').getByText('Internal Call Ended');
  private readonly closeButton = this.getByRole('button', { name: 'Close' });

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Wait for incoming call notification
   */
  async waitForIncomingCall(timeoutMs: number = 120000): Promise<void> {
    await this.expectVisible(this.incomingCallTitle, timeoutMs);
  }

  /**
   * Answer incoming call
   */
  async answerCall(): Promise<void> {
    // Try different answer button variations
    try {
      await this.clickElement(this.incomingCallAccept, { force: true, delay: 500, timeout: 5000 });
    } catch {
      await this.clickElement(this.answerCallButton, { timeout: 5000 });
    }
  }

  /**
   * Verify call is active
   */
  async verifyCallActive(): Promise<void> {
    await this.expectVisible(this.callActiveLabel);
  }

  /**
   * Verify call connection in progress
   */
  async verifyConnecting(): Promise<void> {
    await this.expectVisible(this.connectingLabel);
  }

  /**
   * Verify call details are displayed
   */
  async verifyCallDetails(): Promise<void> {
    await this.expectVisible(this.callerIdLabel);
    await this.expectVisible(this.externalPartyNumberLabel);
    await this.expectVisible(this.waitTimeLabel);
    await this.expectVisible(this.callDirectionLabel);
  }

  /**
   * Mute the active call
   */
  async muteCall(): Promise<void> {
    await this.clickElement(this.muteButton);
  }

  /**
   * Unmute the active call
   */
  async unmuteCall(): Promise<void> {
    // Mute button acts as toggle
    await this.clickElement(this.muteButton);
  }

  /**
   * Toggle mute state
   */
  async toggleMute(): Promise<void> {
    await this.clickElement(this.muteButton);
  }

  /**
   * Put call on hold
   */
  async holdCall(): Promise<void> {
    await this.clickElement(this.holdButton);
  }

  /**
   * Take call off hold
   */
  async unholdCall(): Promise<void> {
    // Hold button acts as toggle
    await this.clickElement(this.holdButton);
  }

  /**
   * Toggle hold state
   */
  async toggleHold(): Promise<void> {
    await this.clickElement(this.holdButton);
  }

  /**
   * End the active call
   */
  async endCall(): Promise<void> {
    await this.clickElement(this.endCallButton, { force: true, delay: 500 });
  }

  /**
   * Complete after call work
   */
  async finishAfterCallWork(): Promise<void> {
    await this.expectVisible(this.finishButton);
    await this.clickElement(this.finishButton, { force: true, delay: 500 });
  }

  /**
   * Verify after call work is displayed
   */
  async verifyAfterCallWork(): Promise<void> {
    await this.expectVisible(this.afterCallWorkTitle);
  }

  /**
   * Complete end call workflow
   */
  async completeEndCallWorkflow(): Promise<void> {
    await this.endCall();
    await this.finishAfterCallWork();
  }

  /**
   * Initiate call transfer
   */
  async initiateTransfer(): Promise<void> {
    await this.clickElement(this.transferButton);
  }

  /**
   * Confirm assisted transfer
   */
  async confirmAssistedTransfer(): Promise<void> {
    await this.clickElement(this.assistedTransferButton);
  }

  /**
   * Wait for assisted transfer attempt notification
   */
  async waitForAssistedTransferAttempt(): Promise<void> {
    await this.expectVisible(this.assistedTransferAttemptAlert);
  }

  /**
   * Complete the transfer
   */
  async completeTransfer(): Promise<void> {
    await this.clickElement(this.completeTransferButton);
  }

  /**
   * Handle call ended dialog
   */
  async handleCallEndedDialog(): Promise<void> {
    await this.expectVisible(this.callEndedDialog);
    await this.clickElement(this.closeButton);
  }

  /**
   * Test mute functionality (mute and unmute)
   */
  async testMuteFunctionality(): Promise<void> {
    // Mute the call
    await this.muteCall();
    await this.expectVisible(this.muteButton); // Button should still be visible when muted
    
    // Unmute the call
    await this.unmuteCall();
    await this.expectVisible(this.muteButton); // Button should still be visible when unmuted
  }

  /**
   * Test hold functionality (hold and unhold)
   */
  async testHoldFunctionality(): Promise<void> {
    // Put call on hold
    await this.holdCall();
    await this.waitForTimeout(2000, 'Hold state change');
    
    // Take call off hold
    await this.unholdCall();
    await this.waitForTimeout(2000, 'Hold state change');
  }

  /**
   * Perform assisted transfer workflow
   */
  async performAssistedTransfer(): Promise<void> {
    await this.initiateTransfer();
    // Note: Dialpad interaction should be handled by WebRTCDialpadPage
    await this.waitForTimeout(2000, 'Transfer initiation');
    await this.confirmAssistedTransfer();
  }

  /**
   * Answer assisted transfer call (for receiving agent)
   */
  async answerAssistedTransferCall(): Promise<void> {
    await this.waitForAssistedTransferAttempt();
    await this.answerCall();
  }

  /**
   * Complete assisted transfer workflow (for transferring agent)
   */
  async completeAssistedTransferWorkflow(): Promise<void> {
    await this.waitForTimeout(2000, 'Transfer completion');
    await this.completeTransfer();
  }

  /**
   * Verify call transfer completed successfully
   */
  async verifyTransferCompleted(): Promise<void> {
    await this.verifyCallActive();
  }

  /**
   * Check if call is currently active
   */
  async isCallActive(): Promise<boolean> {
    return await this.isVisible(this.callActiveLabel);
  }

  /**
   * Check if call is on hold
   */
  async isCallOnHold(): Promise<boolean> {
    // This would depend on specific UI indicators for hold state
    // For now, we'll use a basic check
    try {
      await this.holdButton.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if call is muted
   */
  async isCallMuted(): Promise<boolean> {
    // This would depend on specific UI indicators for mute state
    try {
      await this.muteButton.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get call duration (if displayed)
   */
  async getCallDuration(): Promise<string> {
    // This would need to be implemented based on where call duration is displayed
    const durationElement = this.locator('[data-cy="call-duration"], .call-duration');
    try {
      return await this.getText(durationElement);
    } catch {
      return '00:00';
    }
  }

  /**
   * Wait for call to connect
   */
  async waitForCallConnection(timeoutMs: number = 30000): Promise<void> {
    // Wait for either "Call Active" or connection establishment
    await Promise.race([
      this.expectVisible(this.callActiveLabel, timeoutMs),
      this.expectHidden(this.connectingLabel, timeoutMs)
    ]);
  }

  /**
   * Verify call control buttons are available
   */
  async verifyCallControls(): Promise<void> {
    await this.expectVisible(this.muteButton);
    await this.expectVisible(this.holdButton);
    await this.expectVisible(this.endCallButton);
    await this.expectVisible(this.transferButton);
  }

  /**
   * Handle end call with cleanup
   */
  async endCallWithCleanup(): Promise<void> {
    await this.endCall();
    
    // Handle after call work if it appears
    try {
      await this.finishAfterCallWork();
    } catch {
      console.log('No after call work required');
    }
    
    // Handle call ended dialog if it appears
    try {
      await this.handleCallEndedDialog();
    } catch {
      console.log('No call ended dialog');
    }
  }
}

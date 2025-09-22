import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Outbound Call Page - Handles outbound call creation and caller ID management
 * Manages the outbound dialing interface, caller ID selection, and call establishment
 */
export class OutboundCallPage extends BasePage {
  
  // Outbound call interface elements
  private readonly activeMediaMenuButton = this.getByDataCy('active-media-menu-button');
  private readonly newCallMenuItem = this.getByText('New Call');
  private readonly confirmButton = this.getByText('Confirm');
  
  // Caller ID selection elements
  private readonly callerIdSelectButton = this.locator('.caller-id-select-menu-button');
  private readonly callerIdOption = this.locator(':text("QA Wolf4352003655")'); // Specific caller ID
  
  // Dialpad elements
  private readonly dialpadContainer = this.getByDataCy('dialpad-text');
  private readonly phoneNumberInput = this.dialpadContainer.locator('#phoneNumberInput');
  private readonly callButton = this.getByDataCy('call-button');
  
  // Skill selection elements
  private readonly skillSelectionDialog = this.locator('.skill-selection, [data-cy*="select-skills"]');
  private readonly skill34Button = this.getByDataCy('alert-select-skills-skill-button-Skill 34');
  
  // Call status elements
  private readonly outboundCallHeader = this.getByText('Outbound Call');
  private readonly callActiveHeader = this.getByText('Call Active');
  private readonly outboundCallEndedHeader = this.getByText('Outbound Call Ended');
  private readonly callSubtitle = this.locator('xima-call .subtitle');
  
  // Call completion elements
  private readonly finishButton = this.getByDataCy('finish-btn');
  private readonly afterCallWorkDoneButton = this.getByDataCy('alert-after-call-work-done');
  private readonly activeMediaTilesContainer = this.getByDataCy('active-media-tiles-container');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.activeMediaMenuButton);
  }

  /**
   * Initiate new outbound call workflow
   */
  async initiateNewCall(): Promise<void> {
    console.log('Initiating new outbound call...');
    
    // Click active media menu button
    await this.clickElement(this.activeMediaMenuButton);
    
    // Select New Call option
    await this.expectVisible(this.newCallMenuItem);
    await this.clickElement(this.newCallMenuItem);
    
    // Confirm new call creation
    await this.expectVisible(this.confirmButton);
    await this.clickElement(this.confirmButton);
    
    console.log('New outbound call initiated');
  }

  /**
   * Select specific caller ID for outbound call
   */
  async selectCallerId(callerId: string = 'QA Wolf4352003655'): Promise<void> {
    console.log(`Selecting caller ID: ${callerId}`);
    
    // Click caller ID selection button
    await this.expectVisible(this.callerIdSelectButton);
    await this.clickElement(this.callerIdSelectButton);
    
    // Select specific caller ID option
    const callerIdOption = this.getByText(callerId);
    await this.expectVisible(callerIdOption);
    await this.clickElement(callerIdOption);
    
    console.log(`✅ Caller ID selected: ${callerId}`);
  }

  /**
   * Dial phone number
   */
  async dialPhoneNumber(phoneNumber: string): Promise<void> {
    console.log(`Dialing phone number: ${phoneNumber}`);
    
    // Fill phone number input
    await this.expectVisible(this.phoneNumberInput);
    await this.fillField(this.phoneNumberInput, phoneNumber);
    
    // Click call button
    await this.expectVisible(this.callButton);
    await this.clickElement(this.callButton);
    
    console.log(`✅ Phone number dialed: ${phoneNumber}`);
  }

  /**
   * Select skill for outbound call
   */
  async selectSkill(skillNumber: string = '34'): Promise<void> {
    console.log(`Selecting skill: ${skillNumber}`);
    
    // Wait for skill selection dialog
    const skillButton = this.getByDataCy(`alert-select-skills-skill-button-Skill ${skillNumber}`);
    await this.expectVisible(skillButton);
    await this.clickElement(skillButton);
    
    console.log(`✅ Skill selected: ${skillNumber}`);
  }

  /**
   * Complete outbound call creation workflow
   */
  async createOutboundCall(options: OutboundCallOptions): Promise<void> {
    console.log('Creating outbound call with full workflow...');
    
    // Step 1: Initiate new call
    await this.initiateNewCall();
    
    // Step 2: Select caller ID
    await this.selectCallerId(options.callerId);
    
    // Step 3: Dial phone number
    await this.dialPhoneNumber(options.phoneNumber);
    
    // Step 4: Select skill if provided
    if (options.skillNumber) {
      await this.selectSkill(options.skillNumber);
    }
    
    console.log('✅ Outbound call creation workflow completed');
  }

  /**
   * Verify outbound call is active
   */
  async verifyOutboundCallActive(phoneNumber: string): Promise<void> {
    console.log('Verifying outbound call is active...');
    
    // Check for "Outbound Call" header
    await this.expectVisible(this.outboundCallHeader);
    
    // Check for "Call Active" status
    await this.expectVisible(this.callActiveHeader);
    
    // Verify phone number is displayed in call subtitle
    const phoneNumberDisplay = this.callSubtitle.filter({ hasText: phoneNumber });
    await this.expectVisible(phoneNumberDisplay);
    
    console.log(`✅ Outbound call active and verified for number: ${phoneNumber}`);
  }

  /**
   * Wait for outbound call to end
   */
  async waitForCallEnd(): Promise<void> {
    console.log('Waiting for outbound call to end...');
    
    await this.expectVisible(this.outboundCallEndedHeader, 60000);
    
    console.log('✅ Outbound call ended');
  }

  /**
   * Complete outbound call cleanup
   */
  async completeOutboundCallCleanup(): Promise<void> {
    console.log('Completing outbound call cleanup...');
    
    // Click finish button
    await this.expectVisible(this.finishButton);
    await this.clickElement(this.finishButton);
    
    // Complete after call work
    const afterCallWorkButton = this.activeMediaTilesContainer.locator(this.afterCallWorkDoneButton);
    await this.expectVisible(afterCallWorkButton);
    await this.clickElement(afterCallWorkButton);
    
    console.log('✅ Outbound call cleanup completed');
  }

  /**
   * Execute complete outbound call test workflow
   */
  async executeOutboundCallWorkflow(options: OutboundCallOptions): Promise<void> {
    console.log('Executing complete outbound call workflow...');
    
    // Create the call
    await this.createOutboundCall(options);
    
    // Verify call is active
    await this.verifyOutboundCallActive(options.phoneNumber);
    
    // Wait for call to end
    await this.waitForCallEnd();
    
    // Complete cleanup
    await this.completeOutboundCallCleanup();
    
    console.log('✅ Complete outbound call workflow executed successfully');
  }

  /**
   * Get current call status
   */
  async getCurrentCallStatus(): Promise<string> {
    try {
      if (await this.isVisible(this.callActiveHeader)) {
        return 'active';
      } else if (await this.isVisible(this.outboundCallEndedHeader)) {
        return 'ended';
      } else if (await this.isVisible(this.outboundCallHeader)) {
        return 'initiated';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Verify call appears with correct caller ID
   */
  async verifyCallerIdDisplayed(phoneNumber: string): Promise<void> {
    const callDisplay = this.callSubtitle.filter({ hasText: phoneNumber });
    await this.expectVisible(callDisplay);
    console.log(`✅ Caller ID verified for number: ${phoneNumber}`);
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface OutboundCallOptions {
  phoneNumber: string;
  callerId?: string;
  skillNumber?: string;
}

export interface OutboundCallResult {
  success: boolean;
  phoneNumber: string;
  callerId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}


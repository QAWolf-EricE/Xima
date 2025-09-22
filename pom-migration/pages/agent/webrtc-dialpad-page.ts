import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * WebRTC Dialpad Page - Represents the dialpad interface for making calls
 * Used for outbound calls, transfers, and number entry during WebRTC operations
 */
export class WebRTCDialpadPage extends BasePage {
  
  // Dialpad elements
  private readonly phoneNumberInput = this.locator('[data-cy="dialpad-text"] #phoneNumberInput');
  private readonly callButton = this.getByDataCy('call-button');
  private readonly confirmButton = this.getByText('Confirm');
  
  // Dialpad number buttons (mapped by number and letters)
  private readonly dialpadNumbers = {
    '0': this.locator('[data-cy="dialpad-number"]:has-text("0")'),
    '1': this.locator('[data-cy="dialpad-number"]:has-text("1")'),
    '2': this.locator('[data-cy="dialpad-number"]:has-text("2A B C")'),
    '3': this.locator('[data-cy="dialpad-number"]:has-text("3D E F")'),
    '4': this.locator('[data-cy="dialpad-number"]:has-text("4G H I")'),
    '5': this.locator('[data-cy="dialpad-number"]:has-text("5J K L")'),
    '6': this.locator('[data-cy="dialpad-number"]:has-text("6M N O")'),
    '7': this.locator('[data-cy="dialpad-number"]:has-text("7P Q R S")'),
    '8': this.locator('[data-cy="dialpad-number"]:has-text("8T U V")'),
    '9': this.locator('[data-cy="dialpad-number"]:has-text("9W X Y Z")')
  };
  
  // Active media menu
  private readonly activeMediaMenuButton = this.getByDataCy('active-media-menu-button');
  private readonly newCallOption = this.getByText('New Call');
  
  // Skill selection
  private readonly skillOptions = this.locator(':text-is("Skill"):visible');

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Open new call dialog
   */
  async openNewCallDialog(): Promise<void> {
    await this.clickElement(this.activeMediaMenuButton);
    await this.clickElement(this.newCallOption);
    await this.clickElement(this.confirmButton);
  }

  /**
   * Dial a phone number using the dialpad buttons
   */
  async dialNumber(phoneNumber: string): Promise<void> {
    const digits = phoneNumber.replace(/\D/g, ''); // Remove non-digit characters
    
    for (const digit of digits) {
      if (digit in this.dialpadNumbers) {
        await this.clickElement(this.dialpadNumbers[digit as keyof typeof this.dialpadNumbers]);
        await this.waitForTimeout(200, 'Digit input delay');
      } else {
        console.warn(`Invalid digit: ${digit}`);
      }
    }
  }

  /**
   * Type phone number directly into input field
   */
  async typePhoneNumber(phoneNumber: string): Promise<void> {
    await this.fillField(this.phoneNumberInput, phoneNumber);
  }

  /**
   * Click the call button to initiate call
   */
  async initiateCall(): Promise<void> {
    await this.clickElement(this.callButton, { delay: 150 });
  }

  /**
   * Select skill for the call (if skill selection appears)
   */
  async selectSkill(skillNumber: string): Promise<void> {
    const skillOption = this.locator(`:text-is("Skill ${skillNumber}"):visible`).last();
    await this.clickElement(skillOption);
  }

  /**
   * Complete outbound call workflow
   */
  async makeOutboundCall(phoneNumber: string, skillNumber?: string): Promise<void> {
    await this.openNewCallDialog();
    await this.typePhoneNumber(phoneNumber);
    await this.initiateCall();
    
    if (skillNumber) {
      await this.selectSkill(skillNumber);
    }
  }

  /**
   * Make outbound call using dialpad buttons
   */
  async makeOutboundCallWithDialpad(phoneNumber: string, skillNumber?: string): Promise<void> {
    await this.openNewCallDialog();
    await this.dialNumber(phoneNumber);
    await this.waitForTimeout(3000, 'Number entry completion');
    await this.initiateCall();
    
    if (skillNumber) {
      await this.selectSkill(skillNumber);
    }
  }

  /**
   * Dial extension number (3-digit)
   */
  async dialExtension(extension: string): Promise<void> {
    if (extension.length !== 3) {
      throw new Error('Extension must be 3 digits');
    }
    
    await this.dialNumber(extension);
    await this.waitForTimeout(3000, 'Extension dialing');
    await this.initiateCall();
  }

  /**
   * Dial specific agent extension based on common patterns
   */
  async dialAgentExtension(agentNumber: string): Promise<void> {
    // Common agent extension patterns (e.g., Agent 55 = 237, Agent 56 = 236, Agent 57 = 233)
    const extensionMap: { [key: string]: string } = {
      '55': '237', // 7-3-7 on dialpad
      '56': '236', // 2-3-6 on dialpad
      '57': '233'  // 2-3-3 on dialpad
    };
    
    const extension = extensionMap[agentNumber];
    if (extension) {
      await this.dialExtension(extension);
    } else {
      throw new Error(`Unknown agent extension for agent ${agentNumber}`);
    }
  }

  /**
   * Clear the dialpad input
   */
  async clearDialpad(): Promise<void> {
    await this.phoneNumberInput.clear();
  }

  /**
   * Get current dialpad input value
   */
  async getDialpadValue(): Promise<string> {
    return await this.phoneNumberInput.inputValue();
  }

  /**
   * Verify dialpad is visible and ready
   */
  async verifyDialpadReady(): Promise<void> {
    await this.expectVisible(this.phoneNumberInput);
    await this.expectVisible(this.callButton);
    
    // Verify some key dialpad buttons are present
    await this.expectVisible(this.dialpadNumbers['0']);
    await this.expectVisible(this.dialpadNumbers['5']);
    await this.expectVisible(this.dialpadNumbers['9']);
  }

  /**
   * Test dialpad number entry
   */
  async testDialpadEntry(): Promise<void> {
    await this.clearDialpad();
    
    // Test entering a sample number
    await this.dialNumber('123456789');
    
    const inputValue = await this.getDialpadValue();
    if (!inputValue.includes('123456789')) {
      throw new Error('Dialpad number entry failed');
    }
    
    await this.clearDialpad();
  }

  /**
   * Transfer call to extension using dialpad
   */
  async transferToExtension(extension: string): Promise<void> {
    // Assumes transfer dialog is already open
    await this.dialNumber(extension);
    await this.waitForTimeout(3000, 'Transfer number entry');
    await this.initiateCall();
  }

  /**
   * Enter number sequence for specific scenarios
   */
  async enterNumberSequence(sequence: string[]): Promise<void> {
    for (const number of sequence) {
      await this.dialNumber(number);
      await this.waitForTimeout(500, 'Sequence delay');
    }
  }

  /**
   * Verify dialpad buttons are clickable
   */
  async verifyDialpadButtonsEnabled(): Promise<void> {
    for (const [digit, button] of Object.entries(this.dialpadNumbers)) {
      await this.expectEnabled(button);
    }
    
    await this.expectEnabled(this.callButton);
  }

  /**
   * Get available skills for selection
   */
  async getAvailableSkills(): Promise<string[]> {
    const skills = await this.skillOptions.allTextContents();
    return skills.map(skill => skill.replace('Skill ', ''));
  }

  /**
   * Wait for skill selection to appear
   */
  async waitForSkillSelection(timeoutMs: number = 10000): Promise<void> {
    await this.expectVisible(this.skillOptions.first(), timeoutMs);
  }

  /**
   * Handle skill selection if it appears
   */
  async handleSkillSelectionIfPresent(skillNumber?: string): Promise<void> {
    try {
      await this.waitForSkillSelection(5000);
      
      if (skillNumber) {
        await this.selectSkill(skillNumber);
      } else {
        // Select first available skill
        await this.clickElement(this.skillOptions.first());
      }
    } catch {
      console.log('No skill selection required');
    }
  }

  /**
   * Make call with automatic skill handling
   */
  async makeCallWithAutoSkill(phoneNumber: string, skillNumber?: string): Promise<void> {
    await this.openNewCallDialog();
    await this.typePhoneNumber(phoneNumber);
    await this.initiateCall();
    await this.handleSkillSelectionIfPresent(skillNumber);
  }

  /**
   * Quick dial for internal transfers (common extensions)
   */
  async quickDialInternal(extensionType: 'agent55' | 'agent56' | 'agent57'): Promise<void> {
    const extensionMap = {
      'agent55': '237',
      'agent56': '236', 
      'agent57': '233'
    };
    
    const extension = extensionMap[extensionType];
    await this.dialNumber(extension);
    await this.waitForTimeout(3000, 'Quick dial');
    await this.initiateCall();
  }
}

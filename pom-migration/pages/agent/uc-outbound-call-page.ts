import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * UC Outbound Call Page - Handles UC outbound call initiation and management
 * Manages outbound call creation, skill selection, external number dialing, and transfer operations
 */
export class UCOutboundCallPage extends BasePage {
  
  // Outbound call elements
  private readonly dialpad = this.locator('.dialpad, .outbound-dialpad');
  private readonly phoneNumberInput = this.locator('.phone-input, input[type="tel"]');
  private readonly callButton = this.locator('.call-button, button:has-text("Call")');
  private readonly outboundButton = this.locator('.outbound-button, button:has-text("Outbound")');
  
  // Skill selection elements
  private readonly skillSelector = this.locator('.skill-selector, .outbound-skill-selector');
  private readonly skillDropdown = this.locator('.skill-dropdown, select[name="skill"]');
  private readonly skillOptions = this.locator('.skill-option, option');
  
  // Call status elements
  private readonly callStatus = this.locator('.call-status');
  private readonly activeCallIndicator = this.locator('.active-call, .call-in-progress');
  private readonly callTimer = this.locator('.call-timer, .call-duration');
  
  // Transfer elements
  private readonly transferButton = this.locator('.transfer-button, button:has-text("Transfer")');
  private readonly assistedTransferButton = this.locator('.assisted-transfer-button, button:has-text("Assisted Transfer")');
  private readonly supervisedTransferButton = this.locator('.supervised-transfer-button, button:has-text("Supervised Transfer")');
  private readonly agentSelector = this.locator('.agent-selector, .transfer-agent-selector');
  
  // Call control elements
  private readonly holdButton = this.locator('.hold-button, button:has-text("Hold")');
  private readonly muteButton = this.locator('.mute-button, button:has-text("Mute")');
  private readonly endCallButton = this.locator('.end-call-button, button:has-text("End Call")');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Initiate outbound call with skill selection
   */
  async initiateOutboundCallWithSkill(phoneNumber: string, skillNumber: string): Promise<OutboundCallResult> {
    console.log(`Initiating outbound call to ${phoneNumber} with skill ${skillNumber}...`);
    
    const startTime = new Date();
    
    // Select skill for outbound call
    await this.selectSkillForOutboundCall(skillNumber);
    
    // Dial phone number
    await this.dialOutboundNumber(phoneNumber);
    
    // Initiate call
    await this.clickElement(this.callButton);
    await this.waitForTimeout(3000, 'Call initiation processing');
    
    // Verify call initiated
    await this.expectVisible(this.activeCallIndicator);
    
    const result: OutboundCallResult = {
      phoneNumber,
      skillSelected: skillNumber,
      callInitiated: true,
      startTime,
      callId: this.generateCallId()
    };
    
    console.log(`✅ Outbound call initiated: ${phoneNumber} (Skill: ${skillNumber})`);
    return result;
  }

  /**
   * Initiate outbound call without skill selection
   */
  async initiateOutboundCallWithoutSkill(phoneNumber: string): Promise<OutboundCallResult> {
    console.log(`Initiating outbound call to ${phoneNumber} without skill selection...`);
    
    const startTime = new Date();
    
    // Dial phone number without skill selection
    await this.dialOutboundNumber(phoneNumber);
    
    // Initiate call
    await this.clickElement(this.callButton);
    await this.waitForTimeout(3000, 'Call initiation processing');
    
    // Verify call initiated
    await this.expectVisible(this.activeCallIndicator);
    
    const result: OutboundCallResult = {
      phoneNumber,
      skillSelected: null,
      callInitiated: true,
      startTime,
      callId: this.generateCallId()
    };
    
    console.log(`✅ Outbound call initiated: ${phoneNumber} (No skill)`);
    return result;
  }

  /**
   * Select skill for outbound call
   */
  async selectSkillForOutboundCall(skillNumber: string): Promise<void> {
    console.log(`Selecting skill ${skillNumber} for outbound call...`);
    
    await this.clickElement(this.skillSelector);
    
    const skillOption = this.skillOptions.filter({ hasText: `Skill ${skillNumber}` });
    await this.clickElement(skillOption);
    
    console.log(`✅ Skill ${skillNumber} selected for outbound call`);
  }

  /**
   * Dial outbound phone number
   */
  async dialOutboundNumber(phoneNumber: string): Promise<void> {
    console.log(`Dialing outbound number: ${phoneNumber}`);
    
    if (await this.isVisible(this.phoneNumberInput)) {
      await this.fillField(this.phoneNumberInput, phoneNumber);
    } else {
      // Use dialpad if available
      for (const digit of phoneNumber) {
        if (/[0-9]/.test(digit)) {
          const digitButton = this.dialpad.locator(`button:has-text("${digit}")`);
          await this.clickElement(digitButton);
        }
      }
    }
    
    console.log(`✅ Phone number dialed: ${phoneNumber}`);
  }

  /**
   * Initiate assisted transfer to another UC agent
   */
  async initiateAssistedTransfer(targetAgentId: string): Promise<AssistedTransferResult> {
    console.log(`Initiating assisted transfer to agent: ${targetAgentId}`);
    
    const startTime = new Date();
    
    await this.clickElement(this.transferButton);
    await this.clickElement(this.assistedTransferButton);
    
    // Select target agent
    await this.clickElement(this.agentSelector);
    const targetAgent = this.locator(`[data-agent-id="${targetAgentId}"]`);
    await this.clickElement(targetAgent);
    
    // Confirm transfer
    const confirmButton = this.locator('button:has-text("Confirm Transfer")');
    await this.clickElement(confirmButton);
    
    await this.waitForTimeout(5000, 'Assisted transfer processing');
    
    const result: AssistedTransferResult = {
      targetAgentId,
      transferType: 'assisted',
      transferInitiated: true,
      startTime,
      transferId: this.generateTransferId()
    };
    
    console.log(`✅ Assisted transfer initiated to agent: ${targetAgentId}`);
    return result;
  }

  /**
   * Initiate supervised transfer to skill
   */
  async initiateSupervisedTransferToSkill(skillNumber: string): Promise<SupervisedTransferResult> {
    console.log(`Initiating supervised transfer to skill: ${skillNumber}`);
    
    const startTime = new Date();
    
    await this.clickElement(this.transferButton);
    await this.clickElement(this.supervisedTransferButton);
    
    // Select target skill
    await this.clickElement(this.skillSelector);
    const targetSkill = this.locator(`[data-skill="${skillNumber}"]`);
    await this.clickElement(targetSkill);
    
    // Confirm supervised transfer
    const confirmButton = this.locator('button:has-text("Confirm Transfer")');
    await this.clickElement(confirmButton);
    
    await this.waitForTimeout(5000, 'Supervised transfer processing');
    
    const result: SupervisedTransferResult = {
      targetSkill: skillNumber,
      transferType: 'supervised',
      transferInitiated: true,
      startTime,
      transferId: this.generateTransferId()
    };
    
    console.log(`✅ Supervised transfer initiated to skill: ${skillNumber}`);
    return result;
  }

  /**
   * Hold active outbound call
   */
  async holdOutboundCall(): Promise<void> {
    console.log('Putting outbound call on hold...');
    
    await this.clickElement(this.holdButton);
    await this.waitForTimeout(2000, 'Hold processing');
    
    // Verify call is on hold
    const holdIndicator = this.locator('.call-on-hold, .hold-active');
    await this.expectVisible(holdIndicator);
    
    console.log('✅ Outbound call placed on hold');
  }

  /**
   * Resume held outbound call
   */
  async resumeOutboundCall(): Promise<void> {
    console.log('Resuming held outbound call...');
    
    const resumeButton = this.locator('.resume-button, button:has-text("Resume")');
    await this.clickElement(resumeButton);
    await this.waitForTimeout(2000, 'Resume processing');
    
    console.log('✅ Outbound call resumed');
  }

  /**
   * End outbound call
   */
  async endOutboundCall(): Promise<void> {
    console.log('Ending outbound call...');
    
    await this.clickElement(this.endCallButton);
    await this.waitForTimeout(3000, 'Call termination processing');
    
    // Verify call ended
    await this.expectHidden(this.activeCallIndicator);
    
    console.log('✅ Outbound call ended');
  }

  /**
   * Verify outbound call is active
   */
  async verifyOutboundCallActive(): Promise<void> {
    console.log('Verifying outbound call is active...');
    
    await this.expectVisible(this.activeCallIndicator);
    await this.expectVisible(this.callTimer);
    
    console.log('✅ Outbound call verified as active');
  }

  /**
   * Get call duration
   */
  async getCallDuration(): Promise<string> {
    const duration = await this.getTextContent(this.callTimer);
    console.log(`Call duration: ${duration}`);
    return duration;
  }

  /**
   * Verify skill is selected for call
   */
  async verifySkillSelected(skillNumber: string): Promise<void> {
    console.log(`Verifying skill ${skillNumber} is selected...`);
    
    const selectedSkill = this.locator(`.selected-skill:has-text("${skillNumber}")`);
    await this.expectVisible(selectedSkill);
    
    console.log(`✅ Skill ${skillNumber} verified as selected`);
  }

  /**
   * Verify no skill is selected
   */
  async verifyNoSkillSelected(): Promise<void> {
    console.log('Verifying no skill is selected...');
    
    const noSkillIndicator = this.locator('.no-skill-selected, .skill-none');
    await this.expectVisible(noSkillIndicator);
    
    console.log('✅ Verified no skill is selected');
  }

  /**
   * Execute complete outbound call workflow
   */
  async executeOutboundCallWorkflow(config: OutboundCallWorkflowConfig): Promise<OutboundCallWorkflowResult> {
    console.log(`Executing outbound call workflow: ${config.workflowType}`);
    
    const startTime = new Date();
    const steps: OutboundCallStep[] = [];
    
    // Step 1: Initiate call
    let callResult: OutboundCallResult;
    if (config.skillNumber) {
      callResult = await this.initiateOutboundCallWithSkill(config.phoneNumber, config.skillNumber);
    } else {
      callResult = await this.initiateOutboundCallWithoutSkill(config.phoneNumber);
    }
    
    steps.push({
      step: 'call_initiated',
      timestamp: new Date(),
      success: callResult.callInitiated,
      details: callResult
    });
    
    // Step 2: Call actions
    if (config.callActions) {
      for (const action of config.callActions) {
        try {
          await this.performOutboundCallAction(action);
          steps.push({
            step: action.type,
            timestamp: new Date(),
            success: true,
            details: action
          });
        } catch (error) {
          steps.push({
            step: action.type,
            timestamp: new Date(),
            success: false,
            details: { ...action, error: error.message }
          });
        }
      }
    }
    
    const endTime = new Date();
    
    const result: OutboundCallWorkflowResult = {
      workflowType: config.workflowType,
      phoneNumber: config.phoneNumber,
      skillNumber: config.skillNumber,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      steps,
      callResult,
      success: steps.every(step => step.success)
    };
    
    console.log(`✅ Outbound call workflow completed: ${config.workflowType} (${result.success ? 'SUCCESS' : 'FAILED'})`);
    return result;
  }

  /**
   * Perform specific outbound call action
   */
  private async performOutboundCallAction(action: OutboundCallAction): Promise<void> {
    switch (action.type) {
      case 'hold':
        await this.holdOutboundCall();
        break;
      case 'resume':
        await this.resumeOutboundCall();
        break;
      case 'end':
        await this.endOutboundCall();
        break;
      case 'assisted_transfer':
        if (action.targetAgent) {
          await this.initiateAssistedTransfer(action.targetAgent);
        }
        break;
      case 'supervised_transfer':
        if (action.targetSkill) {
          await this.initiateSupervisedTransferToSkill(action.targetSkill);
        }
        break;
      default:
        console.warn(`Unknown outbound call action: ${action.type}`);
    }
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `outbound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique transfer ID
   */
  private generateTransferId(): string {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup agent for outbound calling
   */
  async setupForOutboundCalling(skillNumber?: string): Promise<OutboundCallSetup> {
    console.log('Setting up agent for outbound calling...');
    
    const setup: OutboundCallSetup = {
      agentReady: true,
      skillSelected: skillNumber || null,
      outboundCapable: true,
      setupTime: new Date()
    };
    
    if (skillNumber) {
      await this.selectSkillForOutboundCall(skillNumber);
      setup.skillSelected = skillNumber;
    }
    
    console.log(`✅ Agent setup completed for outbound calling${skillNumber ? ` with skill ${skillNumber}` : ''}`);
    return setup;
  }

  /**
   * Generate outbound phone number for testing
   */
  static generateOutboundNumber(): string {
    // Generate a test phone number (similar to getOutBoundNumber function)
    const areaCode = '555';
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}${exchange}${number}`;
  }
}

/**
 * WebRTC Outbound Call Page - Handles WebRTC-specific outbound call functionality
 * Manages WebRTC agent outbound calls with skill selection and transfer capabilities
 */
export class WebRTCOutboundCallPage extends UCOutboundCallPage {
  
  // WebRTC specific elements
  private readonly webrtcCallInterface = this.locator('.webrtc-call-interface');
  private readonly channelControls = this.locator('.channel-controls');
  private readonly voiceChannelOnly = this.locator('.voice-channel-only');
  
  // Channel management elements
  private readonly chatChannelToggle = this.locator('.ready [data-mat-icon-name="chat"]');
  private readonly emailChannelToggle = this.locator('.ready [data-mat-icon-name="email"]');
  private readonly disabledChatChannel = this.locator('.channels-disabled [data-mat-icon-name="chat"]');
  private readonly disabledEmailChannel = this.locator('.channels-disabled [data-mat-icon-name="email"]');
  private readonly activeEmailTile = this.getByDataCy('active-media-tile-EMAIL');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Configure WebRTC agent for voice-only outbound calls
   */
  async configureVoiceOnlyMode(): Promise<void> {
    console.log('Configuring WebRTC agent for voice-only mode...');
    
    // Disable chat channel
    await this.clickElement(this.chatChannelToggle);
    await this.expectVisible(this.disabledChatChannel);
    
    // Disable email channel if possible
    try {
      await this.clickElement(this.emailChannelToggle, { timeout: 10000 });
      await this.expectVisible(this.disabledEmailChannel);
    } catch {
      // Check if there's an active email
      await this.expectVisible(this.activeEmailTile);
      console.log('Email channel has active session, cannot disable');
    }
    
    console.log('✅ WebRTC agent configured for voice-only mode');
  }

  /**
   * Setup WebRTC agent for outbound calling with channel configuration
   */
  async setupWebRTCForOutboundCalling(skillNumber?: string): Promise<WebRTCOutboundSetup> {
    console.log('Setting up WebRTC agent for outbound calling...');
    
    // Configure voice-only mode
    await this.configureVoiceOnlyMode();
    
    // Call parent setup method
    const baseSetup = await this.setupForOutboundCalling(skillNumber);
    
    const webrtcSetup: WebRTCOutboundSetup = {
      ...baseSetup,
      webrtcConfigured: true,
      voiceOnlyMode: true,
      channelsDisabled: ['chat', 'email']
    };
    
    console.log(`✅ WebRTC agent setup completed for outbound calling`);
    return webrtcSetup;
  }

  /**
   * Verify WebRTC outbound call interface
   */
  async verifyWebRTCOutboundInterface(): Promise<void> {
    console.log('Verifying WebRTC outbound call interface...');
    
    await this.expectVisible(this.webrtcCallInterface);
    await this.expectVisible(this.channelControls);
    
    console.log('✅ WebRTC outbound call interface verified');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface OutboundCallResult {
  phoneNumber: string;
  skillSelected: string | null;
  callInitiated: boolean;
  startTime: Date;
  callId: string;
}

export interface AssistedTransferResult {
  targetAgentId: string;
  transferType: 'assisted';
  transferInitiated: boolean;
  startTime: Date;
  transferId: string;
}

export interface SupervisedTransferResult {
  targetSkill: string;
  transferType: 'supervised';
  transferInitiated: boolean;
  startTime: Date;
  transferId: string;
}

export interface OutboundCallSetup {
  agentReady: boolean;
  skillSelected: string | null;
  outboundCapable: boolean;
  setupTime: Date;
}

export interface WebRTCOutboundSetup extends OutboundCallSetup {
  webrtcConfigured: boolean;
  voiceOnlyMode: boolean;
  channelsDisabled: string[];
}

export interface OutboundCallWorkflowConfig {
  workflowType: string;
  phoneNumber: string;
  skillNumber?: string;
  callActions?: OutboundCallAction[];
}

export interface OutboundCallAction {
  type: 'hold' | 'resume' | 'end' | 'assisted_transfer' | 'supervised_transfer';
  targetAgent?: string;
  targetSkill?: string;
  delay?: number;
}

export interface OutboundCallStep {
  step: string;
  timestamp: Date;
  success: boolean;
  details: any;
}

export interface OutboundCallWorkflowResult {
  workflowType: string;
  phoneNumber: string;
  skillNumber?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  steps: OutboundCallStep[];
  callResult: OutboundCallResult;
  success: boolean;
}


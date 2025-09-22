import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * UC Agent Page - Handles Unified Communications agent functionality
 * Manages UC agent login, webphone integration, skill management, and call handling
 */
export class UCAgentPage extends BasePage {
  
  // UC Agent specific elements
  private readonly launcherSideNav = this.getByDataCy('sidenav-menu-LAUNCHER');
  private readonly agentClientLauncher = this.locator('text=Agent Client');
  
  // Skill management elements
  private readonly skillsSection = this.locator('.skills-section');
  private readonly skillToggle = this.locator('.skill-toggle');
  
  // Status management elements
  private readonly statusControls = this.locator('.status-controls');
  private readonly readyButton = this.locator('.ready-button, button:has-text("Ready")');
  private readonly busyButton = this.locator('.busy-button, button:has-text("Busy")');
  
  // Call handling elements
  private readonly incomingCallNotification = this.locator('.incoming-call');
  private readonly answerButton = this.locator('.answer-button, button:has-text("Answer")');
  private readonly endCallButton = this.locator('.end-call-button, button:has-text("End Call")');
  private readonly holdButton = this.locator('.hold-button, button:has-text("Hold")');
  
  // Transfer elements
  private readonly transferButton = this.locator('.transfer-button, button:has-text("Transfer")');
  private readonly agentSelector = this.locator('.agent-selector');
  private readonly blindTransferButton = this.locator('.blind-transfer-button');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Launch UC Agent Client from main interface
   */
  async launchAgentClient(): Promise<Page> {
    console.log('Launching UC Agent Client...');
    
    await this.waitForTimeout(5000, 'Page initialization');
    await this.hoverElement(this.launcherSideNav);
    await this.waitForTimeout(5000, 'Launcher menu activation');
    
    // Wait for popup and capture new page
    const [agentClientPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.clickElement(this.agentClientLauncher)
    ]);
    
    await agentClientPage.waitForLoadState();
    console.log('✅ UC Agent Client launched successfully');
    
    return agentClientPage;
  }

  /**
   * Toggle agent skills on/off
   */
  async toggleSkills(skillNumber: string, enabled: boolean = true): Promise<void> {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} skill ${skillNumber}...`);
    
    const skillElement = this.locator(`[data-skill="${skillNumber}"], .skill-${skillNumber}`);
    const isCurrentlyEnabled = await this.isChecked(skillElement);
    
    if (isCurrentlyEnabled !== enabled) {
      await this.clickElement(skillElement);
      console.log(`✅ Skill ${skillNumber} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.log(`Skill ${skillNumber} already ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Set agent status to Ready
   */
  async setStatusReady(): Promise<void> {
    console.log('Setting agent status to Ready...');
    
    await this.clickElement(this.readyButton);
    await this.waitForTimeout(2000, 'Status update processing');
    
    console.log('✅ Agent status set to Ready');
  }

  /**
   * Set agent status to Busy
   */
  async setStatusBusy(): Promise<void> {
    console.log('Setting agent status to Busy...');
    
    await this.clickElement(this.busyButton);
    await this.waitForTimeout(2000, 'Status update processing');
    
    console.log('✅ Agent status set to Busy');
  }

  /**
   * Answer incoming call
   */
  async answerCall(): Promise<void> {
    console.log('Answering incoming call...');
    
    await this.expectVisible(this.incomingCallNotification);
    await this.clickElement(this.answerButton);
    await this.waitForTimeout(3000, 'Call connection processing');
    
    console.log('✅ Call answered successfully');
  }

  /**
   * End active call
   */
  async endCall(): Promise<void> {
    console.log('Ending active call...');
    
    await this.clickElement(this.endCallButton);
    await this.waitForTimeout(2000, 'Call termination processing');
    
    console.log('✅ Call ended successfully');
  }

  /**
   * Hold active call
   */
  async holdCall(): Promise<void> {
    console.log('Putting call on hold...');
    
    await this.clickElement(this.holdButton);
    await this.waitForTimeout(2000, 'Hold processing');
    
    console.log('✅ Call placed on hold');
  }

  /**
   * Initiate blind transfer to another agent
   */
  async initiateBlindTransfer(targetAgentId: string): Promise<void> {
    console.log(`Initiating blind transfer to agent: ${targetAgentId}`);
    
    await this.clickElement(this.transferButton);
    await this.clickElement(this.agentSelector);
    
    const targetAgent = this.locator(`[data-agent-id="${targetAgentId}"]`);
    await this.clickElement(targetAgent);
    
    await this.clickElement(this.blindTransferButton);
    await this.waitForTimeout(3000, 'Transfer processing');
    
    console.log(`✅ Blind transfer initiated to agent: ${targetAgentId}`);
  }

  /**
   * Verify agent is logged in and ready
   */
  async verifyAgentReady(): Promise<void> {
    console.log('Verifying agent is ready...');
    
    // Check for agent dashboard elements
    const agentDashboard = this.locator('.agent-dashboard, .agent-interface');
    await this.expectVisible(agentDashboard);
    
    console.log('✅ Agent verified as ready');
  }

  /**
   * Verify call is active
   */
  async verifyCallActive(): Promise<void> {
    console.log('Verifying call is active...');
    
    const activeCall = this.locator('.active-call, .call-active');
    await this.expectVisible(activeCall);
    
    console.log('✅ Call verified as active');
  }

  /**
   * Verify call ended
   */
  async verifyCallEnded(): Promise<void> {
    console.log('Verifying call ended...');
    
    const noActiveCall = this.locator('.no-active-call, .call-ended');
    await this.expectVisible(noActiveCall);
    
    console.log('✅ Call verified as ended');
  }

  /**
   * Handle multi-agent coordination
   */
  async coordinateWithAgent(agentPage: Page, action: 'ready' | 'busy' | 'answer' | 'end'): Promise<void> {
    console.log(`Coordinating ${action} action with other agent...`);
    
    await agentPage.bringToFront();
    
    switch (action) {
      case 'ready':
        await this.setStatusReady();
        break;
      case 'busy':
        await this.setStatusBusy();
        break;
      case 'answer':
        await this.answerCall();
        break;
      case 'end':
        await this.endCall();
        break;
    }
    
    console.log(`✅ ${action} action coordinated with other agent`);
  }

  /**
   * Setup UC agent for call testing
   */
  async setupForCallTesting(skillNumber?: string): Promise<UCAgentCallSetup> {
    console.log('Setting up UC agent for call testing...');
    
    await this.verifyAgentReady();
    
    if (skillNumber) {
      await this.toggleSkills(skillNumber, true);
    }
    
    await this.setStatusReady();
    
    const setup: UCAgentCallSetup = {
      agentReady: true,
      skillsEnabled: skillNumber ? [skillNumber] : [],
      status: 'Ready',
      setupTime: new Date()
    };
    
    console.log(`✅ UC agent setup completed for call testing`);
    return setup;
  }

  /**
   * Execute complete UC agent workflow
   */
  async executeUCAgentWorkflow(config: UCAgentWorkflowConfig): Promise<UCAgentWorkflowResult> {
    console.log(`Executing UC agent workflow: ${config.workflowType}`);
    
    const startTime = new Date();
    const steps: UCAgentWorkflowStep[] = [];
    
    // Setup phase
    const setup = await this.setupForCallTesting(config.skillNumber);
    steps.push({
      step: 'setup',
      timestamp: new Date(),
      success: setup.agentReady,
      details: setup
    });
    
    // Call handling phase
    if (config.callActions) {
      for (const action of config.callActions) {
        try {
          await this.performCallAction(action);
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
    
    const result: UCAgentWorkflowResult = {
      workflowType: config.workflowType,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      steps,
      success: steps.every(step => step.success)
    };
    
    console.log(`✅ UC agent workflow completed: ${config.workflowType} (${result.success ? 'SUCCESS' : 'FAILED'})`);
    return result;
  }

  /**
   * Perform specific call action
   */
  private async performCallAction(action: CallAction): Promise<void> {
    switch (action.type) {
      case 'answer':
        await this.answerCall();
        break;
      case 'end':
        await this.endCall();
        break;
      case 'hold':
        await this.holdCall();
        break;
      case 'transfer':
        if (action.targetAgent) {
          await this.initiateBlindTransfer(action.targetAgent);
        }
        break;
      default:
        console.warn(`Unknown call action: ${action.type}`);
    }
  }
}

/**
 * UC Webphone Page - Handles UC webphone interface
 * Manages webphone login, call control, and integration
 */
export class UCWebphonePage extends BasePage {
  
  // Webphone login elements
  private readonly loginNameInput = this.locator('label:text-is("Login Name")+ div input');
  private readonly passwordInput = this.locator('label:text-is("Password")+ div input');
  private readonly loginButton = this.locator('button:text-is("Log In")');
  
  // Intro/setup elements
  private readonly nextButton = this.getByRole('button', { name: 'NEXT' });
  private readonly skipButton = this.getByRole('button', { name: 'SKIP' });
  
  // Call control elements
  private readonly dialpad = this.locator('.dialpad');
  private readonly callButton = this.locator('.call-button, button:has-text("Call")');
  private readonly muteButton = this.locator('.mute-button, button:has-text("Mute")');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Login to UC webphone
   */
  async loginToWebphone(username: string, password?: string): Promise<void> {
    console.log(`Logging into UC webphone: ${username}`);
    
    await this.page.goto('https://voice.ximasoftware.com/webphone/login');
    
    await this.fillField(this.loginNameInput, username);
    await this.fillField(this.passwordInput, password || process.env.WEBPHONE_PASSWORD || '');
    await this.clickElement(this.loginButton);
    
    // Handle intro screens
    await this.handleIntroScreens();
    
    console.log('✅ UC webphone login completed');
  }

  /**
   * Handle webphone intro screens
   */
  private async handleIntroScreens(): Promise<void> {
    console.log('Handling webphone intro screens...');
    
    try {
      // Multiple NEXT screens
      await this.clickElement(this.nextButton, { delay: 500 });
      await this.clickElement(this.nextButton, { delay: 500 });
      
      // Handle SKIP or additional NEXT
      try {
        await this.clickElement(this.skipButton, { delay: 500, timeout: 3000 });
        await this.clickElement(this.skipButton, { delay: 500 });
      } catch {
        await this.clickElement(this.nextButton, { delay: 500 });
      }
      
      await this.clickElement(this.nextButton, { delay: 500 });
    } catch (error) {
      console.log('Intro screens handling completed or not needed');
    }
    
    console.log('✅ Webphone intro screens handled');
  }

  /**
   * Verify webphone is ready
   */
  async verifyWebphoneReady(): Promise<void> {
    console.log('Verifying webphone is ready...');
    
    const webphoneInterface = this.locator('.webphone-interface, .webphone-ready');
    await this.expectVisible(webphoneInterface);
    
    console.log('✅ Webphone verified as ready');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface UCAgentCallSetup {
  agentReady: boolean;
  skillsEnabled: string[];
  status: string;
  setupTime: Date;
}

export interface UCAgentWorkflowConfig {
  workflowType: string;
  skillNumber?: string;
  callActions?: CallAction[];
}

export interface CallAction {
  type: 'answer' | 'end' | 'hold' | 'transfer';
  targetAgent?: string;
  delay?: number;
}

export interface UCAgentWorkflowStep {
  step: string;
  timestamp: Date;
  success: boolean;
  details: any;
}

export interface UCAgentWorkflowResult {
  workflowType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  steps: UCAgentWorkflowStep[];
  success: boolean;
}


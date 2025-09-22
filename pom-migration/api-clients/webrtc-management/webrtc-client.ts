import { Page, BrowserContext } from '@playwright/test';
import { AgentDashboardPage } from '../../pages/agent/agent-dashboard-page';
import { WebRTCCallPage } from '../../pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pages/supervisor/supervisor-view-page';
import { UserManagementPage } from '../../pages/admin/user-management-page';
import { LoginPage } from '../../pages/auth/login-page';
import { ChannelType } from '../../shared/types/core';

/**
 * WebRTC Management Client - High-level WebRTC operations and workflows
 * Provides comprehensive WebRTC testing capabilities including calls, transfers, and monitoring
 */
export class WebRTCClient {
  
  constructor(private readonly page: Page) {}

  /**
   * Create WebRTC page objects
   */
  async createCallPage(): Promise<WebRTCCallPage> {
    return new WebRTCCallPage(this.page);
  }

  async createDialpadPage(): Promise<WebRTCDialpadPage> {
    return new WebRTCDialpadPage(this.page);
  }

  async createSupervisorViewPage(): Promise<SupervisorViewPage> {
    return new SupervisorViewPage(this.page);
  }

  async createUserManagementPage(): Promise<UserManagementPage> {
    return new UserManagementPage(this.page);
  }

  /**
   * Setup WebRTC agent for testing
   */
  async setupWebRTCAgent(
    credentials: { username: string; password: string },
    skillNumber: string,
    options?: {
      enableVoice?: boolean;
      enableChat?: boolean;
      enableEmail?: boolean;
      cleanupExistingCalls?: boolean;
    }
  ): Promise<{ agentDash: AgentDashboardPage; agentName: string }> {
    
    const defaultOptions = {
      enableVoice: true,
      enableChat: false,
      enableEmail: false,
      cleanupExistingCalls: true,
      ...options
    };

    // Login as WebRTC agent
    const loginPage = await LoginPage.create(this.page);
    const agentDash = await loginPage.loginAsAgent(credentials);
    
    // Get agent name
    const agentName = await agentDash.getAgentName();
    
    // Cleanup existing calls if requested
    if (defaultOptions.cleanupExistingCalls) {
      await agentDash.cleanupActiveMedia();
    }
    
    // Enable specific skill
    await agentDash.enableSkill(skillNumber);
    await this.page.waitForTimeout(3000, 'Skill enablement');
    
    // Set agent to Ready status
    await agentDash.setReady();
    
    // Enable required channels
    if (defaultOptions.enableVoice) {
      await agentDash.enableChannel(ChannelType.VOICE);
    }
    
    if (defaultOptions.enableChat) {
      await agentDash.enableChannel(ChannelType.CHAT);
    }
    
    if (defaultOptions.enableEmail) {
      await agentDash.enableChannel(ChannelType.EMAIL);
    }
    
    // Wait for channel setup
    await this.page.waitForTimeout(4000, 'Channel setup');
    
    return { agentDash, agentName };
  }

  /**
   * Create outbound call workflow
   */
  async createOutboundCall(
    phoneNumber: string,
    skillNumber?: string
  ): Promise<{ callPage: WebRTCCallPage; dialpadPage: WebRTCDialpadPage }> {
    
    const dialpadPage = new WebRTCDialpadPage(this.page);
    const callPage = new WebRTCCallPage(this.page);
    
    // Make outbound call
    await dialpadPage.makeOutboundCall(phoneNumber, skillNumber);
    
    // Wait for call connection
    await callPage.waitForCallConnection();
    
    return { callPage, dialpadPage };
  }

  /**
   * Handle incoming call workflow
   */
  async handleIncomingCall(): Promise<WebRTCCallPage> {
    const callPage = new WebRTCCallPage(this.page);
    
    // Wait for and answer incoming call
    await callPage.waitForIncomingCall();
    await callPage.answerCall();
    await callPage.verifyCallActive();
    
    return callPage;
  }

  /**
   * Perform internal call between agents
   */
  async performInternalCall(
    callingAgentPage: Page,
    receivingAgentPage: Page,
    targetExtension: string
  ): Promise<{ callingCallPage: WebRTCCallPage; receivingCallPage: WebRTCCallPage }> {
    
    // Setup dialpad on calling agent
    const callingDialpadPage = new WebRTCDialpadPage(callingAgentPage);
    const callingCallPage = new WebRTCCallPage(callingAgentPage);
    
    // Make internal call
    await callingAgentPage.bringToFront();
    await callingDialpadPage.openNewCallDialog();
    await callingDialpadPage.dialExtension(targetExtension);
    
    // Verify connection is being established
    await callingCallPage.verifyConnecting();
    
    // Handle incoming call on receiving agent
    const receivingCallPage = new WebRTCCallPage(receivingAgentPage);
    await receivingAgentPage.bringToFront();
    await receivingCallPage.waitForIncomingCall();
    await receivingCallPage.answerCall();
    
    // Verify both sides are connected
    await callingAgentPage.bringToFront();
    await callingCallPage.verifyCallActive();
    
    await receivingAgentPage.bringToFront();
    await receivingCallPage.verifyCallActive();
    
    return { callingCallPage, receivingCallPage };
  }

  /**
   * Perform assisted transfer between agents
   */
  async performAssistedTransfer(
    transferringAgentPage: Page,
    receivingAgentPage: Page,
    targetExtension: string
  ): Promise<void> {
    
    const transferringCallPage = new WebRTCCallPage(transferringAgentPage);
    const transferringDialpadPage = new WebRTCDialpadPage(transferringAgentPage);
    const receivingCallPage = new WebRTCCallPage(receivingAgentPage);
    
    // Put call on hold
    await transferringAgentPage.bringToFront();
    await transferringCallPage.holdCall();
    await transferringCallPage.unholdCall();
    
    // Initiate transfer
    await transferringCallPage.initiateTransfer();
    
    // Dial target extension
    await transferringDialpadPage.dialExtension(targetExtension);
    
    // Confirm assisted transfer
    await transferringCallPage.confirmAssistedTransfer();
    
    // Handle transfer on receiving agent
    await receivingAgentPage.bringToFront();
    await receivingCallPage.waitForAssistedTransferAttempt();
    await receivingCallPage.answerCall();
    
    // Complete transfer on transferring agent
    await transferringAgentPage.bringToFront();
    await transferringCallPage.completeTransfer();
    
    // Verify transfer completed
    await receivingAgentPage.bringToFront();
    await receivingCallPage.verifyTransferCompleted();
  }

  /**
   * Setup multiple agents for transfer testing
   */
  async setupMultipleAgentsForTransfer(
    agents: Array<{ 
      credentials: { username: string; password: string }; 
      skillNumber: string;
      context: BrowserContext;
    }>
  ): Promise<Array<{ agentDash: AgentDashboardPage; agentName: string; page: Page }>> {
    
    const agentSetups = [];
    
    for (const agent of agents) {
      const agentPage = await agent.context.newPage();
      const webRTCClient = new WebRTCClient(agentPage);
      
      const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
        agent.credentials,
        agent.skillNumber
      );
      
      agentSetups.push({ agentDash, agentName, page: agentPage });
    }
    
    return agentSetups;
  }

  /**
   * Test call controls (mute, hold, etc.)
   */
  async testCallControls(callPage: WebRTCCallPage): Promise<void> {
    // Test mute functionality
    await callPage.testMuteFunctionality();
    
    // Test hold functionality  
    await callPage.testHoldFunctionality();
    
    // Verify all call controls are present
    await callPage.verifyCallControls();
  }

  /**
   * Monitor agent status with supervisor
   */
  async monitorAgentStatus(
    supervisorPage: Page,
    agentNames: string[]
  ): Promise<SupervisorViewPage> {
    
    const supervisorViewPage = new SupervisorViewPage(supervisorPage);
    await supervisorViewPage.monitorAgents(agentNames);
    
    return supervisorViewPage;
  }

  /**
   * Verify agent status in supervisor view
   */
  async verifyAgentStatusInSupervisorView(
    supervisorViewPage: SupervisorViewPage,
    agentName: string,
    expectedStatus: string
  ): Promise<void> {
    
    await supervisorViewPage.verifyAgentStatus(agentName, expectedStatus);
  }

  /**
   * Create agent workflow with email verification
   */
  async createAgentWorkflow(
    supervisorPage: Page,
    agentData: { name: string; email: string; extension: string },
    waitForMessage: (options: { after: Date; timeout: number }) => Promise<any>
  ): Promise<{ agent: typeof agentData; password: string }> {
    
    const userMgmtPage = new UserManagementPage(supervisorPage);
    await userMgmtPage.navigateToUserManagement();
    
    const creationTime = new Date();
    await userMgmtPage.createAgent(agentData);
    
    // Wait for welcome email
    console.log('Waiting for welcome email for:', agentData.email);
    const message = await waitForMessage({ after: creationTime, timeout: 240000 });
    
    if (!message.text.includes('Your account has been successfully created')) {
      throw new Error('Welcome email not received or invalid');
    }
    
    // Set up password
    const passwordContext = await supervisorPage.context().browser()?.newContext();
    if (!passwordContext) {
      throw new Error('Failed to create password context');
    }
    
    const passwordPage = await passwordContext.newPage();
    await passwordPage.waitForTimeout(2000);
    await passwordPage.goto(message.urls[0]);
    
    const password = userMgmtPage.generateSecurePassword();
    const passwordUserMgmt = new UserManagementPage(passwordPage);
    await passwordUserMgmt.setAgentPassword(password);
    
    return { agent: agentData, password };
  }

  /**
   * Complete call workflow with reporting
   */
  async completeCallWorkflow(
    callPage: WebRTCCallPage,
    options?: {
      testMute?: boolean;
      testHold?: boolean;
      endCall?: boolean;
    }
  ): Promise<void> {
    
    const defaultOptions = {
      testMute: true,
      testHold: true,
      endCall: true,
      ...options
    };
    
    // Verify call is active
    await callPage.verifyCallActive();
    await callPage.verifyCallDetails();
    
    // Test call controls if requested
    if (defaultOptions.testMute) {
      await callPage.testMuteFunctionality();
    }
    
    if (defaultOptions.testHold) {
      await callPage.testHoldFunctionality();
    }
    
    // End call if requested
    if (defaultOptions.endCall) {
      await callPage.completeEndCallWorkflow();
    }
  }

  /**
   * Verify call appears in Cradle to Grave report
   */
  async verifyCradleToGraveReport(
    supervisorPage: Page,
    agentName: string,
    expectedEvents: string[]
  ): Promise<void> {
    
    // Navigate to reports
    await supervisorPage.hover('[data-cy="sidenav-menu-REPORTS"]');
    await supervisorPage.click(':text("Cradle to Grave")');
    
    // Filter by agent
    await this.setupCradleToGraveFilters(supervisorPage, agentName);
    
    // Verify expected events are present
    for (const event of expectedEvents) {
      const eventElement = supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("${event}")`);
      await eventElement.waitFor({ state: 'visible', timeout: 30000 });
    }
  }

  /**
   * Setup Cradle to Grave report filters
   */
  private async setupCradleToGraveFilters(supervisorPage: Page, agentName: string): Promise<void> {
    // Setup media filter for calls
    try {
      await supervisorPage.click('[data-cy="configure-report-preview-parameter-MEDIA_SELECTION"] [data-cy="xima-preview-input-edit-button"]');
      await supervisorPage.waitForTimeout(1000);
      await supervisorPage.click('[data-cy="checkbox-tree-property-option"] :text("Calls")');
      await supervisorPage.waitForTimeout(1000);
      await supervisorPage.click('[data-cy="checkbox-tree-dialog-apply-button"]');
      await supervisorPage.waitForTimeout(1000);
    } catch {
      console.log('Media filter setup skipped');
    }
    
    // Setup agent filter
    try {
      await supervisorPage.click('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]');
    } catch {
      await supervisorPage.click('xima-header-add button');
      await supervisorPage.fill('[data-cy="xima-criteria-selector-search-input"]', 'Agent');
      await supervisorPage.click(':text("Agent")');
      await supervisorPage.click('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]');
    }
    
    // Select specific agent
    await supervisorPage.waitForTimeout(1000);
    await supervisorPage.fill('[data-cy="xima-list-select-search-input"]', agentName);
    await supervisorPage.waitForTimeout(1000);
    await supervisorPage.click(`[data-cy="xima-list-select-option"]:has-text("${agentName}"):visible`);
    await supervisorPage.waitForTimeout(1000);
    await supervisorPage.click('[data-cy="agents-roles-dialog-apply-button"]');
    await supervisorPage.waitForTimeout(1000);
    
    // Apply filters
    await supervisorPage.click('[data-cy="configure-cradle-to-grave-container-apply-button"]');
  }

  /**
   * Generate test phone number
   */
  generateTestPhoneNumber(): string {
    // Generate a test phone number (avoiding actual numbers)
    return '555' + Math.floor(Math.random() * 9000000 + 1000000).toString();
  }

  /**
   * Cleanup call sessions
   */
  async cleanupCallSessions(agentPage: Page): Promise<void> {
    const callPage = new WebRTCCallPage(agentPage);
    
    try {
      if (await callPage.isCallActive()) {
        await callPage.endCallWithCleanup();
      }
    } catch {
      console.log('No active calls to cleanup');
    }
  }

  /**
   * Wait for agent readiness
   */
  async waitForAgentReadiness(agentDash: AgentDashboardPage): Promise<void> {
    const status = await agentDash.getAgentStatus();
    if (status !== 'Ready') {
      await agentDash.setReady();
    }
    
    // Verify voice channel is enabled
    const voiceEnabled = await agentDash.isChannelEnabled(ChannelType.VOICE);
    if (!voiceEnabled) {
      await agentDash.enableChannel(ChannelType.VOICE);
    }
  }
}

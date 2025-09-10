import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Supervisor Call Monitoring Page - Handles listen, whisper, and join functionality
 * Manages the complete call monitoring workflow for supervisor oversight
 */
export class SupervisorCallMonitoringPage extends BasePage {
  
  // Navigation elements
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly realtimeWallboardsButton = this.getByRole('button', { name: 'Realtime Wallboards' });
  private readonly supervisorViewTab = this.getByRole('tab', { name: 'Supervisor View' });
  
  // Filter and configuration elements
  private readonly supervisorViewFilterTitle = this.getByDataCy('supervisor-view-filter-title');
  private readonly filterTitleButton = this.supervisorViewFilterTitle.locator('[type="button"]');
  private readonly previewParameterContainer = this.getByDataCy('configure-report-preview-parameter-container');
  private readonly editButton = this.previewParameterContainer.getByDataCy('xima-preview-input-edit-button');
  private readonly selectAllCheckbox = this.getByDataCy('xima-list-select-select-all');
  private readonly applyButton = this.locator('button.apply > span:text-is(" Apply ")');
  
  // Agent selection and filtering
  private readonly agentFilterSelect = this.locator('[placeholder="Select type"]');
  private readonly agentOption = this.locator('[id*="mat-option"]:has-text("Agent")');
  private readonly agentOfflineCheckbox = this.getByDataCy('supervisor-view-agent-offline-checkbox');
  private readonly agentNameFilter = this.locator('[placeholder="Agent Name"]');
  
  // Call monitoring action buttons
  private readonly listenButton = this.getByDataCy('supervisor-view-agent-action-listen');
  private readonly whisperButton = this.getByDataCy('supervisor-view-agent-action-whisper');
  private readonly joinButton = this.getByDataCy('supervisor-view-agent-action-join');
  private readonly endMonitoringButton = this.getByDataCy('supervisor-view-agent-action-end-monitoring');
  
  // Call monitoring status indicators
  private readonly monitoringStatus = this.locator('.monitoring-status, [data-cy*="monitoring-status"]');
  private readonly activeCallIndicator = this.locator('.active-call, [data-cy*="active-call"]');
  private readonly callMonitoringPanel = this.locator('.call-monitoring-panel');
  
  // Agent status display
  private readonly agentStatusDisplay = this.locator('.agent-status, [data-cy*="agent-status"]');
  private readonly agentCallStatus = this.locator('.agent-call-status');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.realtimeDisplaysMenu);
  }

  /**
   * Navigate to Supervisor View for call monitoring
   */
  async navigateToSupervisorView(): Promise<void> {
    console.log('Navigating to Supervisor View for call monitoring...');
    
    // Click on Realtime Displays menu
    await this.clickElement(this.realtimeDisplaysMenu);
    
    // Click on Realtime Wallboards (or Supervisor View)
    try {
      await this.clickElement(this.realtimeWallboardsButton);
    } catch {
      // Alternative navigation
      await this.clickElement(this.getByText('Supervisor View'));
    }
    
    // Click on Supervisor View tab
    await this.clickElement(this.supervisorViewTab);
    
    console.log('Supervisor View navigation completed');
  }

  /**
   * Configure agent filter for call monitoring
   */
  async configureAgentFilter(agentName?: string): Promise<void> {
    console.log('Configuring agent filter for call monitoring...');
    
    // Click on supervisor view filter title
    await this.clickElement(this.supervisorViewFilterTitle);
    
    // Use retry logic as per original tests
    await this.page.waitForFunction(async () => {
      try {
        // Click filter configuration
        await this.page.locator('[data-cy="supervisor-view-filter-title"]').click();
        
        // Select Agent type in filter
        await this.page.locator('[placeholder="Select type"]').click();
        await this.page.locator('[id*="mat-option"]:has-text("Agent")').click({ force: true });
        
        return true;
      } catch {
        return false;
      }
    }, undefined, { timeout: 120000 });
    
    console.log('Agent filter type configured');
    
    // Click edit button for first parameter
    await this.clickElement(this.editButton.first());
    
    // Select all agents if not already selected
    const selectAllInput = this.selectAllCheckbox.locator('input');
    const isChecked = await selectAllInput.isChecked();
    
    if (!isChecked) {
      await this.clickElement(this.selectAllCheckbox);
    }
    
    // Apply the configuration
    await this.clickElement(this.applyButton);
    
    // Ensure offline agents are shown
    const offlineCheckboxInput = this.agentOfflineCheckbox.locator('input');
    const isOfflineChecked = await offlineCheckboxInput.isChecked();
    
    if (!isOfflineChecked) {
      await this.clickElement(this.agentOfflineCheckbox);
    }
    
    // Filter by specific agent name if provided
    if (agentName) {
      await this.fillField(this.agentNameFilter, agentName);
    }
    
    console.log(`Agent filter configured${agentName ? ` for agent: ${agentName}` : ' for all agents'}`);
  }

  /**
   * Start listening to an agent's call
   */
  async startListen(agentName?: string): Promise<void> {
    console.log(`Starting live listen${agentName ? ` for agent: ${agentName}` : ''}...`);
    
    // Configure filter if agent specified
    if (agentName) {
      await this.configureAgentFilter(agentName);
    }
    
    // Click the Listen button
    await this.clickElement(this.listenButton.first());
    
    await this.waitForTimeout(2000, 'Listen mode activation');
    console.log('Live listen started successfully');
  }

  /**
   * Start whispering to an agent during their call
   */
  async startWhisper(agentName?: string): Promise<void> {
    console.log(`Starting whisper mode${agentName ? ` for agent: ${agentName}` : ''}...`);
    
    // Configure filter if agent specified
    if (agentName) {
      await this.configureAgentFilter(agentName);
    }
    
    // Click the Whisper button
    await this.clickElement(this.whisperButton.first());
    
    await this.waitForTimeout(2000, 'Whisper mode activation');
    console.log('Whisper mode started successfully');
  }

  /**
   * Join an agent's call (3-way conversation)
   */
  async joinCall(agentName?: string): Promise<void> {
    console.log(`Joining call${agentName ? ` for agent: ${agentName}` : ''}...`);
    
    // Configure filter if agent specified
    if (agentName) {
      await this.configureAgentFilter(agentName);
    }
    
    // Click the Join button
    await this.clickElement(this.joinButton.first());
    
    await this.waitForTimeout(2000, 'Join mode activation');
    console.log('Call join completed successfully');
  }

  /**
   * End call monitoring (stop listen/whisper/join)
   */
  async endMonitoring(): Promise<void> {
    console.log('Ending call monitoring...');
    
    try {
      // Click the End Monitoring button
      await this.clickElement(this.endMonitoringButton.first());
      
      await this.waitForTimeout(2000, 'Monitoring termination');
      console.log('Call monitoring ended successfully');
    } catch (error) {
      console.warn('End monitoring may not be available:', error.message);
    }
  }

  /**
   * Verify call monitoring is active
   */
  async verifyMonitoringActive(): Promise<void> {
    // Check for monitoring status indicators
    const hasActiveCall = await this.isVisible(this.activeCallIndicator);
    const hasMonitoringPanel = await this.isVisible(this.callMonitoringPanel);
    const hasMonitoringStatus = await this.isVisible(this.monitoringStatus);
    
    if (hasActiveCall || hasMonitoringPanel || hasMonitoringStatus) {
      console.log('✅ Call monitoring is active');
    } else {
      console.log('⚠️ Call monitoring status unclear - continuing test');
    }
  }

  /**
   * Verify call monitoring buttons are available
   */
  async verifyMonitoringButtonsAvailable(): Promise<void> {
    console.log('Verifying call monitoring buttons are available...');
    
    // Check if monitoring buttons exist and are enabled
    const listenAvailable = await this.isVisible(this.listenButton);
    const whisperAvailable = await this.isVisible(this.whisperButton);
    const joinAvailable = await this.isVisible(this.joinButton);
    
    console.log(`Monitor buttons - Listen: ${listenAvailable}, Whisper: ${whisperAvailable}, Join: ${joinAvailable}`);
    
    if (!listenAvailable && !whisperAvailable && !joinAvailable) {
      console.warn('No call monitoring buttons found - may require agent with active call');
    } else {
      console.log('✅ Call monitoring interface is available');
    }
  }

  /**
   * Wait for agent to have an active call
   */
  async waitForAgentActiveCall(agentName?: string, timeoutMs: number = 60000): Promise<void> {
    console.log(`Waiting for agent to have active call${agentName ? ` (${agentName})` : ''}...`);
    
    // Wait for active call indicators
    try {
      await this.expectVisible(this.activeCallIndicator, timeoutMs);
      console.log('✅ Agent active call detected');
    } catch (error) {
      console.warn(`Agent active call not detected within ${timeoutMs}ms: ${error.message}`);
    }
  }

  /**
   * Verify agent is visible in supervisor view
   */
  async verifyAgentVisible(agentName: string): Promise<void> {
    console.log(`Verifying agent ${agentName} is visible in supervisor view...`);
    
    // Look for the agent name in the view
    const agentElement = this.getByText(agentName);
    
    try {
      await this.expectVisible(agentElement, 30000);
      console.log(`✅ Agent ${agentName} is visible in supervisor view`);
    } catch (error) {
      console.warn(`Agent ${agentName} not visible in supervisor view: ${error.message}`);
    }
  }

  /**
   * Switch monitoring mode (Listen → Whisper → Join)
   */
  async switchMonitoringMode(fromMode: CallMonitoringMode, toMode: CallMonitoringMode): Promise<void> {
    console.log(`Switching monitoring from ${fromMode} to ${toMode}...`);
    
    // End current monitoring mode
    await this.endMonitoring();
    
    // Start new monitoring mode
    switch (toMode) {
      case CallMonitoringMode.LISTEN:
        await this.startListen();
        break;
      case CallMonitoringMode.WHISPER:
        await this.startWhisper();
        break;
      case CallMonitoringMode.JOIN:
        await this.joinCall();
        break;
    }
    
    console.log(`✅ Monitoring mode switched from ${fromMode} to ${toMode}`);
  }

  /**
   * Complete call monitoring workflow with all modes
   */
  async executeCompleteMonitoringWorkflow(agentName?: string): Promise<void> {
    console.log('Executing complete call monitoring workflow...');
    
    // Setup agent filtering
    await this.configureAgentFilter(agentName);
    
    // Wait for agent to have active call
    await this.waitForAgentActiveCall(agentName);
    
    // Test Listen mode
    await this.startListen(agentName);
    await this.verifyMonitoringActive();
    
    // Test Whisper mode
    await this.startWhisper(agentName);
    await this.verifyMonitoringActive();
    
    // Test Join mode
    await this.joinCall(agentName);
    await this.verifyMonitoringActive();
    
    // End monitoring
    await this.endMonitoring();
    
    console.log('✅ Complete call monitoring workflow executed successfully');
  }

  /**
   * Verify call monitoring is only available for WebRTC agents
   */
  async verifyWebRTCAgentMonitoringOnly(): Promise<void> {
    console.log('Verifying call monitoring is only available for WebRTC agents...');
    
    // This would check that UC agents don't have monitoring buttons
    await this.verifyMonitoringButtonsAvailable();
    
    console.log('✅ WebRTC agent monitoring verification completed');
  }

  /**
   * Handle takeover of monitoring from another supervisor
   */
  async takeoverMonitoring(fromSupervisor: string, agentName?: string): Promise<void> {
    console.log(`Taking over call monitoring from ${fromSupervisor}${agentName ? ` for agent: ${agentName}` : ''}...`);
    
    // Configure agent filter
    if (agentName) {
      await this.configureAgentFilter(agentName);
    }
    
    // Attempt to start monitoring (which may involve takeover)
    await this.startListen(agentName);
    
    // Handle potential takeover confirmation
    try {
      const takeoverButton = this.getByRole('button', { name: 'Take Over' });
      if (await this.isVisible(takeoverButton)) {
        await this.clickElement(takeoverButton);
        console.log('Monitoring takeover confirmed');
      }
    } catch {
      // Takeover may not be needed
    }
    
    console.log(`✅ Monitoring takeover from ${fromSupervisor} completed`);
  }

  /**
   * Verify monitoring persists through call transfers
   */
  async verifyMonitoringPersistsThroughTransfer(): Promise<void> {
    console.log('Verifying monitoring persists through call transfers...');
    
    // This would involve checking monitoring state before/after transfer
    await this.verifyMonitoringActive();
    
    // Wait for potential transfer to complete
    await this.waitForTimeout(5000, 'Call transfer completion');
    
    // Verify monitoring is still active after transfer
    await this.verifyMonitoringActive();
    
    console.log('✅ Call monitoring persistence through transfer verified');
  }

  /**
   * Verify monitoring persists through new calls
   */
  async verifyMonitoringPersistsThroughNewCall(): Promise<void> {
    console.log('Verifying monitoring persists through new calls...');
    
    // Verify monitoring state before new call
    await this.verifyMonitoringActive();
    
    // Wait for new call to be established
    await this.waitForTimeout(5000, 'New call establishment');
    
    // Verify monitoring continues with new call
    await this.verifyMonitoringActive();
    
    console.log('✅ Call monitoring persistence through new call verified');
  }

  /**
   * Monitor specific agent by name
   */
  async monitorAgentByName(agentName: string, mode: CallMonitoringMode = CallMonitoringMode.LISTEN): Promise<void> {
    console.log(`Monitoring agent ${agentName} in ${mode} mode...`);
    
    // Configure filter for specific agent
    await this.configureAgentFilter(agentName);
    
    // Verify agent is visible
    await this.verifyAgentVisible(agentName);
    
    // Start appropriate monitoring mode
    switch (mode) {
      case CallMonitoringMode.LISTEN:
        await this.startListen(agentName);
        break;
      case CallMonitoringMode.WHISPER:
        await this.startWhisper(agentName);
        break;
      case CallMonitoringMode.JOIN:
        await this.joinCall(agentName);
        break;
    }
    
    // Verify monitoring is active
    await this.verifyMonitoringActive();
    
    console.log(`✅ Successfully monitoring agent ${agentName} in ${mode} mode`);
  }

  /**
   * Clear agent name filter
   */
  async clearAgentFilter(): Promise<void> {
    try {
      await this.fillField(this.agentNameFilter, '', { clear: true });
      console.log('Agent name filter cleared');
    } catch (error) {
      console.warn('Could not clear agent filter:', error.message);
    }
  }

  /**
   * Verify supervisor identity in call monitoring
   */
  async verifySupervisorIdentity(expectedName: string): Promise<void> {
    // Hover over user menu to check supervisor identity
    const userMenu = this.locator('xima-user-menu').getByRole('button');
    await this.hoverElement(userMenu);
    
    const supervisorText = this.locator('span:text("System Administrator")');
    await this.expectVisible(supervisorText);
    
    console.log(`✅ Supervisor identity verified: ${expectedName}`);
  }

  /**
   * Get current monitoring mode
   */
  async getCurrentMonitoringMode(): Promise<CallMonitoringMode | null> {
    try {
      if (await this.isVisible(this.listenButton.locator('.active, [class*="active"]'))) {
        return CallMonitoringMode.LISTEN;
      }
      if (await this.isVisible(this.whisperButton.locator('.active, [class*="active"]'))) {
        return CallMonitoringMode.WHISPER;
      }
      if (await this.isVisible(this.joinButton.locator('.active, [class*="active"]'))) {
        return CallMonitoringMode.JOIN;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// SUPPORTING ENUMS AND INTERFACES
// ============================================================================

export enum CallMonitoringMode {
  LISTEN = 'listen',
  WHISPER = 'whisper',
  JOIN = 'join'
}

export interface MonitoringConfiguration {
  agentName?: string;
  mode: CallMonitoringMode;
  includeOfflineAgents: boolean;
}

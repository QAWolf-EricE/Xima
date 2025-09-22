import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Supervisor View Page - Real-time monitoring of agent status and activities
 * Used for monitoring agent states, call activities, and real-time supervision
 */
export class SupervisorViewPage extends BasePage {
  
  // Navigation
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly supervisorViewOption = this.getByText('Supervisor View');
  
  // Filter controls
  private readonly filterTitle = this.getByDataCy('supervisor-view-filter-title');
  private readonly filterButton = this.locator('#mat-button-toggle-5-button');
  private readonly typeSelector = this.locator('[placeholder="Select type"]');
  private readonly agentTypeOption = this.locator('[role="option"] span:has-text("Agent")');
  private readonly applyFilterButton = this.getByDataCy('supervisor-view-filter-apply-button');
  
  // Agent selection
  private readonly editButton = this.getByDataCy('xima-preview-input-edit-button');
  private readonly selectAllCheckbox = this.getByDataCy('xima-list-select-select-all');
  private readonly searchInput = this.getByDataCy('xima-list-select-search-input');
  private readonly agentOption = this.getByDataCy('xima-list-select-option');
  private readonly agentsDialogApply = this.getByDataCy('agents-roles-dialog-apply-button');
  
  // Agent status display
  private readonly agentStatusContainer = this.locator('app-agent-status');
  
  // Refresh dialog
  private readonly refreshDialog = this.locator('xima-dialog:has-text("Refresh Required")');
  private readonly refreshOkButton = this.getByRole('button', { name: 'Ok' });
  
  // Report parameters
  private readonly reportParameterContainer = this.locator('[data-cy="configure-report-preview-parameter-container"]');

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Navigate to Supervisor View
   */
  async navigateToSupervisorView(): Promise<void> {
    await this.hoverElement(this.realtimeDisplaysMenu);
    await this.clickElement(this.supervisorViewOption);
    
    // Wait for page to load
    await this.waitForTimeout(3000, 'Supervisor view loading');
  }

  /**
   * Setup agent filter for monitoring specific agents
   */
  async setupAgentFilter(agentNames: string[]): Promise<void> {
    // Open filter
    await this.clickElement(this.filterButton);
    
    // Select Agent type
    await this.clickElement(this.typeSelector);
    await this.clickElement(this.agentTypeOption, { force: true });
    
    await this.waitForTimeout(3000, 'Type selection');
    
    // Edit agent selection
    await this.clickElement(this.editButton.first());
    
    await this.waitForTimeout(3000, 'Agent selection dialog');
    
    // Handle select all checkbox state
    await this.handleSelectAllCheckbox();
    
    // Search and select specific agents
    for (const agentName of agentNames) {
      await this.selectSpecificAgent(agentName);
    }
    
    // Apply agent selection
    await this.clickElement(this.agentsDialogApply);
    
    // Apply filter
    await this.clickElement(this.applyFilterButton);
    
    // Handle refresh dialog if it appears
    await this.handleRefreshDialog();
  }

  /**
   * Handle select all checkbox to ensure clean state
   */
  private async handleSelectAllCheckbox(): Promise<void> {
    try {
      // Check if "0 Agents Selected" is visible
      await this.expectVisible(this.getByText('0 Agents Selected'), 3000);
    } catch {
      try {
        // If select all is checked, uncheck it
        const selectedCheckbox = this.locator('[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected');
        await this.expectVisible(selectedCheckbox, 3000);
        await this.waitForTimeout(1000);
        await this.clickElement(this.selectAllCheckbox);
      } catch (err) {
        console.log('Checkbox state handling:', err);
      }
      
      // Toggle select all to reset state
      await this.clickElement(this.selectAllCheckbox);
      await this.waitForTimeout(1000);
      await this.clickElement(this.selectAllCheckbox);
      await this.waitForTimeout(1000);
    }
  }

  /**
   * Search and select a specific agent
   */
  private async selectSpecificAgent(agentName: string): Promise<void> {
    // Clear and search for agent
    await this.fillField(this.searchInput, agentName, { clear: true });
    await this.waitForTimeout(1000, 'Search results');
    
    // Click first search result
    await this.clickElement(this.agentOption.first());
  }

  /**
   * Handle refresh dialog that appears after filter changes
   */
  private async handleRefreshDialog(): Promise<void> {
    try {
      await this.expectVisible(this.refreshDialog);
      await this.clickElement(this.refreshOkButton);
    } catch {
      console.log('No refresh dialog appeared');
    }
  }

  /**
   * Monitor specific agents
   */
  async monitorAgents(agentNames: string[]): Promise<void> {
    await this.navigateToSupervisorView();
    await this.setupAgentFilter(agentNames);
  }

  /**
   * Get agent status by name
   */
  async getAgentStatus(agentName: string): Promise<string> {
    const agentContainer = this.agentStatusContainer.filter({ hasText: agentName }).nth(0);
    return await this.getText(agentContainer);
  }

  /**
   * Verify agent has specific status
   */
  async verifyAgentStatus(agentName: string, expectedStatus: string): Promise<void> {
    const agentContainer = this.agentStatusContainer.filter({ hasText: agentName }).nth(0);
    await this.expectContainsText(agentContainer, expectedStatus);
  }

  /**
   * Wait for agent status change
   */
  async waitForAgentStatusChange(agentName: string, expectedStatus: string, timeoutMs: number = 30000): Promise<void> {
    const agentContainer = this.agentStatusContainer.filter({ hasText: agentName }).nth(0);
    
    await this.page.waitForFunction(
      (args) => {
        const element = document.querySelector(`app-agent-status:has-text("${args.agentName}")`);
        return element?.textContent?.includes(args.expectedStatus) || false;
      },
      { agentName, expectedStatus },
      { timeout: timeoutMs }
    );
  }

  /**
   * Get all visible agent statuses
   */
  async getAllAgentStatuses(): Promise<Array<{ name: string; status: string }>> {
    const agentContainers = await this.agentStatusContainer.all();
    const statuses = [];
    
    for (const container of agentContainers) {
      const text = await container.textContent() || '';
      // Parse agent name and status from text
      const match = text.match(/(.*?)\s+(Ready|Talking|Hold|Lunch|Away|Busy)/);
      if (match) {
        statuses.push({
          name: match[1].trim(),
          status: match[2]
        });
      }
    }
    
    return statuses;
  }

  /**
   * Reset filters to show all agents
   */
  async resetFilters(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.clickElement(this.filterTitle);
    
    // Edit agent selection
    await this.clickElement(this.reportParameterContainer.locator(this.editButton).nth(0));
    
    // Select all agents
    await this.clickElement(this.selectAllCheckbox);
    await this.waitForTimeout(2000);
    
    // Apply changes
    await this.clickElement(this.locator('button.apply> span:text-is(" Apply ")'));
    await this.waitForTimeout(2000);
    
    await this.clickElement(this.applyFilterButton);
    
    // Handle refresh dialog
    await this.handleRefreshDialog();
  }

  /**
   * Verify supervisor view is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.filterTitle);
    await this.expectVisible(this.applyFilterButton);
  }

  /**
   * Setup monitoring for multiple agents with error handling
   */
  async setupMultiAgentMonitoring(agents: Array<{ name: string; number: string }>): Promise<void> {
    await this.navigateToSupervisorView();
    
    // Configure filter to show agents
    await expect(async () => {
      await this.clickElement(this.filterTitle);
      await this.clickElement(this.typeSelector);
      await this.clickElement(this.agentTypeOption, { force: true });
    }).toPass({ timeout: 120000 });
    
    await this.waitForTimeout(1000);
    
    // Edit agent selection
    await this.clickElement(this.reportParameterContainer.locator(this.editButton).nth(0));
    
    // Handle initial checkbox state
    let checkboxLocator = this.selectAllCheckbox.locator('input');
    let isChecked = await checkboxLocator.isChecked();
    
    if (!isChecked) {
      await checkboxLocator.click();
    }
    
    // Unselect all agents first
    checkboxLocator = this.selectAllCheckbox.locator('input');
    isChecked = await checkboxLocator.isChecked();
    
    if (isChecked) {
      await checkboxLocator.click();
    }
    
    // Select specific agents
    for (const agent of agents) {
      await this.fillField(this.searchInput, agent.name);
      await this.waitForTimeout(1000);
      await this.clickElement(this.agentOption.first());
    }
    
    // Apply selection
    await this.clickElement(this.agentsDialogApply);
    await this.clickElement(this.applyFilterButton);
    
    // Handle refresh
    await this.handleRefreshDialog();
  }

  /**
   * Monitor call activity for specific agent
   */
  async monitorAgentCallActivity(agentName: string): Promise<{ status: string; timestamp: Date }> {
    const status = await this.getAgentStatus(agentName);
    return {
      status,
      timestamp: new Date()
    };
  }

  /**
   * Wait for any agent status change
   */
  async waitForAnyStatusChange(agentNames: string[], timeoutMs: number = 30000): Promise<{ agent: string; status: string }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      for (const agentName of agentNames) {
        try {
          const status = await this.getAgentStatus(agentName);
          if (status.includes('Talking') || status.includes('Hold') || status.includes('Ringing')) {
            return { agent: agentName, status };
          }
        } catch {
          // Continue checking
        }
      }
      
      await this.waitForTimeout(1000, 'Status change polling');
    }
    
    throw new Error(`No status change detected for agents ${agentNames.join(', ')} within ${timeoutMs}ms`);
  }

  /**
   * Verify real-time updates are working
   */
  async verifyRealTimeUpdates(agentName: string): Promise<void> {
    const initialStatus = await this.getAgentStatus(agentName);
    
    // Wait for any status change to verify real-time functionality
    await this.page.waitForFunction(
      (args) => {
        const element = document.querySelector(`app-agent-status:has-text("${args.agentName}")`);
        const currentText = element?.textContent || '';
        return currentText !== args.initialStatus;
      },
      { agentName, initialStatus },
      { timeout: 60000 }
    );
  }
}
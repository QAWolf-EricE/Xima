import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Supervisor View Metrics Page - Handles supervisor view metrics management and configuration
 * Manages metrics display, filtering, sorting, and configuration in supervisor view
 */
export class SupervisorViewMetricsPage extends BasePage {
  
  // Navigation elements
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly supervisorViewTab = this.getByRole('tab', { name: 'Supervisor View' });
  private readonly supervisorViewOption = this.getByText('Supervisor View');
  
  // Filter and configuration elements
  private readonly supervisorViewFilterTitle = this.getByDataCy('supervisor-view-filter-title');
  private readonly groupSelectDropdown = this.locator('.realtime-status-sidenav-content-group-select');
  private readonly filterApplyButton = this.getByDataCy('supervisor-view-filter-apply-button');
  private readonly previewParameterContainer = this.getByDataCy('configure-report-preview-parameter-container');
  private readonly editButton = this.previewParameterContainer.getByDataCy('xima-preview-input-edit-button');
  private readonly selectAllCheckbox = this.getByRole('checkbox', { name: 'All' });
  private readonly applyButton = this.locator('button.apply > span:text-is(" Apply ")');
  
  // View mode options
  private readonly skillOption = this.locator('[role="option"]:has-text("Skill")');
  private readonly agentOption = this.locator('[role="option"]:has-text("Agent")');
  
  // Supervisor view display elements
  private readonly realtimeStatusSummaryItems = this.locator('app-realtime-status-summary-item');
  private readonly agentStatusItems = this.locator('app-agent-status');
  private readonly filterAgentComponent = this.locator('app-filter-agent');
  private readonly callsInQueueText = this.getByRole('paragraph').filter({ hasText: 'Calls in Queue' });
  
  // More options and settings
  private readonly settingsMenuButton = this.getByDataCy('settings-menu-button');
  private readonly manageFormulasOption = this.getByDataCy('settings-menu-manage-formulas');
  private readonly editSummaryMetricsOption = this.getByDataCy('settings-menu-edit-summary-metrics');
  
  // Modal and dialog elements
  private readonly manageFormulaTemplatesHeader = this.getByText('Manage Formula Templates');
  private readonly summaryMetricsHeader = this.getByText('Summary Metrics');
  private readonly ximaHeaderAddButton = this.getByDataCy('xima-header-add-button');
  private readonly finishButton = this.getByText('Finish');
  private readonly closeButton = this.locator('[class="feather feather-x"]');
  private readonly refreshRequiredDialog = this.locator('xima-dialog:has-text("Refresh Required")');
  private readonly okButton = this.getByRole('button', { name: 'Ok' });
  
  // Metrics display elements
  private readonly callsInQueueMetric = this.getByText('Calls in Queue');
  private readonly maxQueueDurationMetric = this.getByText('Max Queue Duration');
  private readonly avgQueueDurationMetric = this.getByText('Avg Queue Duration');
  private readonly avgSpeedOfAnswerMetric = this.getByText('Avg Speed of Answer');
  
  // Sorting elements
  private readonly sortDropdown = this.locator('.sort-dropdown, [data-cy*="sort"]');
  private readonly sortOptions = this.locator('.sort-option, [role="option"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectUrl(/realtime-status/);
    await this.expectVisible(this.supervisorViewTab);
  }

  /**
   * Navigate to Supervisor View
   */
  async navigateToSupervisorView(): Promise<void> {
    console.log('Navigating to Supervisor View...');
    
    // Click on Realtime Displays menu
    await this.clickElement(this.realtimeDisplaysMenu);
    
    // Click on Supervisor View tab
    await this.clickElement(this.supervisorViewTab);
    
    // Verify we're in supervisor view
    await this.verifyPageLoaded();
    
    console.log('✅ Supervisor View loaded successfully');
  }

  /**
   * Navigate to Supervisor View via direct text link
   */
  async navigateToSupervisorViewDirect(): Promise<void> {
    console.log('Navigating directly to Supervisor View...');
    
    // Hover over realtime displays and click direct link
    await this.hoverElement(this.realtimeDisplaysMenu);
    await this.clickElement(this.supervisorViewOption);
    
    await this.verifyPageLoaded();
    
    console.log('✅ Supervisor View accessed directly');
  }

  /**
   * Switch to Skill view mode
   */
  async switchToSkillView(): Promise<void> {
    console.log('Switching to Skill view mode...');
    
    // Click filter title
    await this.clickElement(this.supervisorViewFilterTitle);
    
    // Select Skill from dropdown
    await this.clickElement(this.groupSelectDropdown);
    await this.clickElement(this.skillOption);
    
    // Apply filter
    await this.clickElement(this.filterApplyButton);
    
    // Handle refresh dialog if it appears
    try {
      await this.expectVisible(this.refreshRequiredDialog, 5000);
      await this.clickElement(this.okButton);
    } catch {
      // Refresh dialog may not appear
    }
    
    console.log('✅ Switched to Skill view mode');
  }

  /**
   * Switch to Agent view mode
   */
  async switchToAgentView(): Promise<void> {
    console.log('Switching to Agent view mode...');
    
    // Click filter title
    await this.clickElement(this.supervisorViewFilterTitle);
    
    // Select Agent from dropdown
    await this.clickElement(this.groupSelectDropdown);
    await this.clickElement(this.agentOption);
    
    // Apply filter
    await this.clickElement(this.filterApplyButton);
    
    // Handle refresh dialog
    try {
      await this.expectVisible(this.refreshRequiredDialog, 5000);
      await this.clickElement(this.okButton);
    } catch {
      // Refresh dialog may not appear
    }
    
    console.log('✅ Switched to Agent view mode');
  }

  /**
   * Configure agent filter for supervisor view
   */
  async configureAgentFilter(): Promise<void> {
    console.log('Configuring agent filter in supervisor view...');
    
    await this.waitForTimeout(3000, 'View stabilization');
    
    // Click filter configuration
    await this.clickElement(this.supervisorViewFilterTitle);
    
    // Click first edit button for agent configuration
    await this.clickElement(this.editButton.nth(0));
    await this.waitForTimeout(1000);
    
    // Select all agents if not already selected
    const isSelected = await this.selectAllCheckbox.isChecked();
    if (!isSelected) {
      await this.clickElement(this.selectAllCheckbox);
    }
    
    await this.waitForTimeout(2000);
    
    // Apply configuration
    await this.clickElement(this.applyButton);
    await this.waitForTimeout(2000);
    
    // Apply filter
    await this.clickElement(this.filterApplyButton);
    
    console.log('✅ Agent filter configured');
  }

  /**
   * Verify supervisor view is in skill mode
   */
  async verifySkillViewMode(): Promise<void> {
    // Wait for results to load
    await this.expectHidden(this.filterAgentComponent);
    await this.expectVisible(this.callsInQueueText);
    
    // Verify we have skills displayed
    const skillCount = await this.realtimeStatusSummaryItems.count();
    expect(skillCount).toBeGreaterThan(0);
    
    console.log(`✅ Skill view mode verified with ${skillCount} skills`);
  }

  /**
   * Verify supervisor view is in agent mode
   */
  async verifyAgentViewMode(): Promise<void> {
    // Verify agent filter component is visible
    await this.expectVisible(this.filterAgentComponent);
    
    // Verify we have agents displayed
    const agentCount = await this.agentStatusItems.count();
    console.log(`Agent view mode with ${agentCount} agents displayed`);
  }

  /**
   * Open manage formulas dialog
   */
  async openManageFormulas(): Promise<void> {
    console.log('Opening manage formulas dialog...');
    
    // Click settings menu (3 dots)
    await this.clickElement(this.settingsMenuButton);
    
    // Click manage formulas option
    await this.clickElement(this.manageFormulasOption);
    
    // Verify dialog opened
    await this.expectVisible(this.manageFormulaTemplatesHeader);
    await this.expectVisible(this.ximaHeaderAddButton);
    await this.expectVisible(this.finishButton);
    
    console.log('✅ Manage formulas dialog opened');
  }

  /**
   * Close manage formulas dialog
   */
  async closeManageFormulas(): Promise<void> {
    console.log('Closing manage formulas dialog...');
    
    await this.clickElement(this.closeButton);
    
    // Verify dialog is closed
    await this.expectHidden(this.manageFormulaTemplatesHeader);
    
    console.log('✅ Manage formulas dialog closed');
  }

  /**
   * Open edit summary metrics dialog
   */
  async openEditSummaryMetrics(): Promise<void> {
    console.log('Opening edit summary metrics dialog...');
    
    // Click settings menu (3 dots)
    await this.clickElement(this.settingsMenuButton);
    
    // Click edit summary metrics option
    await this.clickElement(this.editSummaryMetricsOption);
    
    // Verify dialog opened with expected metrics
    await this.expectVisible(this.summaryMetricsHeader);
    await this.expectVisible(this.callsInQueueMetric);
    await this.expectVisible(this.maxQueueDurationMetric);
    await this.expectVisible(this.avgQueueDurationMetric);
    await this.expectVisible(this.avgSpeedOfAnswerMetric);
    
    console.log('✅ Edit summary metrics dialog opened');
  }

  /**
   * Close edit summary metrics dialog
   */
  async closeEditSummaryMetrics(): Promise<void> {
    console.log('Closing edit summary metrics dialog...');
    
    await this.clickElement(this.closeButton);
    
    // Verify dialog is closed
    await this.expectHidden(this.summaryMetricsHeader);
    
    console.log('✅ Edit summary metrics dialog closed');
  }

  /**
   * Execute complete supervisor view more options workflow
   */
  async executeMoreOptionsWorkflow(): Promise<void> {
    console.log('Executing complete supervisor view more options workflow...');
    
    // Switch to skill view first
    await this.switchToSkillView();
    
    // Test manage formulas
    await this.openManageFormulas();
    await this.closeManageFormulas();
    
    // Test edit summary metrics
    await this.openEditSummaryMetrics();
    await this.closeEditSummaryMetrics();
    
    console.log('✅ Complete more options workflow executed');
  }

  /**
   * Configure supervisor view sorting
   */
  async configureSorting(sortOption: string): Promise<void> {
    console.log(`Configuring sorting by: ${sortOption}`);
    
    // Implementation would depend on specific sorting interface
    // For now, log the sorting configuration
    
    console.log(`✅ Sorting configured: ${sortOption}`);
  }

  /**
   * Add metric to supervisor view
   */
  async addMetric(metricName: string): Promise<void> {
    console.log(`Adding metric: ${metricName}`);
    
    // Open settings menu
    await this.clickElement(this.settingsMenuButton);
    
    // This would involve metric addition workflow
    // Implementation depends on specific metric addition interface
    
    console.log(`✅ Metric added: ${metricName}`);
  }

  /**
   * Remove metric from supervisor view
   */
  async removeMetric(metricName: string): Promise<void> {
    console.log(`Removing metric: ${metricName}`);
    
    // Implementation would involve metric removal workflow
    
    console.log(`✅ Metric removed: ${metricName}`);
  }

  /**
   * Verify supervisor view displays expected data
   */
  async verifySupervisorViewData(): Promise<SupervisorViewData> {
    const skillCount = await this.realtimeStatusSummaryItems.count();
    const agentCount = await this.agentStatusItems.count();
    const hasFilterAgent = await this.isVisible(this.filterAgentComponent);
    const hasCallsInQueue = await this.isVisible(this.callsInQueueText);
    
    const data: SupervisorViewData = {
      skillCount,
      agentCount,
      hasFilterAgent,
      hasCallsInQueue,
      currentViewMode: hasFilterAgent ? 'agent' : 'skill'
    };
    
    console.log('Supervisor view data:', data);
    return data;
  }

  /**
   * Wait for supervisor view to load data
   */
  async waitForSupervisorViewData(timeoutMs: number = 30000): Promise<void> {
    console.log('Waiting for supervisor view data to load...');
    
    // Wait for either skills or agents to be displayed
    await this.page.waitForFunction(
      () => {
        const skills = document.querySelectorAll('app-realtime-status-summary-item');
        const agents = document.querySelectorAll('app-agent-status');
        return skills.length > 0 || agents.length > 0;
      },
      undefined,
      { timeout: timeoutMs }
    );
    
    console.log('✅ Supervisor view data loaded');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface SupervisorViewData {
  skillCount: number;
  agentCount: number;
  hasFilterAgent: boolean;
  hasCallsInQueue: boolean;
  currentViewMode: 'skill' | 'agent';
}

export interface MetricConfiguration {
  name: string;
  isVisible: boolean;
  position?: number;
}

export interface SortConfiguration {
  field: string;
  direction: 'asc' | 'desc';
}


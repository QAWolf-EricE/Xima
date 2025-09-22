import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Reports Navigation Page - Handles sidebar navigation and report access
 * Manages navigation between different report sections and sidebar interactions
 */
export class ReportsNavigationPage extends BasePage {
  
  // Sidebar navigation elements
  private readonly reportsSidebarMenu = this.getByDataCy('sidenav-menu-REPORTS');
  private readonly reportsIcon = this.locator('[data-mat-icon-name="reports"]');
  
  // Navigation menu items
  private readonly myReportsLink = this.locator(':text("My Reports")');
  private readonly cradleToGraveLink = this.locator('button:has-text("Cradle to grave")');
  private readonly createReportButton = this.locator('button :text-is("Create Report")');
  
  // Page verification elements
  private readonly homeTitle = this.locator('[translationset="HOME_TITLE"]');
  private readonly toolbarTitle = this.locator('.toolbar-title');
  private readonly reportsListReportName = this.getByDataCy('reports-list-report-name');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyReportsPageLoaded(): Promise<void> {
    await this.expectText(this.homeTitle, 'Reports');
    console.log('✅ Reports page loaded and verified');
  }

  /**
   * Navigate to My Reports via sidebar hover
   */
  async navigateToMyReportsFromSidebar(): Promise<void> {
    console.log('Navigating to My Reports from sidebar...');
    
    await this.hoverElement(this.reportsSidebarMenu);
    await this.clickElement(this.myReportsLink);
    
    // Verify navigation to My Reports
    const currentURL = this.page.url();
    const urlPath = currentURL.split(".com")[1];
    if (urlPath !== "/web/reports/all") {
      throw new Error(`Expected to navigate to /web/reports/all but got: ${urlPath}`);
    }
    
    console.log('✅ Successfully navigated to My Reports from sidebar');
  }

  /**
   * Navigate to Cradle to Grave via sidebar hover
   */
  async navigateToCradleToGraveFromSidebar(): Promise<void> {
    console.log('Navigating to Cradle to Grave from sidebar...');
    
    await this.hoverElement(this.reportsIcon);
    await this.clickElement(this.cradleToGraveLink);
    
    // Click Apply button to proceed to Cradle to Grave page
    const applyButton = this.locator('button:has-text("Apply")');
    await this.clickElement(applyButton);
    
    // Verify navigation to Cradle to Grave
    await this.expectUrl(/cradle-to-grave/);
    await this.expectText(this.toolbarTitle, 'Cradle to Grave');
    
    console.log('✅ Successfully navigated to Cradle to Grave from sidebar');
  }

  /**
   * Navigate to Create Custom Report
   */
  async navigateToCreateCustomReport(): Promise<CustomReportPage> {
    console.log('Navigating to Create Custom Report...');
    
    await this.hoverElement(this.reportsSidebarMenu);
    
    // Wait for reports list to load
    await this.expectVisible(this.reportsListReportName, 60000);
    
    await this.clickElement(this.createReportButton);
    
    // Verify navigation to custom report creation
    await this.expectUrl(/\/custom-report\/create/);
    
    console.log('✅ Successfully navigated to Create Custom Report');
    
    return new CustomReportPage(this.page, this.baseUrl);
  }

  /**
   * Hover over reports menu to reveal options
   */
  async hoverOverReportsMenu(): Promise<void> {
    console.log('Hovering over reports menu...');
    await this.hoverElement(this.reportsSidebarMenu);
    console.log('✅ Reports menu hover activated');
  }

  /**
   * Hover over reports icon to reveal options
   */
  async hoverOverReportsIcon(): Promise<void> {
    console.log('Hovering over reports icon...');
    await this.hoverElement(this.reportsIcon);
    console.log('✅ Reports icon hover activated');
  }

  /**
   * Verify specific URL path after navigation
   */
  async verifyUrlPath(expectedPath: string): Promise<void> {
    const currentURL = this.page.url();
    const urlPath = currentURL.split(".com")[1];
    
    if (urlPath !== expectedPath) {
      throw new Error(`Expected URL path ${expectedPath} but got: ${urlPath}`);
    }
    
    console.log(`✅ URL path verified: ${expectedPath}`);
  }

  /**
   * Wait for reports to load before navigation
   */
  async waitForReportsToLoad(): Promise<void> {
    console.log('Waiting for reports to load...');
    await this.expectVisible(this.reportsListReportName, 60000);
    console.log('✅ Reports loaded successfully');
  }
}

/**
 * Custom Report Creation Page
 * Handles the complex workflow of creating custom reports
 */
export class CustomReportPage extends BasePage {
  
  // Header and navigation
  private readonly customReportHeader = this.getByDataCy('custom-report-header');
  
  // Row selection elements
  private readonly accountCodeRadio = this.getByDataCy('custom-report-row-selection-radio-button-ACCOUNT_CODE');
  private readonly rowSelectionNextButton = this.getByDataCy('custom-report-row-selection-next-button');
  
  // Preview configuration elements
  private readonly previewConfigurationButton = this.getByRole('button', { name: 'Preview Configuration' });
  private readonly liveReportingCheckbox = this.getByRole('checkbox', { name: 'Live Reporting' });
  private readonly applyButton = this.getByRole('button', { name: 'Apply' });
  
  // Column configuration elements
  private readonly columnConfigTabGroup = this.getByDataCy('custom-report-column-configuration-tab-group');
  private readonly predefinedTab = this.columnConfigTabGroup.locator(':text("Predefined")');
  private readonly customizableTab = this.columnConfigTabGroup.locator(':text-is("Customizable")');
  
  // Metrics and column elements
  private readonly metricsSelect = this.columnConfigTabGroup.locator('mat-select');
  private readonly metricsList = this.locator('.metric-list');
  private readonly columnHeaderInput = this.locator('[placeholder="Enter column header"] input');
  private readonly operatorSelect = this.getByDataCy('xima-select-container');
  private readonly addColumnButton = this.getByDataCy('custom-report-column-configuration-container-add-column-button');
  
  // Save report elements
  private readonly saveReportButton = this.getByDataCy('custom-report-save-report-button');
  private readonly reportNameInput = this.locator('[placeholder="Enter report name"] input');
  private readonly reportDescriptionTextarea = this.locator('[placeholder="Enter report description"] textarea');
  private readonly saveButton = this.locator('button:has-text("Save")');
  
  // Status indicators
  private readonly gatheringDataIndicator = this.locator(':text("Gathering Data")');
  private readonly calculatingDataIndicator = this.locator(':text("Calculating Data")');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyCustomReportPageLoaded(): Promise<void> {
    await this.expectUrl(/\/custom-report\/create/);
    await this.expectText(this.customReportHeader, 'Custom Reports');
    console.log('✅ Custom Report page loaded and verified');
  }

  /**
   * Complete custom report creation workflow
   */
  async createCustomReport(config: CustomReportConfig): Promise<void> {
    console.log(`Creating custom report: ${config.name}`);
    
    // Step 1: Select row configuration
    await this.selectRowConfiguration();
    
    // Step 2: Configure preview
    await this.configurePreview();
    
    // Step 3: Add predefined column
    if (config.predefinedColumn) {
      await this.addPredefinedColumn(config.predefinedColumn);
    }
    
    // Step 4: Add customizable column
    if (config.customizableColumn) {
      await this.addCustomizableColumn(config.customizableColumn);
    }
    
    // Step 5: Save the report
    await this.saveReport(config);
    
    console.log(`✅ Custom report created successfully: ${config.name}`);
  }

  /**
   * Select account code row configuration
   */
  async selectRowConfiguration(): Promise<void> {
    console.log('Selecting row configuration...');
    
    await this.clickElement(this.accountCodeRadio);
    await this.clickElement(this.rowSelectionNextButton);
    
    console.log('✅ Row configuration selected');
  }

  /**
   * Configure preview settings
   */
  async configurePreview(): Promise<void> {
    console.log('Configuring preview settings...');
    
    // Wait for preview configuration button and click it
    await this.expectVisible(this.previewConfigurationButton);
    await this.clickElement(this.previewConfigurationButton);
    
    // Toggle on live reporting
    await this.checkCheckbox(this.liveReportingCheckbox);
    await this.clickElement(this.applyButton);
    
    // Wait for data gathering to complete
    await this.waitForDataProcessing('Gathering Data');
    
    // Verify account code button is visible
    const accountCodeButton = this.getByRole('button', { name: 'ACCOUNT CODE' });
    await this.expectVisible(accountCodeButton);
    
    console.log('✅ Preview configuration completed');
  }

  /**
   * Add predefined column
   */
  async addPredefinedColumn(config: PredefinedColumnConfig): Promise<void> {
    console.log(`Adding predefined column: ${config.metric}`);
    
    // Click predefined tab
    await this.clickElement(this.predefinedTab);
    
    // Select metric
    await this.clickElement(this.metricsSelect);
    await this.clickElement(this.metricsList.locator(`:text("${config.metric}")`));
    await this.clickElement(this.metricsList.locator('button:has-text("Done")'));
    
    // Set column header
    await this.fillField(this.columnHeaderInput, config.header);
    
    // Select operator if provided
    if (config.operator) {
      await this.clickElement(this.operatorSelect);
      const operatorOption = this.getByDataCy('xima-select-options').locator(`:text("${config.operator}")`);
      await this.clickElement(operatorOption);
    }
    
    // Add the column
    await this.clickElement(this.addColumnButton);
    
    // Wait for data calculation to complete
    await this.waitForDataProcessing('Calculating Data');
    
    console.log(`✅ Predefined column added: ${config.metric}`);
  }

  /**
   * Add customizable column
   */
  async addCustomizableColumn(config: CustomizableColumnConfig): Promise<void> {
    console.log(`Adding customizable column: ${config.metric}`);
    
    // Click customizable tab
    await this.clickElement(this.customizableTab);
    await this.waitForTimeout(1000, 'Tab loading');
    
    // Select metric
    await this.clickElement(this.metricsSelect);
    await this.clickElement(this.metricsList.locator(`:text("${config.metric}")`));
    await this.clickElement(this.metricsList.locator('button:has-text("Done")'));
    
    // Set column header
    await this.fillField(this.columnHeaderInput, config.header);
    
    // Add the column
    await this.clickElement(this.addColumnButton);
    
    // Wait for data calculation to complete
    await this.waitForDataProcessing('Calculating Data');
    
    console.log(`✅ Customizable column added: ${config.metric}`);
  }

  /**
   * Save the custom report
   */
  async saveReport(config: CustomReportConfig): Promise<void> {
    console.log('Saving custom report...');
    
    await this.clickElement(this.saveReportButton);
    
    // Fill report details
    await this.fillField(this.reportNameInput, config.name);
    
    if (config.description) {
      await this.fillField(this.reportDescriptionTextarea, config.description);
    }
    
    await this.clickElement(this.saveButton);
    
    console.log('✅ Custom report saved successfully');
  }

  /**
   * Wait for data processing to complete
   */
  async waitForDataProcessing(processType: 'Gathering Data' | 'Calculating Data'): Promise<void> {
    console.log(`Waiting for ${processType} to complete...`);
    
    const indicator = processType === 'Gathering Data' ? this.gatheringDataIndicator : this.calculatingDataIndicator;
    
    // Wait for indicator to appear
    await this.expectVisible(indicator, 120000);
    
    // Wait for indicator to disappear
    await this.expectHidden(indicator, 120000);
    
    console.log(`✅ ${processType} completed`);
  }

  /**
   * Generate unique column header name
   */
  static generateColumnHeader(prefix: string): string {
    const uniqueId = Date.now().toString().slice(-4);
    return `${prefix} ${uniqueId}`;
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface CustomReportConfig {
  name: string;
  description?: string;
  predefinedColumn?: PredefinedColumnConfig;
  customizableColumn?: CustomizableColumnConfig;
}

export interface PredefinedColumnConfig {
  metric: string;
  header: string;
  operator?: string;
}

export interface CustomizableColumnConfig {
  metric: string;
  header: string;
}


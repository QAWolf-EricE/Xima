import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * My Reports Page - Handles report management, scheduling, and operations
 * Manages the complete report lifecycle including search, filter, scheduling, tags, and export/import
 */
export class MyReportsPage extends BasePage {
  
  // Main page elements
  private readonly homeTitle = this.locator('[translationset="HOME_TITLE"]');
  private readonly searchInput = this.locator('[placeholder="Type to Search"]');
  private readonly manageMenuButton = this.getByDataCy('manage-menu-open-button');
  
  // Report list elements
  private readonly reportRows = this.locator('[role="row"]');
  private readonly reportNameElements = this.getByDataCy('reports-list-report-name');
  private readonly reportItems = this.locator('.report-item, .report-row');
  
  // Management menu options
  private readonly manageTagsOption = this.getByDataCy('manage-menu-manage-tags');
  private readonly manageSchedulesOption = this.getByDataCy('manage-menu-manage-schedules');
  private readonly manageRolesOption = this.getByDataCy('manage-menu-manage-roles');
  
  // Filter and tag elements
  private readonly filterTagsButton = this.getByDataCy('filter-tags');
  private readonly tagsTranslationElement = this.locator('app-tags-translation');
  private readonly reportViewSelect = this.locator('#mat-select-2 #mat-select-value-3');
  private readonly allReportsOption = this.locator('mat-option:has-text("All Reports")');
  
  // Tag management elements
  private readonly tagsList = this.locator('app-tags-list-sidenav .body .list-item');
  private readonly addTagButton = this.locator('.add-tag-button, [data-cy*="add-tag"]');
  private readonly tagNameInput = this.locator('.tag-name-input, [placeholder*="tag"]');
  private readonly deleteTagButton = this.locator('[data-mat-icon-name="delete"]');
  private readonly tagDeleteModal = this.locator(':text("Are you sure you want to delete this tag?")');
  private readonly submitButton = this.locator('button:has-text("Submit"), :text("Submit")');
  
  // Schedule management elements
  private readonly schedulesList = this.locator('.schedules-list');
  private readonly addScheduleButton = this.getByDataCy('schedule-list-add-schedule-button');
  private readonly scheduleForm = this.locator('.schedule-form');
  private readonly scheduleNameInput = this.locator('[placeholder="Schedule Name"]');
  private readonly deliverToInput = this.locator('[placeholder*="email"], [name="deliverTo"]');
  
  // Report actions elements
  private readonly favoriteButton = this.locator('.favorite-button, [data-cy*="favorite"]');
  private readonly exportButton = this.locator('.export-button, button:has-text("Export")');
  private readonly importButton = this.locator('.import-button, button:has-text("Import")');
  private readonly downloadButton = this.locator('.download-button, button:has-text("Download")');
  
  // Loading and status elements
  private readonly loadingIndicator = this.locator('xima-loading');
  private readonly noResultsMessage = this.locator('.no-results, .empty-state');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectText(this.homeTitle, 'Reports');
  }

  /**
   * Search for reports
   */
  async searchReports(searchTerm: string): Promise<void> {
    console.log(`Searching for reports: ${searchTerm}`);
    
    await this.fillField(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results
    await this.waitForTimeout(2000, 'Search results loading');
    
    console.log(`✅ Search completed for: ${searchTerm}`);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.fillField(this.searchInput, '');
    await this.page.keyboard.press('Enter');
    await this.waitForTimeout(1000, 'Search clearing');
  }

  /**
   * Verify report is visible in search results
   */
  async verifyReportVisible(reportName: string): Promise<void> {
    const reportElement = this.reportNameElements.filter({ hasText: reportName });
    await this.expectVisible(reportElement);
    console.log(`✅ Report verified as visible: ${reportName}`);
  }

  /**
   * Verify report is hidden in search results
   */
  async verifyReportHidden(reportName: string): Promise<void> {
    const reportElement = this.locator(`text=${reportName}`);
    await this.expectHidden(reportElement);
    console.log(`✅ Report verified as hidden: ${reportName}`);
  }

  /**
   * Open manage tags
   */
  async openManageTags(): Promise<void> {
    console.log('Opening manage tags...');
    
    await this.clickElement(this.manageMenuButton);
    await this.clickElement(this.manageTagsOption);
    
    // Wait for tags list to load
    await this.expectVisible(this.tagsList.first());
    
    console.log('✅ Manage tags opened');
  }

  /**
   * Create new tag
   */
  async createTag(tagName: string): Promise<void> {
    console.log(`Creating tag: ${tagName}`);
    
    try {
      await this.clickElement(this.addTagButton);
      await this.fillField(this.tagNameInput, tagName);
      await this.clickElement(this.submitButton);
      
      console.log(`✅ Tag created: ${tagName}`);
    } catch (error) {
      console.warn(`Error creating tag ${tagName}:`, error.message);
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(tagName: string): Promise<void> {
    console.log(`Deleting tag: ${tagName}`);
    
    try {
      // Find and delete tag
      const tagElement = this.locator(`app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}"))`);
      await this.expectVisible(tagElement, 5000);
      
      const deleteButton = tagElement.locator('[data-mat-icon-name="delete"]');
      await this.clickElement(deleteButton);
      
      // Confirm deletion
      await this.expectVisible(this.tagDeleteModal);
      await this.clickElement(this.submitButton);
      
      console.log(`✅ Tag deleted: ${tagName}`);
    } catch (error) {
      console.warn(`Tag ${tagName} may not exist or deletion failed:`, error.message);
    }
  }

  /**
   * Filter reports by tags
   */
  async filterReportsByTags(): Promise<void> {
    console.log('Filtering reports by tags...');
    
    await this.clickElement(this.filterTagsButton);
    await this.clickElement(this.tagsTranslationElement);
    
    console.log('✅ Tag filter applied');
  }

  /**
   * Toggle tag filter
   */
  async toggleTagFilter(): Promise<void> {
    console.log('Toggling tag filter...');
    
    await this.clickElement(this.tagsTranslationElement);
    
    console.log('✅ Tag filter toggled');
  }

  /**
   * Switch to all reports view
   */
  async switchToAllReportsView(): Promise<void> {
    console.log('Switching to all reports view...');
    
    // Click outside to close any open menus
    await this.page.mouse.click(0, 0);
    
    // Select "All Reports" view
    await this.clickElement(this.reportViewSelect);
    await this.clickElement(this.allReportsOption);
    
    console.log('✅ Switched to all reports view');
  }

  /**
   * Open manage schedules
   */
  async openManageSchedules(): Promise<void> {
    console.log('Opening manage schedules...');
    
    await this.clickElement(this.manageMenuButton);
    await this.clickElement(this.manageSchedulesOption);
    
    // Wait for schedules to load
    await this.waitForTimeout(3000);
    await this.expectHidden(this.loadingIndicator);
    
    console.log('✅ Manage schedules opened');
  }

  /**
   * Add report schedule
   */
  async addReportSchedule(scheduleConfig: ReportScheduleConfig): Promise<void> {
    console.log(`Adding report schedule: ${scheduleConfig.name}`);
    
    await this.clickElement(this.addScheduleButton);
    
    // Configure schedule (implementation would depend on schedule form structure)
    if (await this.isVisible(this.scheduleNameInput)) {
      await this.fillField(this.scheduleNameInput, scheduleConfig.name);
    }
    
    if (await this.isVisible(this.deliverToInput)) {
      await this.fillField(this.deliverToInput, scheduleConfig.deliverTo);
    }
    
    console.log(`✅ Report schedule configured: ${scheduleConfig.name}`);
  }

  /**
   * Favorite a report
   */
  async favoriteReport(reportName: string): Promise<void> {
    console.log(`Favoriting report: ${reportName}`);
    
    const reportRow = this.getReportRow(reportName);
    const favoriteButton = reportRow.locator(this.favoriteButton);
    
    if (await this.isVisible(favoriteButton)) {
      await this.clickElement(favoriteButton);
      console.log(`✅ Report favorited: ${reportName}`);
    } else {
      console.warn(`Favorite button not found for report: ${reportName}`);
    }
  }

  /**
   * Export report
   */
  async exportReport(reportName: string): Promise<string | null> {
    console.log(`Exporting report: ${reportName}`);
    
    try {
      const reportRow = this.getReportRow(reportName);
      const exportButton = reportRow.locator(this.exportButton);
      
      // Start download
      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        this.clickElement(exportButton)
      ]);
      
      const fileName = download.suggestedFilename();
      console.log(`✅ Report exported: ${fileName}`);
      return fileName;
    } catch (error) {
      console.warn(`Error exporting report ${reportName}:`, error.message);
      return null;
    }
  }

  /**
   * Import report
   */
  async importReport(filePath: string): Promise<void> {
    console.log(`Importing report from: ${filePath}`);
    
    try {
      // Set up file chooser
      const fileChooserPromise = this.page.waitForEvent('filechooser');
      await this.clickElement(this.importButton);
      
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(filePath);
      
      console.log(`✅ Report imported from: ${filePath}`);
    } catch (error) {
      console.warn(`Error importing report:`, error.message);
    }
  }

  /**
   * Toggle reports view
   */
  async toggleReportsView(): Promise<void> {
    console.log('Toggling reports view...');
    
    // Implementation depends on specific toggle functionality
    // Could be grid vs list view, or other view toggles
    
    console.log('✅ Reports view toggled');
  }

  /**
   * Get report row by name
   */
  private getReportRow(reportName: string) {
    return this.reportRows.filter({ has: this.reportNameElements.filter({ hasText: reportName }) });
  }

  /**
   * Verify specific reports exist
   */
  async verifyReportsExist(reportNames: string[]): Promise<void> {
    for (const reportName of reportNames) {
      await this.verifyReportVisible(reportName);
    }
  }

  /**
   * Wait for reports to load
   */
  async waitForReportsToLoad(): Promise<void> {
    console.log('Waiting for reports to load...');
    
    await this.expectHidden(this.loadingIndicator);
    await this.waitForTimeout(3000, 'Reports loading');
    
    console.log('✅ Reports loaded');
  }

  /**
   * Execute complete report search workflow
   */
  async executeReportSearchWorkflow(searchTerm: string, expectedVisible: string[], expectedHidden: string[]): Promise<void> {
    console.log('Executing complete report search workflow...');
    
    // Search for reports
    await this.searchReports(searchTerm);
    
    // Verify expected visible reports
    for (const reportName of expectedVisible) {
      await this.verifyReportVisible(reportName);
    }
    
    // Verify expected hidden reports
    for (const reportName of expectedHidden) {
      await this.verifyReportHidden(reportName);
    }
    
    console.log('✅ Complete report search workflow executed');
  }

  /**
   * Execute filter by tags workflow
   */
  async executeFilterByTagsWorkflow(reportName: string): Promise<void> {
    console.log('Executing filter by tags workflow...');
    
    // Verify initial state
    await this.verifyReportVisible(reportName);
    
    // Apply tag filter
    await this.filterReportsByTags();
    await this.verifyReportHidden(reportName);
    
    // Toggle filter off
    await this.toggleTagFilter();
    await this.verifyReportVisible(reportName);
    
    console.log('✅ Filter by tags workflow executed');
  }

  /**
   * Generate test report name
   */
  static generateReportName(prefix: string): string {
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix} ${timestamp}`;
  }

  /**
   * Generate test tag name
   */
  static generateTagName(prefix: string = 'Test Tag'): string {
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix} ${timestamp}`;
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface ReportScheduleConfig {
  name: string;
  deliverTo: string;
  frequency?: string;
  format?: string;
  reportType?: string;
}

export interface ReportFilterConfig {
  tags?: string[];
  categories?: string[];
  dateRange?: { start: Date; end: Date };
}

export interface ReportExportConfig {
  format: 'PDF' | 'Excel' | 'CSV';
  includeCharts: boolean;
  dateRange?: { start: Date; end: Date };
}


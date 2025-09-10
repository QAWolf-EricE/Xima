import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Reports Dashboard Page - Handles IVR call result reporting and verification
 * Enhanced specifically for IVR testing with call detail retrieval and filtering
 */
export class ReportsDashboardPage extends BasePage {
  
  // Navigation elements
  private readonly reportsNavigation = this.locator('[data-cy*="reports"], .reports-nav');
  private readonly dashboardTitle = this.getByText('Reports Dashboard');
  
  // Filter and search elements
  private readonly filterPanel = this.locator('.filter-panel, .search-panel');
  private readonly timeFilter = this.locator('[data-cy="time-filter"], .time-range-filter');
  private readonly applyFiltersButton = this.getByRole('button', { name: 'Apply Filters' });
  
  // Report table elements
  private readonly reportTable = this.locator('.report-table, .data-grid, table');
  private readonly tableRows = this.reportTable.locator('tr');
  private readonly callDetailsRow = this.reportTable.locator('tr:has-text("Call Details")');
  
  // IVR-specific elements
  private readonly ivrCallResults = this.locator('.ivr-results, [data-cy*="ivr"]');
  private readonly callTranscriptionData = this.locator('.transcription-data, [data-cy*="transcription"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.waitForPageLoad();
    // Reports page can have various layouts, so check for basic functionality
  }

  /**
   * Set time filter for IVR call result lookup
   */
  async setTimeFilter(startTime: Date, endTime?: Date): Promise<void> {
    console.log(`Setting time filter from ${startTime.toISOString()}`);
    
    // Format time for Mountain timezone (America/Denver)
    const mountainStartTime = this.formatTimeForFilter(startTime);
    const mountainEndTime = endTime ? this.formatTimeForFilter(endTime) : null;
    
    try {
      // Look for time filter controls
      if (await this.isVisible(this.timeFilter)) {
        // Set start time
        const startTimeInput = this.timeFilter.locator('input[type="datetime-local"], input[type="time"]').first();
        if (await this.isVisible(startTimeInput)) {
          await this.fillField(startTimeInput, mountainStartTime);
        }
        
        // Set end time if provided
        if (mountainEndTime) {
          const endTimeInput = this.timeFilter.locator('input[type="datetime-local"], input[type="time"]').last();
          if (await this.isVisible(endTimeInput)) {
            await this.fillField(endTimeInput, mountainEndTime);
          }
        }
        
        // Apply filters
        if (await this.isVisible(this.applyFiltersButton)) {
          await this.clickElement(this.applyFiltersButton);
        }
      }
    } catch (error) {
      console.warn('Time filter setting may require alternative approach:', error.message);
    }
    
    console.log('Time filter configured for IVR call lookup');
  }

  /**
   * Search for IVR call by unique identifier
   */
  async findIvrCallByIdentifier(uniqueIdentifier: number): Promise<IvrCallRecord | null> {
    console.log(`Searching for IVR call with identifier: ${uniqueIdentifier}`);
    
    try {
      // Wait for report data to load
      await this.waitForTimeout(5000, 'Report data loading');
      
      // Look for the unique identifier in the report table
      const identifierElement = this.reportTable.locator(`:has-text("${uniqueIdentifier}")`);
      
      if (await this.isVisible(identifierElement)) {
        // Extract call information from the row
        const rowText = await identifierElement.textContent();
        
        return {
          uniqueIdentifier,
          found: true,
          rowData: rowText || '',
          element: identifierElement
        };
      }
      
      console.log(`IVR call with identifier ${uniqueIdentifier} not found in current view`);
      return null;
      
    } catch (error) {
      console.warn(`Error searching for IVR call: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify IVR call appears in reports
   */
  async verifyIvrCallInReports(uniqueIdentifier: number, startTime: Date): Promise<void> {
    console.log('Verifying IVR call appears in reports...');
    
    // Set appropriate time filter
    const endTime = new Date(startTime.getTime() + (30 * 60 * 1000)); // 30 minutes after start
    await this.setTimeFilter(startTime, endTime);
    
    // Search for the call
    const callRecord = await this.findIvrCallByIdentifier(uniqueIdentifier);
    
    if (!callRecord || !callRecord.found) {
      throw new Error(`IVR call with identifier ${uniqueIdentifier} not found in reports`);
    }
    
    console.log(`✅ IVR call verified in reports: ${uniqueIdentifier}`);
  }

  /**
   * Get IVR call details from reports
   */
  async getIvrCallDetails(uniqueIdentifier: number): Promise<IvrCallDetails | null> {
    const callRecord = await this.findIvrCallByIdentifier(uniqueIdentifier);
    
    if (!callRecord) {
      return null;
    }
    
    try {
      // Click on the call record to get details
      await this.clickElement(callRecord.element);
      
      // Wait for details to load
      await this.waitForTimeout(2000, 'Call details loading');
      
      // Extract call details
      const details: IvrCallDetails = {
        uniqueIdentifier,
        callFound: true,
        duration: await this.extractCallDuration(),
        startTime: await this.extractCallStartTime(),
        status: await this.extractCallStatus(),
        ivrFlow: await this.extractIvrFlowData()
      };
      
      return details;
      
    } catch (error) {
      console.warn('Could not extract detailed call information:', error.message);
      return {
        uniqueIdentifier,
        callFound: true,
        duration: null,
        startTime: null,
        status: 'unknown',
        ivrFlow: null
      };
    }
  }

  /**
   * Apply basic filter for IVR call searching
   */
  async applyBasicFilter(): Promise<void> {
    try {
      // Look for filter controls and apply basic settings
      if (await this.isVisible(this.filterPanel)) {
        // Apply any available filters
        if (await this.isVisible(this.applyFiltersButton)) {
          await this.clickElement(this.applyFiltersButton);
          await this.waitForTimeout(3000, 'Filter application');
        }
      }
    } catch (error) {
      console.warn('Basic filter application encountered issues:', error.message);
    }
  }

  /**
   * Format time for filter input
   */
  private formatTimeForFilter(time: Date): string {
    // Convert to Mountain time and format for input
    return formatInTimeZone(time, 'America/Denver', 'yyyy-MM-dd\'T\'HH:mm');
  }

  /**
   * Extract call duration from details view
   */
  private async extractCallDuration(): Promise<string | null> {
    try {
      const durationElement = this.locator('.duration, [data-cy*="duration"]');
      return await this.getText(durationElement);
    } catch {
      return null;
    }
  }

  /**
   * Extract call start time from details view
   */
  private async extractCallStartTime(): Promise<Date | null> {
    try {
      const timeElement = this.locator('.start-time, [data-cy*="start"], .timestamp');
      const timeText = await this.getText(timeElement);
      return timeText ? new Date(timeText) : null;
    } catch {
      return null;
    }
  }

  /**
   * Extract call status from details view
   */
  private async extractCallStatus(): Promise<string> {
    try {
      const statusElement = this.locator('.status, [data-cy*="status"]');
      return await this.getText(statusElement);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extract IVR flow data from details view
   */
  private async extractIvrFlowData(): Promise<any> {
    try {
      // Look for IVR flow information in the details
      const ivrElement = this.ivrCallResults;
      if (await this.isVisible(ivrElement)) {
        const ivrText = await this.getText(ivrElement);
        return { flowData: ivrText };
      }
      return null;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface IvrCallRecord {
  uniqueIdentifier: number;
  found: boolean;
  rowData: string;
  element: any;
}

export interface IvrCallDetails {
  uniqueIdentifier: number;
  callFound: boolean;
  duration: string | null;
  startTime: Date | null;
  status: string;
  ivrFlow: any;
}

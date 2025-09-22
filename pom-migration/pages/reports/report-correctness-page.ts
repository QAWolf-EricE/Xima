import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Report Correctness Page - Handles report execution and data validation
 * Manages report searching, execution, and correctness verification for all report types
 */
export class ReportCorrectnessPage extends BasePage {
  
  // Page elements
  private readonly homeTitle = this.locator('app-home-title-translation:has-text("Reports")');
  private readonly searchInput = this.locator('[placeholder="Type to Search"]');
  private readonly reportsListReportName = this.getByDataCy('reports-list-report-name');
  private readonly reportsListRunTimes = this.getByDataCy('reports-list-report-run-times');
  
  // Report view selectors
  private readonly myReportsDropdown = this.locator('[id="mat-select-2"]');
  private readonly myReportsOption = this.locator('[id*="mat-option"] :text("My Reports")');
  private readonly reportRows = this.locator('[role="row"]');
  
  // Report data elements
  private readonly summaryItems = this.locator('.summary-item');
  private readonly summaryItemValues = this.locator('.summary-item-value');
  private readonly reportTable = this.locator('table, mat-table');
  private readonly tableRows = this.locator('tbody tr, mat-row');
  private readonly tableCells = this.locator('td, mat-cell');
  
  // Data validation patterns
  private readonly durationRegex = /[0-9]+:[0-9]+:[0-9]+/;
  private readonly numberRegex = /^[0-9,]+$/;
  private readonly percentageRegex = /^[0-9]+(\.[0-9]+)?%$/;
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyReportsPageLoaded(): Promise<void> {
    await this.expectVisible(this.homeTitle);
    await this.expectUrl(/reports/);
    console.log('✅ Reports page loaded and verified');
  }

  /**
   * Search for a specific report by name
   */
  async searchForReport(reportName: string): Promise<void> {
    console.log(`Searching for report: ${reportName}`);
    
    await this.fillField(this.searchInput, reportName);
    await this.page.keyboard.press('Enter');
    await this.waitForTimeout(2000, 'Search results loading');
    
    console.log(`✅ Search completed for report: ${reportName}`);
  }

  /**
   * Get current run times for a report
   */
  async getCurrentRunTimes(): Promise<string> {
    const runTimes = await this.getTextContent(this.reportsListRunTimes);
    console.log(`Current run times: ${runTimes}`);
    return runTimes;
  }

  /**
   * Run a report by clicking on the first search result
   */
  async runReport(waitTimeSeconds: number = 5): Promise<void> {
    console.log('Running report...');
    
    await this.clickElement(this.reportRows.nth(1));
    await this.waitForTimeout(waitTimeSeconds * 1000, `Report execution - ${waitTimeSeconds}s`);
    
    console.log('✅ Report execution completed');
  }

  /**
   * Run report with run times verification
   */
  async runReportWithRunTimesCheck(reportName: string): Promise<ReportRunResult> {
    console.log(`Running report with run times check: ${reportName}`);
    
    // Wait for run times to be available
    await this.expectVisible(this.reportsListRunTimes.first());
    await this.waitForTimeout(2000, 'Run times loading');
    
    const initialRunTimes = await this.getCurrentRunTimes();
    
    await this.runReport();
    
    // Verify run times changed
    const finalRunTimes = await this.getCurrentRunTimes();
    
    return {
      reportName,
      initialRunTimes,
      finalRunTimes,
      runTimesChanged: initialRunTimes !== finalRunTimes
    };
  }

  /**
   * Switch to My Reports view
   */
  async switchToMyReportsView(): Promise<void> {
    console.log('Switching to My Reports view...');
    
    await this.clickElement(this.myReportsDropdown.locator('visible=true'));
    await this.clickElement(this.myReportsOption);
    
    console.log('✅ Switched to My Reports view');
  }

  /**
   * Get summary item value by label
   */
  async getSummaryItemValue(label: string): Promise<string> {
    const summaryItem = this.summaryItems.filter({ hasText: label });
    const value = await this.getTextContent(summaryItem.locator('.summary-item-value'));
    
    console.log(`Summary item "${label}": ${value}`);
    return value;
  }

  /**
   * Get multiple summary values for validation
   */
  async getSummaryValues(labels: string[]): Promise<Map<string, string>> {
    const summaryValues = new Map<string, string>();
    
    for (const label of labels) {
      const value = await this.getSummaryItemValue(label);
      summaryValues.set(label, value);
    }
    
    return summaryValues;
  }

  /**
   * Validate duration format (HH:MM:SS)
   */
  validateDurationFormat(duration: string): boolean {
    const isValid = this.durationRegex.test(duration);
    console.log(`Duration "${duration}" format validation: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }

  /**
   * Validate number format (digits with optional commas)
   */
  validateNumberFormat(number: string): boolean {
    const cleanNumber = number.replace(/,/g, '');
    const isValid = /^[0-9]+$/.test(cleanNumber);
    console.log(`Number "${number}" format validation: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }

  /**
   * Validate percentage format
   */
  validatePercentageFormat(percentage: string): boolean {
    const isValid = this.percentageRegex.test(percentage);
    console.log(`Percentage "${percentage}" format validation: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }

  /**
   * Validate call data consistency
   */
  validateCallDataConsistency(presented: string, answered: string, missed: string): CallDataValidation {
    const presentedNum = parseInt(presented.replace(/,/g, ''));
    const answeredNum = parseInt(answered.replace(/,/g, ''));
    const missedNum = parseInt(missed.replace(/,/g, ''));
    
    const calculatedTotal = answeredNum + missedNum;
    const isConsistent = calculatedTotal <= presentedNum; // Allow for abandoned/other calls
    
    const result: CallDataValidation = {
      presented: presentedNum,
      answered: answeredNum,
      missed: missedNum,
      calculatedTotal,
      isConsistent,
      explanation: isConsistent 
        ? 'Call data is consistent' 
        : `Answered (${answeredNum}) + Missed (${missedNum}) = ${calculatedTotal} exceeds Presented (${presentedNum})`
    };
    
    console.log(`Call data consistency: ${result.explanation}`);
    return result;
  }

  /**
   * Get table data for validation
   */
  async getTableData(): Promise<string[][]> {
    console.log('Extracting table data...');
    
    const rows = await this.tableRows.all();
    const tableData: string[][] = [];
    
    for (const row of rows) {
      const cells = await row.locator('td, mat-cell').all();
      const rowData: string[] = [];
      
      for (const cell of cells) {
        const cellText = await cell.textContent();
        rowData.push(cellText?.trim() || '');
      }
      
      if (rowData.length > 0) {
        tableData.push(rowData);
      }
    }
    
    console.log(`✅ Extracted ${tableData.length} rows of table data`);
    return tableData;
  }

  /**
   * Validate report data completeness
   */
  async validateReportDataCompleteness(requiredFields: string[]): Promise<DataCompletenessResult> {
    console.log('Validating report data completeness...');
    
    const missingFields: string[] = [];
    const presentFields: string[] = [];
    
    for (const field of requiredFields) {
      try {
        const fieldElement = this.locator(`:text("${field}")`);
        const isVisible = await this.isVisible(fieldElement);
        
        if (isVisible) {
          presentFields.push(field);
        } else {
          missingFields.push(field);
        }
      } catch (error) {
        missingFields.push(field);
      }
    }
    
    const result: DataCompletenessResult = {
      totalFields: requiredFields.length,
      presentFields: presentFields.length,
      missingFields: missingFields.length,
      completeness: (presentFields.length / requiredFields.length) * 100,
      missingFieldsList: missingFields,
      isComplete: missingFields.length === 0
    };
    
    console.log(`Data completeness: ${result.completeness}% (${result.presentFields}/${result.totalFields})`);
    return result;
  }

  /**
   * Execute complete report correctness workflow
   */
  async executeReportCorrectnessWorkflow(config: ReportCorrectnessConfig): Promise<ReportCorrectnessResult> {
    console.log(`Executing report correctness workflow: ${config.reportName}`);
    
    const startTime = new Date();
    
    // Search for report
    await this.searchForReport(config.reportName);
    
    // Run report with timing
    const runResult = await this.runReportWithRunTimesCheck(config.reportName);
    
    // Get summary data if required
    let summaryData = new Map<string, string>();
    if (config.summaryFields && config.summaryFields.length > 0) {
      summaryData = await this.getSummaryValues(config.summaryFields);
    }
    
    // Validate data formats if specified
    let formatValidations: FormatValidationResult[] = [];
    if (config.validations) {
      formatValidations = await this.performFormatValidations(config.validations, summaryData);
    }
    
    // Check data completeness
    let completenessResult: DataCompletenessResult | undefined;
    if (config.requiredFields) {
      completenessResult = await this.validateReportDataCompleteness(config.requiredFields);
    }
    
    const endTime = new Date();
    
    const result: ReportCorrectnessResult = {
      reportName: config.reportName,
      startTime,
      endTime,
      executionTime: endTime.getTime() - startTime.getTime(),
      runResult,
      summaryData: Object.fromEntries(summaryData),
      formatValidations,
      completenessResult,
      success: runResult.runTimesChanged && formatValidations.every(v => v.isValid)
    };
    
    console.log(`✅ Report correctness workflow completed: ${config.reportName} (${result.success ? 'PASS' : 'FAIL'})`);
    return result;
  }

  /**
   * Perform format validations on summary data
   */
  private async performFormatValidations(validations: ValidationRule[], summaryData: Map<string, string>): Promise<FormatValidationResult[]> {
    const results: FormatValidationResult[] = [];
    
    for (const validation of validations) {
      const value = summaryData.get(validation.field);
      if (value) {
        let isValid = false;
        let errorMessage = '';
        
        switch (validation.type) {
          case 'duration':
            isValid = this.validateDurationFormat(value);
            errorMessage = isValid ? '' : `Invalid duration format: ${value}`;
            break;
          case 'number':
            isValid = this.validateNumberFormat(value);
            errorMessage = isValid ? '' : `Invalid number format: ${value}`;
            break;
          case 'percentage':
            isValid = this.validatePercentageFormat(value);
            errorMessage = isValid ? '' : `Invalid percentage format: ${value}`;
            break;
        }
        
        results.push({
          field: validation.field,
          type: validation.type,
          value,
          isValid,
          errorMessage
        });
      }
    }
    
    return results;
  }

  /**
   * Wait for reports list to load
   */
  async waitForReportsListToLoad(timeoutMs: number = 240000): Promise<void> {
    console.log('Waiting for reports list to load...');
    
    await this.page.waitForFunction(async () => {
      const selector = '[data-cy="reports-list-report-name"][role="cell"]';
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        return true;
      } catch {
        return false;
      }
    }, { timeout: timeoutMs });
    
    console.log('✅ Reports list loaded successfully');
  }

  /**
   * Generate test report data for validation
   */
  static generateReportTestData(): ReportTestData {
    return {
      commonSummaryFields: [
        'Total Presented Calls',
        'Total Answered Calls', 
        'Total Missed Calls',
        'Total Scheduled Callbacks',
        'Average Talk Time',
        'Average Hold Time'
      ],
      commonValidations: [
        { field: 'Average Talk Time', type: 'duration' },
        { field: 'Average Hold Time', type: 'duration' },
        { field: 'Total Presented Calls', type: 'number' },
        { field: 'Total Answered Calls', type: 'number' }
      ],
      reportCategories: {
        agent: ['Agent Call Summary', 'Agent Call Volume', 'Agent Chat Summary'],
        skill: ['Skill Call Summary', 'Skill Call Volume', 'Skill Chat Summary'],
        call: ['Call Volume', 'Call Details', 'Call Performance'],
        system: ['Audit Events', 'Account Code Summary', 'External Number Summary']
      }
    };
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface ReportRunResult {
  reportName: string;
  initialRunTimes: string;
  finalRunTimes: string;
  runTimesChanged: boolean;
}

export interface CallDataValidation {
  presented: number;
  answered: number;
  missed: number;
  calculatedTotal: number;
  isConsistent: boolean;
  explanation: string;
}

export interface DataCompletenessResult {
  totalFields: number;
  presentFields: number;
  missingFields: number;
  completeness: number;
  missingFieldsList: string[];
  isComplete: boolean;
}

export interface ReportCorrectnessConfig {
  reportName: string;
  summaryFields?: string[];
  requiredFields?: string[];
  validations?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'duration' | 'number' | 'percentage';
}

export interface FormatValidationResult {
  field: string;
  type: string;
  value: string;
  isValid: boolean;
  errorMessage: string;
}

export interface ReportCorrectnessResult {
  reportName: string;
  startTime: Date;
  endTime: Date;
  executionTime: number;
  runResult: ReportRunResult;
  summaryData: Record<string, string>;
  formatValidations: FormatValidationResult[];
  completenessResult?: DataCompletenessResult;
  success: boolean;
}

export interface ReportTestData {
  commonSummaryFields: string[];
  commonValidations: ValidationRule[];
  reportCategories: {
    agent: string[];
    skill: string[];
    call: string[];
    system: string[];
  };
}


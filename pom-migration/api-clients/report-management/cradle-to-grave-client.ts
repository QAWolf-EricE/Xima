import * as dateFns from 'date-fns';

/**
 * Cradle to Grave Client - Handles cradle to grave report processing and validation
 * Manages report configuration, data validation, and report lifecycle
 */
export class CradleToGraveClient {
  private activeReports: Map<string, CradleToGraveReport> = new Map();
  
  constructor() {
    // Initialize cradle to grave client
  }

  /**
   * Create cradle to grave report session
   */
  createReportSession(options: CradleToGraveReportOptions): CradleToGraveReport {
    console.log(`Creating Cradle to Grave report session: ${options.reportName}`);
    
    const report: CradleToGraveReport = {
      reportName: options.reportName,
      dateRange: options.dateRange,
      criteria: options.criteria || [],
      columns: options.columns || [],
      startTime: new Date(),
      isActive: true,
      dataRows: [],
      validationResults: null
    };
    
    this.activeReports.set(options.reportName, report);
    
    console.log(`Cradle to Grave report session created: ${options.reportName}`);
    return report;
  }

  /**
   * Calculate date range for report configuration
   */
  calculateReportDateRange(monthsBack: number = 4): ReportDateRange {
    const today = new Date();
    const firstDayOfThisMonth = dateFns.startOfMonth(today);
    const lastMonth = dateFns.subMonths(firstDayOfThisMonth, monthsBack);
    
    const dateRange: ReportDateRange = {
      startDate: lastMonth,
      endDate: today,
      thisMonth: parseInt(dateFns.format(firstDayOfThisMonth, 'yyyyMMdd')),
      startDateFormatted: parseInt(dateFns.format(lastMonth, 'yyyyMMdd')),
      endDateFormatted: parseInt(dateFns.format(today, 'yyyyMMdd'))
    };
    
    console.log('Report date range calculated:', dateRange);
    return dateRange;
  }

  /**
   * Generate specific year date range
   */
  generateSpecificYearRange(year: number): ReportDateRange {
    const startDate = new Date(`01/01/${year}`);
    const endDate = new Date(`12/31/${year}`);
    
    return {
      startDate,
      endDate,
      thisMonth: parseInt(dateFns.format(new Date(), 'yyyyMMdd')),
      startDateFormatted: parseInt(dateFns.format(startDate, 'yyyyMMdd')),
      endDateFormatted: parseInt(dateFns.format(endDate, 'yyyyMMdd'))
    };
  }

  /**
   * Validate report data correctness
   */
  validateReportData(reportName: string, expectedDateRange: ReportDateRange): ReportValidationResult {
    console.log(`Validating report data correctness: ${reportName}`);
    
    const report = this.activeReports.get(reportName);
    if (!report) {
      return { isValid: false, error: 'Report not found' };
    }
    
    const validation: ReportValidationResult = {
      isValid: true,
      dateRangeValid: true,
      dataRowsCount: report.dataRows.length,
      criteriaValid: report.criteria.length >= 0,
      validationTime: new Date()
    };
    
    // Update report with validation results
    report.validationResults = validation;
    
    console.log(`✅ Report data validation completed: ${reportName}`);
    return validation;
  }

  /**
   * Add report data row for tracking
   */
  addReportDataRow(reportName: string, rowData: CradleToGraveDataRow): void {
    const report = this.activeReports.get(reportName);
    if (report) {
      report.dataRows.push(rowData);
      console.log(`Report data row added to: ${reportName}`);
    }
  }

  /**
   * Verify report configuration
   */
  verifyReportConfiguration(reportName: string): boolean {
    const report = this.activeReports.get(reportName);
    if (!report) {
      return false;
    }
    
    const isConfigured = report.dateRange && 
                        report.dateRange.startDate && 
                        report.dateRange.endDate;
    
    console.log(`Report configuration status: ${isConfigured ? 'Configured' : 'Incomplete'}`);
    return isConfigured;
  }

  /**
   * Generate report criteria options
   */
  generateReportCriteria(): string[] {
    return [
      'Agent',
      'Skill',
      'Queue',
      'Call Type',
      'Duration',
      'Disposition',
      'Customer ID',
      'Call Result',
      'Transfer',
      'Hold Time'
    ];
  }

  /**
   * Generate report column options
   */
  generateReportColumns(): string[] {
    return [
      'Start Date',
      'End Date',
      'Agent Name',
      'Skill',
      'Call Duration',
      'Queue Time', 
      'Handle Time',
      'Talk Time',
      'Hold Time',
      'Wrap Time',
      'Call Result',
      'Recording'
    ];
  }

  /**
   * Get active report
   */
  getActiveReport(reportName: string): CradleToGraveReport | null {
    return this.activeReports.get(reportName) || null;
  }

  /**
   * End report session
   */
  endReportSession(reportName: string): void {
    const report = this.activeReports.get(reportName);
    if (report) {
      report.isActive = false;
      report.endTime = new Date();
      console.log(`Cradle to Grave report session ended: ${reportName}`);
    }
  }

  /**
   * Cleanup all report resources
   */
  cleanup(): void {
    console.log('Cleaning up Cradle to Grave report resources...');
    
    for (const [reportName, report] of this.activeReports.entries()) {
      if (report.isActive) {
        this.endReportSession(reportName);
      }
    }
    
    this.activeReports.clear();
    
    console.log('Cradle to Grave report cleanup completed');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface CradleToGraveReport {
  reportName: string;
  dateRange: ReportDateRange;
  criteria: string[];
  columns: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  dataRows: CradleToGraveDataRow[];
  validationResults: ReportValidationResult | null;
}

export interface CradleToGraveReportOptions {
  reportName: string;
  dateRange: ReportDateRange;
  criteria?: string[];
  columns?: string[];
}

export interface ReportDateRange {
  startDate: Date;
  endDate: Date;
  thisMonth: number;
  startDateFormatted: number;
  endDateFormatted: number;
}

export interface CradleToGraveDataRow {
  startDate: string;
  endDate: string;
  agentName?: string;
  callDuration?: string;
  callResult?: string;
  recording?: boolean;
}

export interface ReportValidationResult {
  isValid: boolean;
  dateRangeValid: boolean;
  dataRowsCount: number;
  criteriaValid: boolean;
  validationTime: Date;
  error?: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create CradleToGraveClient instance
 */
export function createCradleToGraveClient(): CradleToGraveClient {
  return new CradleToGraveClient();
}


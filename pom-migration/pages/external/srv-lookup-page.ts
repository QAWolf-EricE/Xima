import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import * as dns from 'dns';
import { promisify } from 'util';

/**
 * SRV Lookup Page - Handles external SRV record lookup functionality
 * Manages DNS SRV record lookups through nslookup.io service
 */
export class SrvLookupPage extends BasePage {
  
  // Page URL
  private readonly srvLookupUrl = 'https://www.nslookup.io/srv-lookup/';
  
  // Page elements
  private readonly domainNameInput = this.getByRole('textbox', { name: 'Domain name', exact: true });
  private readonly findSrvRecordsButton = this.locator('main').getByRole('button', { name: 'Find SRV records' });
  
  // Results elements
  private readonly resultsTable = this.locator('table, .results-table');
  private readonly primaryRowLink = this.locator('tr:has-text("10 primary") a');
  
  // DNS lookup utility
  private readonly dnsLookup = promisify(dns.lookup);
  
  constructor(page: Page) {
    super(page, 'https://www.nslookup.io');
  }

  /**
   * Navigate to SRV Lookup page
   */
  async open(): Promise<SrvLookupPage> {
    await this.navigateTo('/srv-lookup/');
    await this.verifyPageLoaded();
    return this;
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.domainNameInput);
    await this.expectVisible(this.findSrvRecordsButton);
    console.log('SRV Lookup page loaded successfully');
  }

  /**
   * Perform SRV record lookup for a domain
   */
  async lookupSrvRecord(domain: string): Promise<SrvRecordResult> {
    console.log(`Performing SRV lookup for domain: ${domain}`);
    
    // Fill the domain name input
    await this.fillField(this.domainNameInput, domain);
    
    // Click the Find SRV records button
    await this.clickElement(this.findSrvRecordsButton);
    
    // Wait for results to load
    await this.expectVisible(this.resultsTable, 30000);
    
    console.log('SRV lookup completed, processing results...');
    
    // Get the target from the primary record
    const target = await this.getText(this.primaryRowLink);
    
    if (!target) {
      throw new Error('No primary SRV record found in results');
    }
    
    console.log(`Primary SRV target found: ${target}`);
    
    // Resolve the target to get IP address
    const ipAddress = await this.resolveTargetToIp(target);
    
    return {
      domain,
      target,
      ipAddress,
      priority: 10, // Primary record typically has priority 10
      port: this.extractPortFromTarget(target)
    };
  }

  /**
   * Resolve target hostname to IP address using DNS lookup
   */
  private async resolveTargetToIp(target: string): Promise<string> {
    console.log(`Resolving target ${target} to IP address...`);
    
    try {
      const result = await this.dnsLookup(target);
      const ipAddress = result.address;
      
      console.log(`Target ${target} resolved to IP: ${ipAddress}`);
      return ipAddress;
      
    } catch (error) {
      throw new Error(`Failed to resolve target ${target} to IP address: ${error.message}`);
    }
  }

  /**
   * Extract port number from target (if available)
   */
  private extractPortFromTarget(target: string): number | undefined {
    // SRV targets may include port information
    const portMatch = target.match(/:(\d+)$/);
    return portMatch ? parseInt(portMatch[1], 10) : undefined;
  }

  /**
   * Get all SRV records from the results table
   */
  async getAllSrvRecords(): Promise<SrvRecordResult[]> {
    const records: SrvRecordResult[] = [];
    
    // Look for all table rows with SRV record data
    const rows = this.locator('tr:has-text("primary"), tr:has-text("secondary"), tr:has-text("backup")');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      const link = row.locator('a');
      const target = await link.textContent();
      
      if (text && target) {
        const priority = this.extractPriorityFromText(text);
        const ipAddress = await this.resolveTargetToIp(target);
        
        records.push({
          domain: '', // Will be filled by caller
          target,
          ipAddress,
          priority,
          port: this.extractPortFromTarget(target)
        });
      }
    }
    
    return records;
  }

  /**
   * Extract priority from row text
   */
  private extractPriorityFromText(text: string): number {
    const priorityMatch = text.match(/(\d+)\s+(primary|secondary|backup)/);
    return priorityMatch ? parseInt(priorityMatch[1], 10) : 0;
  }

  /**
   * Verify SRV lookup results are valid
   */
  async verifySrvResults(expectedDomain: string): Promise<void> {
    // Check that we have results table
    await this.expectVisible(this.resultsTable);
    
    // Check that we have at least one primary record
    await this.expectVisible(this.primaryRowLink);
    
    // Verify the domain is reflected in the results
    const pageContent = await this.page.textContent('body');
    if (!pageContent?.includes(expectedDomain)) {
      console.warn(`Domain ${expectedDomain} may not be reflected in results page`);
    }
    
    console.log(`SRV lookup results verified for domain: ${expectedDomain}`);
  }

  /**
   * Handle potential errors in SRV lookup
   */
  async handleLookupErrors(): Promise<boolean> {
    // Check for error messages
    const errorMessages = [
      'No records found',
      'DNS resolution failed',
      'Invalid domain',
      'Timeout'
    ];
    
    for (const errorMsg of errorMessages) {
      const errorElement = this.getByText(errorMsg);
      if (await this.isVisible(errorElement)) {
        console.warn(`SRV lookup error detected: ${errorMsg}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Static factory method for creating and navigating to SRV lookup
   */
  static async create(page: Page): Promise<SrvLookupPage> {
    const srvLookupPage = new SrvLookupPage(page);
    await srvLookupPage.open();
    return srvLookupPage;
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface SrvRecordResult {
  domain: string;
  target: string;
  ipAddress: string;
  priority: number;
  port?: number;
}

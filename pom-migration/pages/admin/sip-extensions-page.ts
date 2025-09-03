import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * SIP Extensions Management Page - Admin functionality for managing SIP extensions
 */
export class SipExtensionsPage extends BasePage {
  
  // Main page elements
  private readonly pageTitle = this.getByText('SIP Extensions');
  private readonly inboundExtensionsSection = this.locator('xima-header-add:has-text("Inbound Extensions")');
  private readonly addExtensionButton = this.inboundExtensionsSection.locator('button');
  private readonly refreshButton = this.getByRole('button', { name: 'Refresh' });
  private readonly doneButton = this.getByRole('button', { name: 'Done' });
  
  // Form elements for adding extensions
  private readonly sipExtensionInput = this.locator('mat-label:has-text("SIP Extension") + div input');
  private readonly sipPasswordInput = this.locator('mat-label:has-text("SIP Password") + div input');
  private readonly saveButton = this.locator('button:has(:text-is("Save"))');
  
  // Confirmation dialog
  private readonly confirmationOkButton = this.getByDataCy('confirmation-dialog-okay-button');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Verify the SIP Extensions page has loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.pageTitle);
    await this.expectVisible(this.inboundExtensionsSection);
  }

  /**
   * Check if extension exists and its status
   */
  async getExtensionStatus(extensionNumber: string): Promise<string | null> {
    const extensionRow = this.locator(`tr:has-text("${extensionNumber}")`);
    
    if (await extensionRow.count() === 0) {
      return null; // Extension doesn't exist
    }
    
    const statusText = await this.getText(extensionRow);
    if (statusText.includes('Registered')) {
      return 'Registered';
    } else if (statusText.includes('Unregistered')) {
      return 'Unregistered';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Verify extension has specific status
   */
  async verifyExtensionStatus(extensionNumber: string, expectedStatus: string): Promise<void> {
    const extensionRow = this.locator(`tr:has-text("${extensionNumber}")`);
    await this.expectContainsText(extensionRow, expectedStatus);
  }

  /**
   * Verify extension exists on the page
   */
  async verifyExtensionExists(extensionNumber: string): Promise<void> {
    const extensionRow = this.locator(`tr:has-text("${extensionNumber}")`);
    await this.expectVisible(extensionRow);
  }

  /**
   * Verify extension does not exist on the page
   */
  async verifyExtensionNotExists(extensionNumber: string): Promise<void> {
    const extensionRow = this.locator(`tr:has-text("${extensionNumber}")`);
    await this.expectHidden(extensionRow);
  }

  /**
   * Remove/delete an extension
   */
  async removeExtension(extensionNumber: string): Promise<void> {
    const extensionRow = this.locator(`tr:has-text("${extensionNumber}")`);
    await this.expectVisible(extensionRow);
    
    // Click the menu button for the extension (first button in the row)
    const menuButton = extensionRow.locator('button').first();
    await this.clickElement(menuButton);
    
    // Click Delete from the menu
    const deleteMenuItem = this.getByRole('menuitem', { name: 'Delete' });
    await this.clickElement(deleteMenuItem);
    
    // Confirm deletion
    await this.clickElement(this.confirmationOkButton);
    
    console.log(`Extension ${extensionNumber} removed`);
  }

  /**
   * Add a new extension
   */
  async addExtension(extensionNumber: string, password: string): Promise<void> {
    // Click the add extension button
    await this.clickElement(this.addExtensionButton);
    
    // Fill out extension information
    await this.fillField(this.sipExtensionInput, extensionNumber);
    await this.fillField(this.sipPasswordInput, password);
    
    // Save the extension
    await this.clickElement(this.saveButton);
    await this.clickElement(this.confirmationOkButton);
    
    // Wait for extension to be processed (2 minutes as per original test)
    await this.waitForTimeout(2 * 60 * 1000, 'Extension registration processing');
    
    console.log(`Extension ${extensionNumber} added`);
  }

  /**
   * Refresh the extensions list
   */
  async refreshExtensions(): Promise<void> {
    await this.clickElement(this.refreshButton);
    await this.waitForTimeout(2000, 'Extension list refresh');
  }

  /**
   * Close the SIP Extensions page
   */
  async closePage(): Promise<void> {
    await this.clickElement(this.doneButton);
  }

  /**
   * Get all visible extensions and their statuses
   */
  async getAllExtensions(): Promise<Array<{ extension: string; status: string }>> {
    const extensionRows = this.locator('tr:has-text("Registered"), tr:has-text("Unregistered")');
    const count = await extensionRows.count();
    const extensions: Array<{ extension: string; status: string }> = [];
    
    for (let i = 0; i < count; i++) {
      const row = extensionRows.nth(i);
      const text = await this.getText(row);
      
      // Extract extension number and status from row text
      const extensionMatch = text.match(/\d{3}/);
      const extension = extensionMatch ? extensionMatch[0] : 'Unknown';
      const status = text.includes('Registered') ? 'Registered' : 'Unregistered';
      
      extensions.push({ extension, status });
    }
    
    return extensions;
  }

  /**
   * Wait for extension to reach specific status
   */
  async waitForExtensionStatus(
    extensionNumber: string, 
    expectedStatus: string, 
    timeoutMs: number = 30000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const currentStatus = await this.getExtensionStatus(extensionNumber);
      
      if (currentStatus === expectedStatus) {
        return;
      }
      
      await this.waitForTimeout(5000, `Waiting for extension ${extensionNumber} status: ${expectedStatus}`);
      await this.refreshExtensions();
    }
    
    throw new Error(`Extension ${extensionNumber} did not reach status ${expectedStatus} within ${timeoutMs}ms`);
  }
}

import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * User Management Page - Agent creation, licensing, and administration
 * Used for creating WebRTC agents, managing licenses, and user administration
 */
export class UserManagementPage extends BasePage {
  
  // Navigation
  private readonly userManagementMenu = this.locator('[data-mat-icon-name="user-management"]');
  private readonly agentLicensingOption = this.getByText('Agent Licensing');
  
  // Agent creation
  private readonly addAgentButton = this.getByText('Add Agent');
  private readonly nameInput = this.locator('[placeholder="Add Name"]');
  private readonly emailInput = this.locator('[placeholder="Add email"]');
  private readonly extensionInput = this.locator('[placeholder="Add extension"]');
  private readonly saveButton = this.locator('.cdk-overlay-container button:has-text("Save")');
  private readonly okButton = this.getByText('Ok');
  
  // License management
  private readonly voiceLicenseCheckbox = this.locator('[data-cy="user-license-management-license-selection-CCAAS_VOICE"] input');
  private readonly saveLicenseButton = this.getByDataCy('user-license-management-save-button');
  
  // Agent table and actions
  private readonly agentRow = this.locator('mat-row');
  private readonly agentMenuButton = this.locator('[data-cy="user-license-management-user-cell"] button');
  private readonly deleteOption = this.locator('[mat-menu-item]:has-text("Delete")');
  private readonly confirmDeleteButton = this.getByDataCy('confirmation-dialog-okay-button');
  
  // Password functionality
  private readonly passwordInput = this.locator('#psw');
  private readonly confirmPasswordInput = this.locator('#confirm-password');
  private readonly setPasswordButton = this.locator('.set-password-btn');
  private readonly backToMainPageButton = this.getByText('Back to main page');

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Navigate to User Management
   */
  async navigateToUserManagement(): Promise<void> {
    await this.hoverElement(this.userManagementMenu);
    await this.clickElement(this.agentLicensingOption);
    await this.expectUrl(/agent-license-management/);
  }

  /**
   * Create a new WebRTC agent
   */
  async createAgent(agentData: {
    name: string;
    email: string;
    extension: string;
    assignVoiceLicense?: boolean;
  }): Promise<void> {
    await this.deleteAgentIfExists(agentData.name);
    await this.waitForTimeout(3000, 'Agent deletion cleanup');
    
    await this.clickElement(this.addAgentButton);
    await this.fillField(this.nameInput, agentData.name);
    await this.fillField(this.emailInput, agentData.email);
    await this.fillField(this.extensionInput, agentData.extension);
    
    await this.clickElement(this.saveButton);
    await this.clickElement(this.okButton);
    
    await this.expectVisible(this.agentRow.filter({ hasText: agentData.name }));
    await this.waitForTimeout(2000, 'Agent creation');
    
    if (agentData.assignVoiceLicense !== false) {
      await this.assignVoiceLicense(agentData.name);
    }
  }

  /**
   * Assign voice license to agent
   */
  async assignVoiceLicense(agentName: string): Promise<void> {
    const agentRow = this.agentRow.filter({ hasText: agentName });
    const licenseCheckbox = agentRow.locator('[data-cy="user-license-management-license-selection-CCAAS_VOICE"] input');
    
    try {
      await this.expectChecked(licenseCheckbox, 5000);
    } catch {
      await this.clickElement(licenseCheckbox, { force: true });
    }
    
    await this.clickElement(this.saveLicenseButton);
    await this.waitForTimeout(3000, 'License assignment');
    
    try {
      await this.clickElement(this.saveLicenseButton, { timeout: 5000 });
    } catch {
      console.log('Second save not needed');
    }
    
    await this.waitForTimeout(10000, 'License processing');
  }

  /**
   * Delete agent if it exists
   */
  async deleteAgentIfExists(agentName: string): Promise<boolean> {
    try {
      await this.page.waitForSelector('mat-row', { timeout: 5000 });
      await this.waitForTimeout(1000);
      
      const agentRow = this.agentRow.filter({ hasText: agentName });
      await this.expectHidden(agentRow, 3000);
      return false;
    } catch {
      await this.deleteAgent(agentName);
      return true;
    }
  }

  /**
   * Delete specific agent
   */
  async deleteAgent(agentName: string): Promise<void> {
    const menuButton = this.agentMenuButton.filter({ hasText: agentName }).nth(0);
    await this.clickElement(menuButton);
    await this.clickElement(this.deleteOption);
    await this.clickElement(this.confirmDeleteButton);
    
    await this.waitForTimeout(3000, 'Agent deletion');
    await this.expectHidden(this.agentRow.filter({ hasText: agentName }));
  }

  /**
   * Set password for newly created agent
   */
  async setAgentPassword(password: string): Promise<void> {
    await this.expectUrl(/password/);
    
    await this.fillField(this.passwordInput, password);
    await this.fillField(this.confirmPasswordInput, password);
    await this.waitForTimeout(5000, 'Password entry');
    
    await this.clickElement(this.setPasswordButton);
    await this.clickElement(this.backToMainPageButton);
    
    await this.expectUrl(/ccagent/);
  }

  /**
   * Verify page loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.expectUrl(/agent-license-management/);
    await this.expectVisible(this.addAgentButton);
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = 'A1a!'; // Ensure requirements met
    
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Clean up agent after testing
   */
  async cleanupAgent(agentName: string): Promise<void> {
    await this.navigateToUserManagement();
    
    try {
      await this.deleteAgent(agentName);
      console.log(`Agent ${agentName} cleaned up successfully`);
    } catch (error) {
      console.log(`Agent ${agentName} cleanup failed:`, error);
    }
  }
}
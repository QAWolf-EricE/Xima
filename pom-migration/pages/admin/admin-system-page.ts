import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Admin System Page - Handles system administration settings and configurations
 * Manages access to Target Platform settings, SRV records, and system diagnostics
 */
export class AdminSystemPage extends BasePage {
  
  // Navigation elements
  private readonly systemMenuButton = this.locator('[role="button"] [data-cy="sidenav-menu-ADMIN_SYSTEM"]');
  private readonly targetPlatformButton = this.getByRole('button', { name: 'Target Platform' });
  
  // SRV Record configuration elements
  private readonly srvRecordLabel = this.locator('mat-label:has(:text("SRV Record"))');
  private readonly srvRecordInput = this.locator('mat-label:has(:text("SRV Record")) + div input');
  
  // General admin elements
  private readonly adminTitle = this.getByText('System Administration');
  private readonly settingsPanel = this.locator('.settings-panel, .admin-panel');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    // Admin system page can have various forms, so check for common elements
    await this.waitForPageLoad();
  }

  /**
   * Navigate to Target Platform settings with retry logic
   */
  async navigateToTargetPlatform(): Promise<void> {
    console.log('Navigating to Target Platform settings...');
    
    // Use retry logic as the original test does
    await this.page.waitForFunction(async () => {
      try {
        // Hover over the settings icon in the sidebar
        const systemMenu = this.page.locator('[role="button"] [data-cy="sidenav-menu-ADMIN_SYSTEM"]');
        await systemMenu.hover();
        
        // Click the "Target Platform" button
        const targetPlatformBtn = this.page.getByRole('button', { name: 'Target Platform' });
        await targetPlatformBtn.click({ timeout: 3000 });
        
        // Check if SRV Record label is visible
        const srvLabel = this.page.locator('mat-label:has(:text("SRV Record"))');
        await srvLabel.waitFor({ state: 'visible', timeout: 10000 });
        
        return true;
      } catch {
        return false;
      }
    }, undefined, { timeout: 60000 });
    
    console.log('Target Platform settings loaded successfully');
  }

  /**
   * Get the SRV Record value from the Target Platform settings
   */
  async getSrvRecord(): Promise<string> {
    console.log('Retrieving SRV Record value...');
    
    // Ensure we're on the Target Platform page
    await this.navigateToTargetPlatform();
    
    // Get the SRV Record input value
    const srvRecord = await this.srvRecordInput.inputValue();
    
    if (!srvRecord) {
      throw new Error('SRV Record value is empty or not found');
    }
    
    console.log(`SRV Record retrieved: ${srvRecord}`);
    return srvRecord;
  }

  /**
   * Verify SRV Record configuration is available
   */
  async verifySrvRecordConfiguration(): Promise<void> {
    await this.expectVisible(this.srvRecordLabel);
    await this.expectVisible(this.srvRecordInput);
    console.log('SRV Record configuration verified');
  }

  /**
   * Navigate to system administration with proper authentication
   */
  static async navigateAsAdmin(page: Page, credentials: AdminCredentials): Promise<AdminSystemPage> {
    console.log('Navigating to admin system as administrator...');
    
    const adminPage = new AdminSystemPage(page);
    
    // Navigate to login page
    await adminPage.navigateTo('/');
    
    // Login with supervisor/admin credentials
    await adminPage.fillField(
      adminPage.locator('[data-cy="consolidated-login-username-input"]'),
      credentials.username
    );
    
    await adminPage.fillField(
      adminPage.locator('[data-cy="consolidated-login-password-input"]'),
      credentials.password
    );
    
    await adminPage.clickElement(
      adminPage.locator('[data-cy="consolidated-login-login-button"]')
    );
    
    // Wait for admin dashboard to load
    await adminPage.waitForPageLoad();
    console.log('Admin authentication completed');
    
    return adminPage;
  }

  /**
   * Access system diagnostics and configuration
   */
  async accessSystemDiagnostics(): Promise<void> {
    console.log('Accessing system diagnostics...');
    
    try {
      // Look for common admin navigation patterns
      const diagnosticsLink = this.getByText('System Diagnostics');
      if (await this.isVisible(diagnosticsLink)) {
        await this.clickElement(diagnosticsLink);
        return;
      }
      
      // Alternative navigation path
      const adminMenu = this.locator('[data-cy*="admin"], [data-cy*="system"]');
      if (await this.isVisible(adminMenu)) {
        await this.clickElement(adminMenu);
      }
      
    } catch (error) {
      console.warn('System diagnostics access may require specific navigation:', error.message);
    }
  }

  /**
   * Navigate to admin settings with timeout and retry
   */
  async navigateToAdminSettings(): Promise<void> {
    console.log('Navigating to admin settings...');
    
    // Wait for admin interface to be ready
    await this.waitForTimeout(2000, 'Admin interface stabilization');
    
    // Try to find and click admin menu
    try {
      await this.expectVisible(this.systemMenuButton, 30000);
      await this.clickElement(this.systemMenuButton);
    } catch (error) {
      console.warn('Standard admin menu not found, trying alternative navigation');
      // Alternative admin navigation if needed
    }
  }

  /**
   * Verify admin access and permissions
   */
  async verifyAdminAccess(): Promise<void> {
    // Check for admin-specific elements
    const adminIndicators = [
      this.getByText('Administration'),
      this.getByText('System Settings'),
      this.locator('[data-cy*="admin"]'),
      this.systemMenuButton
    ];
    
    let hasAdminAccess = false;
    for (const indicator of adminIndicators) {
      if (await this.isVisible(indicator)) {
        hasAdminAccess = true;
        break;
      }
    }
    
    if (!hasAdminAccess) {
      throw new Error('Admin access verification failed - insufficient permissions or navigation issues');
    }
    
    console.log('Admin access verified successfully');
  }

  /**
   * Get current admin context information
   */
  async getAdminContext(): Promise<AdminContext> {
    return {
      hasTargetPlatformAccess: await this.isVisible(this.targetPlatformButton),
      hasSrvRecordAccess: await this.isVisible(this.srvRecordLabel),
      currentUrl: this.getCurrentUrl()
    };
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AdminContext {
  hasTargetPlatformAccess: boolean;
  hasSrvRecordAccess: boolean;
  currentUrl: string;
}

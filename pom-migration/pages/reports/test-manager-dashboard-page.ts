import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { ReportsHomePage } from './reports-home-page';

/**
 * Test Manager Dashboard - Limited permissions dashboard for test manager users
 * Similar to supervisor dashboard but with restricted access to management features
 */
export class TestManagerDashboardPage extends BasePage {
  
  // Navigation selectors
  private readonly userMenuButton = this.locator('xima-user-menu button');
  private readonly homeTitle = this.locator('[translationset="HOME_TITLE"]');
  
  // Available navigation items for test manager
  private readonly reportsNavItem = this.getByDataCy('sidenav-menu-REPORTS');
  
  // Navigation items that should NOT be available to test manager
  private readonly userManagementNavItem = this.getByDataCy('sidenav-menu-USER_MANAGEMENT');
  private readonly contactCenterNavItem = this.getByDataCy('sidenav-menu-CONTACT_CENTER');
  private readonly routingConfigNavItem = this.getByDataCy('sidenav-menu-ROUTING_CONFIGURATION');
  private readonly adminSystemNavItem = this.getByDataCy('sidenav-menu-ADMIN_SYSTEM');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Verify the test manager dashboard has loaded correctly
   */
  async verifyDashboardLoaded(): Promise<void> {
    await this.expectVisible(this.homeTitle, 30000);
    await this.expectText(this.homeTitle, 'Reports');
    
    // Verify limited permissions
    await this.verifyLimitedPermissions();
    
    console.log('Test manager dashboard loaded successfully');
  }

  /**
   * Verify that test manager has limited permissions
   */
  async verifyLimitedPermissions(): Promise<void> {
    // These navigation items should NOT be visible for test manager
    await this.expectHidden(this.contactCenterNavItem, 5000);
    await this.expectHidden(this.userManagementNavItem, 5000);
    await this.expectHidden(this.routingConfigNavItem, 5000);
    await this.expectHidden(this.adminSystemNavItem, 5000);
    
    console.log('Verified test manager has limited permissions');
  }

  /**
   * Navigate to Reports section (main allowed functionality)
   */
  async navigateToReports(): Promise<ReportsHomePage> {
    await this.clickElement(this.reportsNavItem);
    
    const reportsPage = new ReportsHomePage(this.page, this.baseUrl);
    await reportsPage.verifyPageLoaded();
    
    return reportsPage;
  }

  /**
   * Check if user management is accessible (should return false for test manager)
   */
  async hasUserManagementAccess(): Promise<boolean> {
    return await this.isVisible(this.userManagementNavItem);
  }

  /**
   * Check if contact center is accessible (should return false for test manager)  
   */
  async hasContactCenterAccess(): Promise<boolean> {
    return await this.isVisible(this.contactCenterNavItem);
  }

  /**
   * Check if routing configuration is accessible (should return false for test manager)
   */
  async hasRoutingConfigAccess(): Promise<boolean> {
    return await this.isVisible(this.routingConfigNavItem);
  }

  /**
   * Check if admin systems is accessible (should return false for test manager)
   */
  async hasAdminSystemsAccess(): Promise<boolean> {
    return await this.isVisible(this.adminSystemNavItem);
  }

  /**
   * Get all available navigation options for test manager
   */
  async getAvailableNavigationOptions(): Promise<string[]> {
    const availableOptions: string[] = [];
    
    // Check for available navigation items
    if (await this.isVisible(this.reportsNavItem)) {
      availableOptions.push('Reports');
    }
    
    // Test manager should only have access to reports
    console.log('Available navigation options:', availableOptions);
    return availableOptions;
  }

  /**
   * Get all restricted navigation options (should be hidden for test manager)
   */
  async getRestrictedNavigationOptions(): Promise<string[]> {
    const restrictedOptions: string[] = [];
    
    // These should be hidden for test manager
    if (await this.isVisible(this.contactCenterNavItem)) {
      restrictedOptions.push('Contact Center');
    }
    if (await this.isVisible(this.userManagementNavItem)) {
      restrictedOptions.push('User Management');
    }
    if (await this.isVisible(this.routingConfigNavItem)) {
      restrictedOptions.push('Routing Configuration');
    }
    if (await this.isVisible(this.adminSystemNavItem)) {
      restrictedOptions.push('Admin Systems');
    }
    
    return restrictedOptions;
  }

  /**
   * Verify test manager restrictions compared to supervisor
   */
  async verifyTestManagerRestrictions(): Promise<{
    hasContactCenter: boolean;
    hasUserManagement: boolean;
    hasRoutingConfig: boolean;
    hasAdminSystems: boolean;
  }> {
    return {
      hasContactCenter: await this.hasContactCenterAccess(),
      hasUserManagement: await this.hasUserManagementAccess(),
      hasRoutingConfig: await this.hasRoutingConfigAccess(),
      hasAdminSystems: await this.hasAdminSystemsAccess()
    };
  }

  /**
   * Logout from test manager dashboard
   */
  async logout(): Promise<void> {
    await this.clickElement(this.userMenuButton);
    await this.clickElement(this.getByText('Logout'));
    
    // Wait for redirect to login page
    await this.expectUrl(/login|\/$/);
    console.log('Successfully logged out from test manager dashboard');
  }

  /**
   * Verify this is a test manager session (not supervisor)
   */
  async verifyTestManagerSession(): Promise<void> {
    // Test manager should not have these permissions
    const restrictions = await this.verifyTestManagerRestrictions();
    
    if (restrictions.hasContactCenter || restrictions.hasUserManagement || 
        restrictions.hasRoutingConfig || restrictions.hasAdminSystems) {
      throw new Error('User appears to have supervisor permissions, not test manager permissions');
    }
    
    console.log('Confirmed test manager session with appropriate restrictions');
  }
}

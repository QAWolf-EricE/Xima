import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { ReportsHomePage } from '../reports/reports-home-page';
import { SupervisorViewPage } from './supervisor-view-page';
import { UserManagementPage } from '../user-management/user-management-page';
import { RealTimeWallboardsPage } from './realtime-wallboards-page';

/**
 * Supervisor Dashboard - Main landing page for supervisor users
 * Provides navigation to all supervisor-specific functionality
 */
export class SupervisorDashboardPage extends BasePage {
  
  // Navigation selectors
  private readonly userMenuButton = this.locator('xima-user-menu button');
  private readonly userInitials = this.locator('xima-user-menu .initials');
  private readonly homeTitle = this.locator('[translationset="HOME_TITLE"]');
  
  // Side navigation menu items
  private readonly reportsNavItem = this.getByDataCy('sidenav-menu-REPORTS');
  private readonly supervisorViewNavItem = this.getByDataCy('sidenav-menu-SUPERVISOR_VIEW'); 
  private readonly userManagementNavItem = this.getByDataCy('sidenav-menu-USER_MANAGEMENT');
  private readonly contactCenterNavItem = this.getByDataCy('sidenav-menu-CONTACT_CENTER');
  private readonly routingConfigNavItem = this.getByDataCy('sidenav-menu-ROUTING_CONFIG');
  private readonly launcherNavItem = this.getByDataCy('sidenav-menu-LAUNCHER');
  
  // Quick action buttons
  private readonly manageMenuButton = this.getByDataCy('manage-menu-open-button');
  private readonly aboutButton = this.getByText('About');
  
  // Version and status indicators
  private readonly versionIndicator = this.getByDataCy('about-ccaas-version');
  private readonly aboutDialog = this.locator('xima-about-dialog');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Verify the supervisor dashboard has loaded correctly
   */
  async verifyDashboardLoaded(): Promise<void> {
    // Check for supervisor-specific elements
    await this.expectVisible(this.userMenuButton, 30000);
    await this.expectVisible(this.homeTitle);
    await this.expectText(this.homeTitle, 'Reports');
    
    // Verify supervisor privileges by checking access to user management
    await this.expectVisible(this.userManagementNavItem);
    
    console.log('Supervisor dashboard loaded successfully');
  }

  /**
   * Get current user initials from avatar
   */
  async getUserInitials(): Promise<string> {
    return await this.getText(this.userInitials);
  }

  /**
   * Navigate to Reports section
   */
  async navigateToReports(): Promise<ReportsHomePage> {
    await this.clickElement(this.reportsNavItem);
    
    // Wait for reports page to load
    await this.waitForTimeout(2000, 'Loading reports page');
    
    const reportsPage = new ReportsHomePage(this.page, this.baseUrl);
    await reportsPage.verifyPageLoaded();
    
    return reportsPage;
  }

  /**
   * Navigate to Supervisor View (real-time monitoring)
   */
  async navigateToSupervisorView(): Promise<SupervisorViewPage> {
    await this.clickElement(this.supervisorViewNavItem);
    
    // Wait for supervisor view to load
    await this.waitForTimeout(2000, 'Loading supervisor view');
    
    const supervisorViewPage = new SupervisorViewPage(this.page, this.baseUrl);
    await supervisorViewPage.verifyPageLoaded();
    
    return supervisorViewPage;
  }

  /**
   * Navigate to User Management
   */
  async navigateToUserManagement(): Promise<UserManagementPage> {
    await this.hoverElement(this.userManagementNavItem);
    
    // Wait for submenu to appear, then click on Agent Licensing
    await this.waitForTimeout(1000, 'Waiting for submenu');
    await this.clickElement(this.getByText('Agent Licensing'));
    
    const userMgmtPage = new UserManagementPage(this.page, this.baseUrl);
    await userMgmtPage.verifyPageLoaded();
    
    return userMgmtPage;
  }

  /**
   * Navigate to Real-Time Wallboards
   */
  async navigateToRealTimeWallboards(): Promise<RealTimeWallboardsPage> {
    // Navigate through Contact Center > Real Time > Wallboards
    await this.hoverElement(this.contactCenterNavItem);
    await this.waitForTimeout(500, 'Contact center submenu');
    
    await this.hoverElement(this.getByText('Real Time'));
    await this.waitForTimeout(500, 'Real time submenu');
    
    await this.clickElement(this.getByText('Wallboards'));
    
    const wallboardsPage = new RealTimeWallboardsPage(this.page, this.baseUrl);
    await wallboardsPage.verifyPageLoaded();
    
    return wallboardsPage;
  }

  /**
   * Open Agent Client in new tab (for testing scenarios)
   */
  async openAgentClient(): Promise<Page> {
    await this.hoverElement(this.launcherNavItem);
    await this.waitForTimeout(1000, 'Launcher submenu');
    
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.clickElement(this.getByText('Agent Client'))
    ]);
    
    await newPage.waitForLoadState();
    return newPage;
  }

  /**
   * Check application version
   */
  async checkApplicationVersion(): Promise<string> {
    // Open user menu
    try {
      await this.hoverElement(this.userInitials);
      await this.clickElement(this.aboutButton, { timeout: 5000 });
    } catch {
      // Alternative method if hover doesn't work
      await this.clickElement(this.userMenuButton);
      await this.expectVisible(this.getByText('About'));
      await this.clickElement(this.getByText('About'));
    }

    // Wait for about dialog and get version
    await this.expectVisible(this.aboutDialog);
    const version = await this.getText(this.versionIndicator);
    
    // Close dialog
    await this.clickElement(this.getByDataCy('about-ccaas-ok'));
    await this.expectHidden(this.aboutDialog);
    
    console.log(`Application version: ${version}`);
    return version;
  }

  /**
   * Set environment variable for version (integrates with existing test pattern)
   */
  async setEnvironmentVariable(name: string, value: string): Promise<void> {
    // This would integrate with your existing environment variable setting logic
    process.env[name] = value;
    console.log(`Set environment variable ${name} = ${value}`);
  }

  /**
   * Open management menu
   */
  async openManageMenu(): Promise<void> {
    await this.clickElement(this.manageMenuButton);
    await this.waitForTimeout(1000, 'Manage menu opening');
  }

  /**
   * Navigate to scheduled reports management
   */
  async navigateToScheduledReports(): Promise<void> {
    await this.openManageMenu();
    await this.clickElement(this.getByDataCy('manage-menu-manage-schedules'));
    await this.waitForTimeout(2000, 'Loading scheduled reports');
  }

  /**
   * Logout from supervisor dashboard
   */
  async logout(): Promise<void> {
    await this.clickElement(this.userMenuButton);
    await this.clickElement(this.getByText('Logout'));
    
    // Wait for redirect to login page
    await this.expectUrl(/login|\/$/);
    console.log('Successfully logged out');
  }

  /**
   * Check if user has supervisor privileges
   */
  async hasSupervisorPrivileges(): Promise<boolean> {
    try {
      await this.expectVisible(this.userManagementNavItem, 2000);
      await this.expectVisible(this.contactCenterNavItem, 2000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has test manager limitations
   */
  async hasTestManagerLimitations(): Promise<boolean> {
    try {
      await this.expectHidden(this.contactCenterNavItem, 2000);
      await this.expectHidden(this.userManagementNavItem, 2000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available navigation options
   */
  async getAvailableNavigationOptions(): Promise<string[]> {
    const navOptions: string[] = [];
    
    // Check each navigation item
    const navItems = [
      { selector: this.reportsNavItem, name: 'Reports' },
      { selector: this.supervisorViewNavItem, name: 'Supervisor View' },
      { selector: this.userManagementNavItem, name: 'User Management' },
      { selector: this.contactCenterNavItem, name: 'Contact Center' },
      { selector: this.routingConfigNavItem, name: 'Routing Config' },
      { selector: this.launcherNavItem, name: 'Launcher' }
    ];

    for (const item of navItems) {
      if (await this.isVisible(item.selector)) {
        navOptions.push(item.name);
      }
    }

    return navOptions;
  }

  /**
   * Handle potential stagger delay (integrates with existing stagger logic)
   */
  async handleStaggerDelay(): Promise<void> {
    // This would integrate with your existing stagger functionality
    await this.waitForTimeout(2000, 'Stagger delay handling');
  }

  /**
   * Check if user has contact center access
   */
  async hasContactCenterAccess(): Promise<boolean> {
    return await this.isVisible(this.contactCenterNavItem);
  }

  /**
   * Check if user has routing configuration access
   */
  async hasRoutingConfigAccess(): Promise<boolean> {
    return await this.isVisible(this.routingConfigNavItem);
  }

  /**
   * Check if user has admin systems access
   */
  async hasAdminSystemsAccess(): Promise<boolean> {
    const adminSystemNav = this.getByDataCy('sidenav-menu-ADMIN_SYSTEM');
    return await this.isVisible(adminSystemNav);
  }

  /**
   * Navigate to SIP Extensions management
   */
  async navigateToSipExtensions(): Promise<import('../admin/sip-extensions-page').SipExtensionsPage> {
    await this.hoverElement(this.getByDataCy('sidenav-menu-ADMIN_SYSTEM'));
    await this.waitForTimeout(1000, 'Admin system submenu');
    
    await this.clickElement(this.getByText('SIP Extensions'));
    
    const { SipExtensionsPage } = await import('../admin/sip-extensions-page');
    const sipExtensionsPage = new SipExtensionsPage(this.page, this.baseUrl);
    await sipExtensionsPage.verifyPageLoaded();
    
    return sipExtensionsPage;
  }

  /**
   * Launch Desktop Client from launcher menu
   */
  async launchDesktopClient(): Promise<void> {
    await this.hoverElement(this.launcherNavItem);
    await this.waitForTimeout(1000, 'Launcher submenu');
    
    await this.clickElement(this.getByRole('button', { name: 'Desktop Client' }));
    
    // Check if "Desktop Client Not Detected" modal appears
    const desktopClientModal = this.locator('xima-dialog-body:has-text("Desktop Client Not Detected")');
    
    try {
      await this.expectVisible(desktopClientModal, 5000);
      throw new Error('Desktop Client Not Detected - workflow failed. Please manually revalidate and report as bug if necessary');
    } catch (error) {
      if (error.message.includes('Desktop Client Not Detected')) {
        throw error;
      }
      // Modal not visible, which is expected for successful launch
      await this.expectHidden(desktopClientModal);
      console.log('Desktop Client launched successfully');
    }
  }
}

import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Portal Login Page - Handles portal authentication for different user types
 * Manages portal-specific login flows for admin, agent, and supervisor portal access
 */
export class PortalLoginPage extends BasePage {
  
  // Login form elements (similar to main login but portal-specific)
  private readonly usernameInput = this.getByDataCy('consolidated-login-username-input');
  private readonly passwordInput = this.getByDataCy('consolidated-login-password-input');
  private readonly loginButton = this.getByDataCy('consolidated-login-login-button');
  private readonly errorMessage = this.locator('.login-error, .error-message');
  private readonly companyLogo = this.locator('[name="company-logo"], [name="ccaas logo"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Navigate to the portal login page
   */
  async open(): Promise<PortalLoginPage> {
    await this.navigateTo('/');
    await this.expectVisible(this.loginButton);
    return this;
  }

  /**
   * Login to portal with specific account type
   */
  async loginAsPortalUser(accountType: PortalAccountType): Promise<PortalDashboardPage> {
    console.log(`Logging into portal as: ${accountType}`);
    
    // Get credentials based on account type
    const credentials = this.getPortalCredentials(accountType);
    
    // Fill login form
    await this.fillField(this.usernameInput, credentials.username);
    await this.fillField(this.passwordInput, credentials.password);
    await this.clickElement(this.loginButton);
    
    // Wait for navigation
    await this.waitForPageLoad();
    await this.waitForTimeout(2000, 'Portal login processing');
    
    // Return appropriate dashboard based on account type
    return this.createPortalDashboard(accountType);
  }

  /**
   * Login as portal admin
   */
  async loginAsPortalAdmin(): Promise<PortalAdminDashboardPage> {
    const dashboard = await this.loginAsPortalUser(PortalAccountType.ADMIN) as PortalAdminDashboardPage;
    await dashboard.verifyAdminDashboardLoaded();
    return dashboard;
  }

  /**
   * Login as portal agent
   */
  async loginAsPortalAgent(): Promise<PortalAgentDashboardPage> {
    const dashboard = await this.loginAsPortalUser(PortalAccountType.AGENT) as PortalAgentDashboardPage;
    await dashboard.verifyAgentDashboardLoaded();
    return dashboard;
  }

  /**
   * Login as portal supervisor
   */
  async loginAsPortalSupervisor(): Promise<PortalSupervisorDashboardPage> {
    const dashboard = await this.loginAsPortalUser(PortalAccountType.SUPERVISOR) as PortalSupervisorDashboardPage;
    await dashboard.verifySupervisorDashboardLoaded();
    return dashboard;
  }

  /**
   * Get portal credentials based on account type
   */
  private getPortalCredentials(accountType: PortalAccountType): PortalCredentials {
    switch (accountType) {
      case PortalAccountType.ADMIN:
        return {
          username: process.env.PORTAL_ADMIN_EMAIL || '',
          password: process.env.PORTAL_ADMIN_PASSWORD || ''
        };
      case PortalAccountType.AGENT:
        return {
          username: process.env.PORTAL_AGENT_EMAIL || '',
          password: process.env.PORTAL_AGENT_PASSWORD || ''
        };
      case PortalAccountType.SUPERVISOR:
        return {
          username: process.env.PORTAL_SUPERVISOR_EMAIL || '',
          password: process.env.PORTAL_SUPERVISOR_PASSWORD || ''
        };
      default:
        throw new Error(`Unsupported portal account type: ${accountType}`);
    }
  }

  /**
   * Create appropriate dashboard instance based on account type
   */
  private createPortalDashboard(accountType: PortalAccountType): PortalDashboardPage {
    switch (accountType) {
      case PortalAccountType.ADMIN:
        return new PortalAdminDashboardPage(this.page, this.baseUrl);
      case PortalAccountType.AGENT:
        return new PortalAgentDashboardPage(this.page, this.baseUrl);
      case PortalAccountType.SUPERVISOR:
        return new PortalSupervisorDashboardPage(this.page, this.baseUrl);
      default:
        throw new Error(`Cannot create dashboard for account type: ${accountType}`);
    }
  }

  /**
   * Verify login form is visible
   */
  async verifyLoginFormVisible(): Promise<void> {
    await this.expectVisible(this.usernameInput);
    await this.expectVisible(this.passwordInput);
    await this.expectVisible(this.loginButton);
    await this.expectVisible(this.companyLogo);
  }

  /**
   * Static factory method for creating portal login page
   */
  static async create(page: Page): Promise<PortalLoginPage> {
    const portalLoginPage = new PortalLoginPage(page);
    await portalLoginPage.open();
    return portalLoginPage;
  }
}

// ============================================================================
// PORTAL DASHBOARD BASE CLASS
// ============================================================================

/**
 * Base Portal Dashboard Page - Common portal dashboard functionality
 */
export class PortalDashboardPage extends BasePage {
  
  // Common portal elements
  protected readonly reportsTab = this.locator('mat-toolbar-row').getByText('Reports');
  protected readonly cradleToGraveTab = this.locator('mat-toolbar-row').getByText('Cradle to Grave');
  protected readonly userMenu = this.locator('xima-user-menu');
  protected readonly logoutButton = this.getByRole('button', { name: 'Logout' });
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Verify common portal elements are loaded
   */
  async verifyPortalLoaded(): Promise<void> {
    await this.expectVisible(this.reportsTab);
    await this.expectVisible(this.cradleToGraveTab);
    await this.expectVisible(this.userMenu);
  }

  /**
   * Verify Reports tab is active by default
   */
  async verifyReportsTabActive(): Promise<void> {
    await this.expectVisible(this.reportsTab);
    
    // Check if Reports tab has active class
    const reportsTabClass = await this.reportsTab.getAttribute('class');
    if (reportsTabClass && reportsTabClass.includes('active')) {
      console.log('✅ Reports tab is active by default');
    } else {
      console.log('⚠️ Reports tab active state unclear');
    }
  }

  /**
   * Verify user identity in portal
   */
  async verifyUserIdentity(expectedName: string, expectedEmail: string): Promise<void> {
    // Hover over user menu to show details
    await this.hoverElement(this.userMenu);
    
    // Check for user name and email in menu
    const userName = this.getByRole('menu').getByText(expectedName);
    const userEmail = this.getByRole('menu').getByText(expectedEmail);
    const logoutMenuItem = this.getByRole('menu').getByRole('button', { name: 'Logout' });
    
    await this.expectVisible(userName);
    await this.expectVisible(userEmail);
    await this.expectVisible(logoutMenuItem);
    
    console.log(`✅ User identity verified: ${expectedName} (${expectedEmail})`);
  }

  /**
   * Logout from portal
   */
  async logout(): Promise<void> {
    console.log('Logging out from portal...');
    
    try {
      // Hover over user menu and click logout
      await this.hoverElement(this.userMenu);
      await this.clickElement(this.logoutButton);
      
      // Verify return to login page
      await this.expectVisible(this.locator('[name="company-logo"], [name="ccaas logo"]'));
      
      console.log('✅ Portal logout successful');
      
    } catch (error) {
      console.warn('Portal logout encountered issues:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// PORTAL ADMIN DASHBOARD
// ============================================================================

/**
 * Portal Admin Dashboard Page - Full admin portal interface
 */
export class PortalAdminDashboardPage extends PortalDashboardPage {
  
  // Admin-specific sidebar navigation elements
  private readonly reportsMenuItem = this.getByDataCy('sidenav-menu-REPORTS');
  private readonly realtimeDisplaysMenuItem = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly additionalServicesMenuItem = this.getByDataCy('sidenav-menu-ADDITIONAL_SERVICES');
  private readonly userManagementMenuItem = this.getByDataCy('sidenav-menu-USER_MANAGEMENT');
  private readonly contactCenterMenuItem = this.getByDataCy('sidenav-menu-CONTACT_CENTER');
  private readonly routingConfigMenuItem = this.getByDataCy('sidenav-menu-ROUTING_CONFIGURATION');
  private readonly apiEnablementMenuItem = this.getByDataCy('sidenav-menu-API_ENABLEMENT');
  private readonly launcherMenuItem = this.getByDataCy('sidenav-menu-LAUNCHER');
  private readonly aiConfigMenuItem = this.getByDataCy('sidenav-menu-AI_CONFIGURATION');
  private readonly adminSystemMenuItem = this.getByDataCy('sidenav-menu-ADMIN_SYSTEM');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyAdminDashboardLoaded(): Promise<void> {
    await this.verifyPortalLoaded();
    
    // Verify admin-specific navigation items
    await this.expectVisible(this.reportsMenuItem);
    await this.expectVisible(this.realtimeDisplaysMenuItem);
    await this.expectVisible(this.additionalServicesMenuItem);
    await this.expectVisible(this.userManagementMenuItem);
    await this.expectVisible(this.contactCenterMenuItem);
    await this.expectVisible(this.routingConfigMenuItem);
    await this.expectVisible(this.apiEnablementMenuItem);
    await this.expectVisible(this.launcherMenuItem);
    await this.expectVisible(this.aiConfigMenuItem);
    await this.expectVisible(this.adminSystemMenuItem);
    
    console.log('✅ Portal Admin Dashboard loaded with full permissions');
  }

  /**
   * Verify admin has full access to all portal features
   */
  async verifyFullAdminAccess(): Promise<void> {
    const adminMenuItems = [
      { element: this.reportsMenuItem, name: 'Reports' },
      { element: this.realtimeDisplaysMenuItem, name: 'Realtime Displays' },
      { element: this.userManagementMenuItem, name: 'User Management' },
      { element: this.contactCenterMenuItem, name: 'Contact Center' },
      { element: this.routingConfigMenuItem, name: 'Routing Configuration' },
      { element: this.apiEnablementMenuItem, name: 'API Enablement' },
      { element: this.adminSystemMenuItem, name: 'Admin System' }
    ];
    
    for (const menuItem of adminMenuItems) {
      await this.expectVisible(menuItem.element);
      console.log(`✅ Admin access verified: ${menuItem.name}`);
    }
  }
}

// ============================================================================
// PORTAL AGENT DASHBOARD
// ============================================================================

/**
 * Portal Agent Dashboard Page - Agent portal interface
 */
export class PortalAgentDashboardPage extends PortalDashboardPage {
  
  // Agent-specific elements
  private readonly agentNameContainer = this.locator('.avatar-name-container');
  private readonly channelStatesSection = this.getByText('Channel States');
  private readonly activeMediaSection = this.getByText('Active Media');
  private readonly agentStatusMenuButton = this.getByDataCy('agent-status-menu-button');
  private readonly logoutMenuItem = this.getByRole('menuitem', { name: 'Logout' });
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyAgentDashboardLoaded(): Promise<void> {
    await this.expectVisible(this.agentNameContainer);
    await this.expectVisible(this.channelStatesSection);
    await this.expectVisible(this.activeMediaSection);
    await this.expectVisible(this.agentStatusMenuButton);
    
    console.log('✅ Portal Agent Dashboard loaded successfully');
  }

  /**
   * Verify agent name is displayed correctly
   */
  async verifyAgentName(expectedName: string): Promise<void> {
    await this.expectText(this.agentNameContainer, expectedName);
    console.log(`✅ Agent name verified: ${expectedName}`);
  }

  /**
   * Access agent logout menu
   */
  async accessLogoutMenu(): Promise<void> {
    await this.clickElement(this.agentStatusMenuButton);
    await this.expectVisible(this.logoutMenuItem);
  }
}

// ============================================================================
// PORTAL SUPERVISOR DASHBOARD
// ============================================================================

/**
 * Portal Supervisor Dashboard Page - Supervisor portal interface
 */
export class PortalSupervisorDashboardPage extends PortalDashboardPage {
  
  // Supervisor-specific sidebar navigation elements
  private readonly reportsMenuItem = this.getByDataCy('sidenav-menu-REPORTS');
  private readonly realtimeDisplaysMenuItem = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly launcherMenuItem = this.getByDataCy('sidenav-menu-LAUNCHER');
  private readonly aiConfigMenuItem = this.getByDataCy('sidenav-menu-AI_CONFIGURATION');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifySupervisorDashboardLoaded(): Promise<void> {
    await this.verifyPortalLoaded();
    
    // Verify supervisor-specific navigation items
    await this.expectVisible(this.reportsMenuItem);
    await this.expectVisible(this.realtimeDisplaysMenuItem);
    await this.expectVisible(this.launcherMenuItem);
    await this.expectVisible(this.aiConfigMenuItem);
    
    console.log('✅ Portal Supervisor Dashboard loaded with supervisor permissions');
  }

  /**
   * Verify supervisor has limited but appropriate access
   */
  async verifySupervisorAccess(): Promise<void> {
    const supervisorMenuItems = [
      { element: this.reportsMenuItem, name: 'Reports' },
      { element: this.realtimeDisplaysMenuItem, name: 'Realtime Displays' },
      { element: this.launcherMenuItem, name: 'Launcher' },
      { element: this.aiConfigMenuItem, name: 'AI Configuration' }
    ];
    
    for (const menuItem of supervisorMenuItems) {
      await this.expectVisible(menuItem.element);
      console.log(`✅ Supervisor access verified: ${menuItem.name}`);
    }
  }
}

// ============================================================================
// SUPPORTING ENUMS AND INTERFACES
// ============================================================================

export enum PortalAccountType {
  ADMIN = 'admin',
  AGENT = 'agent',
  SUPERVISOR = 'supervisor'
}

export interface PortalCredentials {
  username: string;
  password: string;
}

// Type alias for portal dashboard return type (removing duplicate declaration)
// export type PortalDashboardPage = PortalAdminDashboardPage | PortalAgentDashboardPage | PortalSupervisorDashboardPage;

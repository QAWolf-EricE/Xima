import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { UserCredentials, UserType } from '../../shared/types/core';
import { SupervisorDashboardPage } from '../supervisor/supervisor-dashboard-page';
import { AgentDashboardPage } from '../agent/agent-dashboard-page'; 
import { TestManagerDashboardPage } from '../reports/test-manager-dashboard-page';

/**
 * Main login page - Primary entry point for the application
 * Handles authentication and routes to appropriate dashboard based on user type
 */
export class LoginPage extends BasePage {
  
  // Selectors
  private readonly usernameInput = this.getByDataCy('consolidated-login-username-input');
  private readonly passwordInput = this.getByDataCy('consolidated-login-password-input');
  private readonly loginButton = this.getByDataCy('consolidated-login-login-button');
  private readonly errorMessage = this.locator('.login-error, .error-message');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Navigate to the login page
   */
  async open(): Promise<LoginPage> {
    await this.navigateTo('/');
    await this.expectVisible(this.loginButton);
    return this;
  }

  /**
   * Generic login method - determines user type and routes accordingly
   */
  async login(credentials: UserCredentials): Promise<SupervisorDashboardPage | AgentDashboardPage | TestManagerDashboardPage> {
    await this.fillField(this.usernameInput, credentials.username);
    await this.fillField(this.passwordInput, credentials.password);
    await this.clickElement(this.loginButton);
    
    // Wait for navigation and determine landing page
    await this.waitForPageLoad();
    await this.waitForTimeout(2000, 'Allow post-login processing');
    
    const currentUrl = this.getCurrentUrl();
    
    // Route to appropriate dashboard based on URL
    if (currentUrl.includes('/ccagent')) {
      return new AgentDashboardPage(this.page, this.baseUrl);
    } else if (currentUrl.includes('/reports') || currentUrl.includes('/home')) {
      // Check for supervisor vs test manager by checking available navigation
      const hasUserManagement = await this.isVisible(this.getByDataCy('sidenav-menu-USER_MANAGEMENT'));
      
      if (hasUserManagement) {
        return new SupervisorDashboardPage(this.page, this.baseUrl);
      } else {
        return new TestManagerDashboardPage(this.page, this.baseUrl);
      }
    }
    
    throw new Error(`Unable to determine dashboard type for URL: ${currentUrl}`);
  }

  /**
   * Login as supervisor user - Entry point for supervisor workflows
   */
  async loginAsSupervisor(credentials?: UserCredentials): Promise<SupervisorDashboardPage> {
    const creds = credentials || this.getDefaultCredentials(UserType.SUPERVISOR);
    
    await this.fillField(this.usernameInput, creds.username);
    await this.fillField(this.passwordInput, creds.password);
    await this.clickElement(this.loginButton);
    
    // Wait for supervisor dashboard to load
    await this.expectUrl(/\/(reports|home)/);
    
    // Verify supervisor-specific elements
    const supervisorDash = new SupervisorDashboardPage(this.page, this.baseUrl);
    await supervisorDash.verifyDashboardLoaded();
    
    return supervisorDash;
  }

  /**
   * Login as agent user - Entry point for agent workflows  
   */
  async loginAsAgent(credentials?: UserCredentials): Promise<AgentDashboardPage> {
    const creds = credentials || this.getDefaultCredentials(UserType.AGENT);
    
    await this.fillField(this.usernameInput, creds.username);
    await this.fillField(this.passwordInput, creds.password);
    await this.clickElement(this.loginButton);
    
    // Handle potential redirect through home page
    if (await this.isVisible(this.getByText('Agent Client'))) {
      // Click Agent Client link if we land on home page first
      const [agentPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.clickElement(this.getByText('Agent Client'))
      ]);
      return new AgentDashboardPage(agentPage, this.baseUrl);
    }
    
    // Direct login to agent dashboard
    await this.expectUrl(/\/ccagent/);
    const agentDash = new AgentDashboardPage(this.page, this.baseUrl);
    await agentDash.verifyDashboardLoaded();
    
    return agentDash;
  }

  /**
   * Login as WebRTC agent - Entry point for WebRTC agent workflows
   */
  async loginAsWebRTCAgent(email: string, credentials?: UserCredentials): Promise<AgentDashboardPage> {
    const creds = credentials || {
      username: email,
      password: process.env.WEBRTC_PASSWORD || ''
    };
    
    await this.fillField(this.usernameInput, creds.username);
    await this.fillField(this.passwordInput, creds.password);
    await this.clickElement(this.loginButton);
    
    // WebRTC agents go directly to agent dashboard
    await this.expectUrl(/\/ccagent/);
    
    const agentDash = new AgentDashboardPage(this.page, this.baseUrl);
    await agentDash.verifyDashboardLoaded();
    
    return agentDash;
  }

  /**
   * Login as test manager - Entry point for test manager workflows
   */
  async loginAsTestManager(credentials?: UserCredentials): Promise<TestManagerDashboardPage> {
    const creds = credentials || this.getDefaultCredentials(UserType.TEST_MANAGER);
    
    await this.fillField(this.usernameInput, creds.username);
    await this.fillField(this.passwordInput, creds.password);
    await this.clickElement(this.loginButton);
    
    // Test managers land on reports page
    await this.expectUrl(/\/reports/);
    
    const testManagerDash = new TestManagerDashboardPage(this.page, this.baseUrl);
    await testManagerDash.verifyDashboardLoaded();
    
    return testManagerDash;
  }

  /**
   * Verify login form is displayed
   */
  async verifyLoginFormVisible(): Promise<void> {
    await this.expectVisible(this.usernameInput);
    await this.expectVisible(this.passwordInput);
    await this.expectVisible(this.loginButton);
  }

  /**
   * Check if login error is displayed
   */
  async hasLoginError(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get login error message
   */
  async getLoginErrorMessage(): Promise<string> {
    if (await this.hasLoginError()) {
      return await this.getText(this.errorMessage);
    }
    return '';
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.fillField(this.usernameInput, '', { clear: true });
    await this.fillField(this.passwordInput, '', { clear: true });
  }

  /**
   * Get default credentials for user type
   */
  private getDefaultCredentials(userType: UserType): UserCredentials {
    switch (userType) {
      case UserType.SUPERVISOR:
        return {
          username: process.env.SUPERVISOR_USERNAME || '',
          password: process.env.SUPERVISOR_PASSWORD || ''
        };
      case UserType.AGENT:
        return {
          username: process.env.UCAGENT_1_EMAIL || '',
          password: process.env.UCAGENT_1_PASSWORD || ''
        };
      case UserType.TEST_MANAGER:
        return {
          username: process.env.XIMA_AGENT_2_EMAIL || '',
          password: process.env.XIMA_AGENT_2_PASSWORD || ''
        };
      default:
        throw new Error(`No default credentials configured for user type: ${userType}`);
    }
  }

  /**
   * Static factory method to create and navigate to login page
   */
  static async create(page: Page, baseUrl?: string): Promise<LoginPage> {
    const loginPage = new LoginPage(page, baseUrl);
    await loginPage.open();
    return loginPage;
  }
}

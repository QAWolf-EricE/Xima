import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Outlook Page - Handles external Outlook email integration
 * Manages Outlook.com login and email operations for testing external email flows
 */
export class OutlookPage extends BasePage {
  
  // Outlook login elements
  private readonly emailInput = this.locator('input[type="email"]');
  private readonly nextButton = this.getByRole('button', { name: 'Next' });
  private readonly passwordInput = this.locator('input[type="password"]');
  private readonly signInButton = this.getByRole('button', { name: 'Sign in' });
  
  // Outlook interface elements
  private readonly composeButton = this.getByRole('button', { name: 'New message' });
  private readonly toField = this.locator('[data-testid="To"] input, [aria-label="To"] input');
  private readonly subjectField = this.locator('[data-testid="SubjectField"] input, [aria-label="Subject"] input');
  private readonly bodyEditor = this.locator('[data-testid="BodyEditor"], [contenteditable="true"]');
  private readonly sendButton = this.getByRole('button', { name: 'Send' });
  
  // Inbox elements
  private readonly inboxFolder = this.getByRole('treeitem', { name: 'Inbox' });
  private readonly emailList = this.locator('[data-testid="MessageList"], .message-list');
  private readonly firstEmail = this.locator('[data-testid="MessageListItem"]:first-child, .message-item:first-child');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl || 'https://outlook.com');
  }

  /**
   * Navigate to Outlook.com
   */
  async open(): Promise<OutlookPage> {
    await this.navigateTo('/');
    return this;
  }

  /**
   * Login to Outlook with provided credentials
   */
  async login(email: string, password: string): Promise<void> {
    console.log('Logging into Outlook...');
    
    // Handle potential redirects and different login screens
    await this.waitForTimeout(5000, 'Page load stabilization');
    
    try {
      // Enter email
      await this.expectVisible(this.emailInput, 10000);
      await this.fillField(this.emailInput, email);
      await this.clickElement(this.nextButton);
      
      // Enter password
      await this.expectVisible(this.passwordInput, 10000);
      await this.fillField(this.passwordInput, password);
      await this.clickElement(this.signInButton);
      
      // Wait for successful login and inbox to load
      await this.waitForTimeout(10000, 'Login processing and inbox load');
      
      console.log('Outlook login successful');
      
    } catch (error) {
      console.error('Outlook login failed:', error.message);
      throw new Error(`Failed to login to Outlook: ${error.message}`);
    }
  }

  /**
   * Compose and send new email
   */
  async composeAndSendEmail(options: OutlookEmailOptions): Promise<void> {
    console.log('Composing email in Outlook...');
    
    try {
      // Click compose button
      await this.clickElement(this.composeButton);
      await this.waitForTimeout(2000, 'Compose window load');
      
      // Fill email fields
      await this.fillField(this.toField, options.to);
      await this.fillField(this.subjectField, options.subject);
      await this.fillField(this.bodyEditor, options.body);
      
      // Send email
      await this.clickElement(this.sendButton);
      await this.waitForTimeout(3000, 'Email sending');
      
      console.log('Email sent successfully from Outlook');
      
    } catch (error) {
      console.error('Failed to send email from Outlook:', error.message);
      throw new Error(`Failed to compose/send email: ${error.message}`);
    }
  }

  /**
   * Navigate to inbox
   */
  async navigateToInbox(): Promise<void> {
    try {
      await this.clickElement(this.inboxFolder);
      await this.waitForTimeout(3000, 'Inbox load');
      console.log('Navigated to Outlook inbox');
    } catch (error) {
      console.warn('Could not navigate to inbox, might already be there');
    }
  }

  /**
   * Wait for new email to arrive in inbox
   */
  async waitForNewEmail(timeoutMs: number = 60000): Promise<void> {
    console.log('Waiting for new email in Outlook inbox...');
    
    await this.navigateToInbox();
    
    // Wait for email list to be populated
    await this.expectVisible(this.emailList, timeoutMs);
    await this.expectVisible(this.firstEmail, timeoutMs);
    
    console.log('New email detected in Outlook inbox');
  }

  /**
   * Open first email in inbox
   */
  async openFirstEmail(): Promise<void> {
    await this.navigateToInbox();
    await this.expectVisible(this.firstEmail);
    await this.clickElement(this.firstEmail);
    await this.waitForTimeout(3000, 'Email opening');
    console.log('Opened first email in Outlook');
  }

  /**
   * Reply to current email
   */
  async replyToEmail(body: string): Promise<void> {
    const replyButton = this.getByRole('button', { name: 'Reply' });
    await this.clickElement(replyButton);
    await this.waitForTimeout(2000, 'Reply compose load');
    
    await this.fillField(this.bodyEditor, body);
    await this.clickElement(this.sendButton);
    await this.waitForTimeout(3000, 'Reply sending');
    
    console.log('Reply sent from Outlook');
  }

  /**
   * Check if logged in to Outlook
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.expectVisible(this.composeButton, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout from Outlook
   */
  async logout(): Promise<void> {
    try {
      const accountButton = this.locator('[data-testid="AccountManagerButton"], .account-menu');
      await this.clickElement(accountButton);
      
      const signOutButton = this.getByText('Sign out');
      await this.clickElement(signOutButton);
      
      await this.waitForTimeout(3000, 'Logout processing');
      console.log('Logged out from Outlook');
      
    } catch (error) {
      console.warn('Logout process encountered issues, continuing...');
    }
  }

  /**
   * Handle potential security prompts or two-factor authentication
   */
  async handleSecurityPrompts(): Promise<void> {
    try {
      // Handle "Stay signed in?" prompt
      const staySignedInButton = this.getByText('No');
      if (await this.isVisible(staySignedInButton)) {
        await this.clickElement(staySignedInButton);
        await this.waitForTimeout(2000);
      }
      
      // Handle "Don't show this again" checkbox
      const dontShowAgainCheckbox = this.locator('input[type="checkbox"]');
      if (await this.isVisible(dontShowAgainCheckbox)) {
        await this.setCheckbox(dontShowAgainCheckbox, false);
      }
      
    } catch {
      // Security prompts are optional, continue if not present
    }
  }

  /**
   * Verify Outlook page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    // Check for either login form or inbox interface
    const loginVisible = await this.isVisible(this.emailInput);
    const inboxVisible = await this.isVisible(this.composeButton);
    
    if (!loginVisible && !inboxVisible) {
      throw new Error('Outlook page did not load properly');
    }
    
    console.log('Outlook page loaded successfully');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface OutlookEmailOptions {
  to: string;
  subject: string;
  body: string;
}

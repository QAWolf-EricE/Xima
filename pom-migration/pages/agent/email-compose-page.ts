import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Email Compose Page - Handles email composition and sending
 * Manages the email editor interface for composing and sending emails
 */
export class EmailComposePage extends BasePage {
  
  // Email composition form elements
  private readonly toField = this.locator('#to');
  private readonly subjectField = this.getByRole('textbox', { name: 'Subject' });
  private readonly bodyEditor = this.locator('[contenteditable="true"]');
  private readonly sendButton = this.getByDataCy('email-footer-send-button');
  private readonly doneButton = this.getByText('Done');
  
  // Attachment elements
  private readonly attachFilesButton = this.locator('[data-mat-icon-name="attach-files"]');
  private readonly attachmentDisplay = this.locator('xima-email-attachment');
  
  // Reply/Forward elements
  private readonly replyButton = this.getByText('Reply');
  private readonly replyAllButton = this.getByText('Reply All');
  private readonly forwardButton = this.getByText('Forward');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.toField);
    await this.expectVisible(this.subjectField);
    await this.expectVisible(this.bodyEditor);
  }

  /**
   * Fill the recipient field
   */
  async setRecipient(email: string): Promise<void> {
    await this.fillField(this.toField, email);
    await this.waitForTimeout(1000, 'Recipient field update');
    console.log(`Set email recipient to: ${email}`);
  }

  /**
   * Fill the subject field
   */
  async setSubject(subject: string): Promise<void> {
    await this.fillField(this.subjectField, subject);
    console.log(`Set email subject to: ${subject}`);
  }

  /**
   * Fill the email body
   */
  async setBody(body: string): Promise<void> {
    await this.fillField(this.bodyEditor, body);
    console.log(`Set email body content`);
  }

  /**
   * Compose complete email with recipient, subject, and body
   */
  async composeEmail(options: EmailComposeOptions): Promise<void> {
    console.log('Composing email...');
    
    await this.setRecipient(options.to);
    await this.setSubject(options.subject);
    await this.setBody(options.body);
    
    console.log('Email composition completed');
  }

  /**
   * Attach file to email
   */
  async attachFile(filePath: string): Promise<void> {
    console.log(`Attaching file: ${filePath}`);
    
    // Set up file chooser handler
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    
    // Click attach files button
    await this.clickElement(this.attachFilesButton);
    
    // Handle file chooser
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    
    // Extract filename from path for verification
    const fileName = filePath.split('/').pop() || '';
    
    // Verify attachment appears
    await this.expectVisible(this.attachmentDisplay.filter({ hasText: fileName }));
    await this.waitForTimeout(3000, 'Attachment processing');
    
    console.log(`File attached successfully: ${fileName}`);
  }

  /**
   * Send the composed email
   */
  async sendEmail(): Promise<void> {
    console.log('Sending email...');
    await this.clickElement(this.sendButton);
    console.log('Email sent successfully');
  }

  /**
   * Complete email interaction by clicking Done
   */
  async completeEmailInteraction(): Promise<void> {
    await this.clickElement(this.doneButton);
    console.log('Email interaction completed');
  }

  /**
   * Complete email composition and sending workflow
   */
  async composeAndSendEmail(options: EmailComposeOptions & { filePath?: string }): Promise<void> {
    // Compose email
    await this.composeEmail(options);
    
    // Attach file if provided
    if (options.filePath) {
      await this.attachFile(options.filePath);
    }
    
    // Send email
    await this.sendEmail();
    
    // Complete interaction
    await this.completeEmailInteraction();
    
    console.log('Complete email workflow finished successfully');
  }

  /**
   * Reply to current email
   */
  async replyToEmail(body: string): Promise<void> {
    await this.clickElement(this.replyButton);
    await this.verifyPageLoaded();
    await this.setBody(body);
    await this.sendEmail();
    await this.completeEmailInteraction();
    console.log('Reply sent successfully');
  }

  /**
   * Reply all to current email
   */
  async replyAllToEmail(body: string): Promise<void> {
    await this.clickElement(this.replyAllButton);
    await this.verifyPageLoaded();
    await this.setBody(body);
    await this.sendEmail();
    await this.completeEmailInteraction();
    console.log('Reply all sent successfully');
  }

  /**
   * Forward current email
   */
  async forwardEmail(to: string, body?: string): Promise<void> {
    await this.clickElement(this.forwardButton);
    await this.verifyPageLoaded();
    await this.setRecipient(to);
    
    if (body) {
      await this.setBody(body);
    }
    
    await this.sendEmail();
    await this.completeEmailInteraction();
    console.log('Email forwarded successfully');
  }

  /**
   * Generate timestamped subject for testing
   */
  generateTestSubject(prefix: string = 'Test'): string {
    return `${prefix} ${Date.now()}`;
  }

  /**
   * Generate timestamped body for testing
   */
  generateTestBody(prefix: string = 'Test message'): string {
    return `${prefix} ${Date.now()}`;
  }

  /**
   * Verify attachment is displayed
   */
  async verifyAttachment(fileName: string): Promise<void> {
    await this.expectVisible(this.attachmentDisplay.filter({ hasText: fileName }));
    console.log(`Verified attachment: ${fileName}`);
  }

  /**
   * Get current subject value
   */
  async getCurrentSubject(): Promise<string> {
    return await this.subjectField.inputValue();
  }

  /**
   * Get current body content
   */
  async getCurrentBody(): Promise<string> {
    return await this.bodyEditor.textContent() || '';
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.fillField(this.toField, '', { clear: true });
    await this.fillField(this.subjectField, '', { clear: true });
    await this.fillField(this.bodyEditor, '', { clear: true });
    console.log('Email form cleared');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface EmailComposeOptions {
  to: string;
  subject: string;
  body: string;
}

export interface EmailAttachmentOptions {
  filePath: string;
  fileName?: string;
}

import { getInbox } from '../../../getInbox';

/**
 * Email Management Client - Handles external email operations
 * Wraps the getInbox functionality for type-safe email operations
 */
export class EmailManagementClient {
  private inboxInstance: any = null;
  private secondaryInboxInstance: any = null;

  constructor() {
    // Initialize client
  }

  /**
   * Setup primary inbox for email operations
   */
  async setupPrimaryInbox(): Promise<EmailInboxInfo> {
    console.log('Setting up primary email inbox...');
    
    this.inboxInstance = await getInbox();
    
    const inboxInfo: EmailInboxInfo = {
      emailAddress: this.inboxInstance.emailAddress,
      sendMessage: this.inboxInstance.sendMessage,
      waitForMessage: this.inboxInstance.waitForMessage,
      waitForMessages: this.inboxInstance.waitForMessages
    };
    
    console.log(`Primary inbox setup completed: ${inboxInfo.emailAddress}`);
    return inboxInfo;
  }

  /**
   * Setup secondary inbox (e.g., for CC'd emails or different recipients)
   */
  async setupSecondaryInbox(options?: { address?: string; new?: boolean }): Promise<EmailInboxInfo> {
    console.log('Setting up secondary email inbox...');
    
    this.secondaryInboxInstance = await getInbox(options);
    
    const inboxInfo: EmailInboxInfo = {
      emailAddress: this.secondaryInboxInstance.emailAddress,
      sendMessage: this.secondaryInboxInstance.sendMessage,
      waitForMessage: this.secondaryInboxInstance.waitForMessage,
      waitForMessages: this.secondaryInboxInstance.waitForMessages
    };
    
    console.log(`Secondary inbox setup completed: ${inboxInfo.emailAddress}`);
    return inboxInfo;
  }

  /**
   * Setup inbox with specific email address
   */
  async setupInboxWithAddress(emailAddress: string): Promise<EmailInboxInfo> {
    console.log(`Setting up inbox with specific address: ${emailAddress}`);
    
    const inbox = await getInbox({ address: emailAddress });
    
    return {
      emailAddress: inbox.emailAddress,
      sendMessage: inbox.sendMessage,
      waitForMessage: inbox.waitForMessage,
      waitForMessages: inbox.waitForMessages
    };
  }

  /**
   * Send email using primary inbox
   */
  async sendEmail(options: SendEmailOptions): Promise<any> {
    if (!this.inboxInstance) {
      throw new Error('Primary inbox not setup. Call setupPrimaryInbox() first.');
    }

    console.log(`Sending email to: ${options.to.join(', ')}`);
    console.log(`Subject: ${options.subject}`);

    const emailResult = await this.inboxInstance.sendMessage({
      to: options.to,
      subject: options.subject,
      html: options.html || `<body>${options.text || ''}</body>`,
      text: options.text
    });

    console.log('Email sent successfully');
    return emailResult;
  }

  /**
   * Wait for email message with specific criteria
   */
  async waitForEmail(
    options: WaitForEmailOptions,
    timeoutMs: number = 60000
  ): Promise<EmailMessage> {
    const inbox = options.useSecondary ? this.secondaryInboxInstance : this.inboxInstance;
    
    if (!inbox) {
      throw new Error(`${options.useSecondary ? 'Secondary' : 'Primary'} inbox not setup.`);
    }

    console.log(`Waiting for email${options.after ? ' after ' + options.after.toISOString() : ''}...`);

    const message = await inbox.waitForMessage({
      after: options.after,
      timeout: timeoutMs
    });

    console.log(`Email received from: ${message.from}`);
    console.log(`Subject: ${message.subject}`);

    return {
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments || []
    };
  }

  /**
   * Wait for multiple email messages
   */
  async waitForEmails(
    options: WaitForEmailOptions,
    timeoutMs: number = 60000
  ): Promise<EmailMessage[]> {
    const inbox = options.useSecondary ? this.secondaryInboxInstance : this.inboxInstance;
    
    if (!inbox) {
      throw new Error(`${options.useSecondary ? 'Secondary' : 'Primary'} inbox not setup.`);
    }

    console.log('Waiting for multiple emails...');

    const messages = await inbox.waitForMessages({
      after: options.after,
      timeout: timeoutMs
    });

    console.log(`Received ${messages.length} emails`);

    return messages.map((message: any): EmailMessage => ({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments || []
    }));
  }

  /**
   * Create timestamp for email filtering
   */
  createTimestamp(): Date {
    return new Date();
  }

  /**
   * Send test email with timestamp
   */
  async sendTestEmail(to: string[], subject?: string, body?: string): Promise<any> {
    const timestamp = Date.now();
    const testSubject = subject || `Test Email ${timestamp}`;
    const testBody = body || `Test email content sent at ${new Date().toISOString()}`;

    return await this.sendEmail({
      to,
      subject: testSubject,
      text: testBody,
      html: `<body><p>${testBody}</p></body>`
    });
  }

  /**
   * Send email with HTML content
   */
  async sendHtmlEmail(options: SendEmailOptions): Promise<any> {
    return await this.sendEmail({
      ...options,
      html: options.html || `<body>${options.text || ''}</body>`
    });
  }

  /**
   * Get primary inbox email address
   */
  getPrimaryEmailAddress(): string | null {
    return this.inboxInstance?.emailAddress || null;
  }

  /**
   * Get secondary inbox email address
   */
  getSecondaryEmailAddress(): string | null {
    return this.secondaryInboxInstance?.emailAddress || null;
  }

  /**
   * Reset inbox instances
   */
  reset(): void {
    this.inboxInstance = null;
    this.secondaryInboxInstance = null;
    console.log('Email management client reset');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface EmailInboxInfo {
  emailAddress: string;
  sendMessage: (options: any) => Promise<any>;
  waitForMessage: (options: any) => Promise<any>;
  waitForMessages: (options: any) => Promise<any>;
}

export interface SendEmailOptions {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface WaitForEmailOptions {
  after?: Date;
  useSecondary?: boolean;
}

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  fileName: string;
  content?: string;
  contentType?: string;
  size?: number;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create EmailManagementClient instance
 */
export function createEmailManagementClient(): EmailManagementClient {
  return new EmailManagementClient();
}

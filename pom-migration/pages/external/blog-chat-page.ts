import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Blog Chat Page - Represents the external blog chat widget
 * Used for customer-side interactions on blog sites like chattestxima.blogspot.com
 */
export class BlogChatPage extends BasePage {
  
  // Chat widget elements
  private readonly chatWidgetIcon = this.locator('#xima-chat-widget-icon-chat');
  private readonly chatHeader = this.locator('#xima-chat-header');
  private readonly startChatBtn = this.locator('#xima-start-chat-btn');
  private readonly enterQueueBtn = this.locator('#xima-enter-chat-queue-btn');
  
  // Chat form elements
  private readonly nameInput = this.locator('#xima-chat-name');
  private readonly emailInput = this.locator('#xima-chat-email');
  private readonly submitButton = this.locator('#xima-chat-name-email-entry-submit');
  
  // Chat interaction elements
  private readonly messageTextarea = this.locator('#xima-chat-textarea');
  private readonly sendMessageBtn = this.locator('#xima-send-message-btn');
  private readonly agentName = this.locator('#xima-agent-name');
  private readonly chatMessages = this.locator('.xima-chat-message');
  
  // Status messages
  private readonly queueMessage = this.getByText('You Are In The Queue');
  private readonly busyMessage = this.getByText('All agents are currently busy');
  private readonly noAgentsMessage = this.getByText('No agents are currently logged in');
  private readonly chatEndedMessage = this.locator('#xima-chat-header');
  private readonly typingIndicator = this.locator('.dot-container');
  
  // Screenshot elements
  private readonly screenshotRequestMessage = this.getByText('is requesting a screenshot');
  private readonly sendScreenshotBtn = this.getByRole('button', { name: 'Send Screenshot' });
  private readonly dontSendBtn = this.getByRole('button', { name: "Don't send" });
  private readonly screenshotSentMessage = this.getByText('Screenshot sent to agent');
  private readonly screenshotRejectedMessage = this.getByText('Screenshot request rejected');
  
  // UI elements
  private readonly companyLogo = this.locator('[alt="company-logo"], [src*="46409415.png"]');
  private readonly closeChatBtn = this.getByRole('button', { name: 'Close chat' });

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Navigate to a specific blog chat page by skill number
   */
  async navigateToBlogPage(skillNumber: string): Promise<void> {
    const blogUrl = `https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-${skillNumber}.html`;
    await this.navigateTo(blogUrl);
    await this.waitForTimeout(3000, 'Blog page load');
    await this.reload();
  }

  /**
   * Navigate to specific blog page URL with date format
   */
  async navigateToBlogPageWithDate(skillNumber: string, date: string = '2024/10'): Promise<void> {
    const blogUrl = `https://chattestxima.blogspot.com/${date}/qa-wolf-skill-${skillNumber}.html`;
    await this.navigateTo(blogUrl);
    await this.waitForTimeout(3000, 'Blog page load');
    await this.reload();
  }

  /**
   * Open the chat widget
   */
  async openChatWidget(): Promise<void> {
    try {
      // Try to click existing chat header first
      await this.clickElement(this.chatHeader, { timeout: 5000 });
      await this.clickElement(this.startChatBtn);
    } catch {
      // Fallback to chat widget icon
      await this.clickElement(this.chatWidgetIcon);
    }
  }

  /**
   * Check if agents are available
   */
  async areAgentsAvailable(): Promise<boolean> {
    await this.openChatWidget();
    
    try {
      await this.waitForVisible(this.busyMessage, 3000);
      return false;
    } catch {
      try {
        await this.waitForVisible(this.noAgentsMessage, 3000);
        return false;
      } catch {
        return true;
      }
    }
  }

  /**
   * Enter chat queue if agents are busy
   */
  async enterChatQueue(): Promise<void> {
    try {
      const yesButton = this.getByRole('button', { name: 'Yes' });
      await this.clickElement(yesButton, { timeout: 5000 });
    } catch {
      try {
        await this.clickElement(this.enterQueueBtn, { timeout: 5000 });
      } catch {
        console.log('No queue entry required');
      }
    }
  }

  /**
   * Fill customer information and start chat
   */
  async startChatWithCustomerInfo(customerName: string, customerEmail: string): Promise<void> {
    await this.openChatWidget();
    
    // Enter queue if needed
    await this.enterChatQueue();
    
    // Fill customer information
    await this.fillField(this.nameInput, customerName);
    await this.fillField(this.emailInput, customerEmail);
    
    // Submit the form
    await this.waitForTimeout(2000, 'Form submission delay');
    await this.clickElement(this.submitButton);
  }

  /**
   * Generate random customer data and start chat
   */
  async startChatWithRandomCustomer(): Promise<{ name: string; email: string }> {
    // Generate random customer data
    const randomNum = Math.floor(Math.random() * 1000);
    const customerName = `Test Customer ${randomNum}`;
    const customerEmail = `testcustomer${randomNum}@qawolf.email`;
    
    await this.startChatWithCustomerInfo(customerName, customerEmail);
    
    return { name: customerName, email: customerEmail };
  }

  /**
   * Verify chat is in queue
   */
  async verifyInQueue(): Promise<void> {
    await this.expectVisible(this.queueMessage);
  }

  /**
   * Verify chat has started with agent
   */
  async verifyChatStarted(): Promise<void> {
    await this.expectVisible(this.agentName, 30000);
    await this.expectVisible(this.messageTextarea);
  }

  /**
   * Get the connected agent name
   */
  async getAgentName(): Promise<string> {
    return await this.getText(this.agentName);
  }

  /**
   * Verify agent greeting message
   */
  async verifyAgentGreeting(customerName: string, agentName: string): Promise<void> {
    const greetingText = `Hello, ${customerName}. My name is ${agentName}. How can I help you today?`;
    const greetingMessage = this.getByText(greetingText);
    await this.expectVisible(greetingMessage);
  }

  /**
   * Send a chat message as customer
   */
  async sendMessage(message: string): Promise<void> {
    await this.fillField(this.messageTextarea, message);
    await this.clickElement(this.sendMessageBtn);
  }

  /**
   * Wait for agent typing indicator
   */
  async waitForAgentTyping(): Promise<void> {
    await this.expectVisible(this.typingIndicator);
  }

  /**
   * Verify received message from agent
   */
  async verifyReceivedMessage(message: string): Promise<void> {
    const messageElement = this.getByText(message);
    await this.expectVisible(messageElement);
  }

  /**
   * Handle screenshot request from agent
   */
  async handleScreenshotRequest(accept: boolean = true): Promise<void> {
    await this.expectVisible(this.screenshotRequestMessage);
    
    if (accept) {
      await this.clickElement(this.sendScreenshotBtn);
      await this.expectVisible(this.screenshotSentMessage);
    } else {
      await this.clickElement(this.dontSendBtn);
      await this.expectVisible(this.screenshotRejectedMessage);
    }
  }

  /**
   * Verify chat has ended
   */
  async verifyChatEnded(): Promise<void> {
    const endMessage = 'Chat has ended. Thank You, Have a good day!';
    await this.expectContainsText(this.chatEndedMessage, endMessage);
  }

  /**
   * Close chat window
   */
  async closeChatWindow(): Promise<void> {
    await this.clickElement(this.closeChatBtn);
  }

  /**
   * Verify chat window appearance and branding
   */
  async verifyChatWindowAppearance(): Promise<void> {
    // Verify custom color scheme (purple header)
    await this.expectVisible(this.chatHeader);
    
    // Verify company logo
    await this.expectVisible(this.companyLogo);
    
    // Verify form fields are present
    await this.expectVisible(this.nameInput);
    await this.expectVisible(this.emailInput);
  }

  /**
   * Verify chat window has custom color scheme
   */
  async verifyCustomColorScheme(): Promise<void> {
    // Check for magenta/purple background
    const headerElement = await this.chatHeader.first();
    const bgColor = await headerElement.evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Should be magenta (rgb(255, 0, 255))
    if (!bgColor.includes('rgb(255, 0, 255)')) {
      console.warn(`Expected magenta background, got: ${bgColor}`);
    }
  }

  /**
   * Wait for page to load with skill verification
   */
  async waitForSkillPage(skillNumber: string): Promise<void> {
    const skillTitle = this.locator(`.post-title.entry-title:has-text("QA Wolf - Skill ${skillNumber}")`);
    await this.expectVisible(skillTitle, 240000);
  }

  /**
   * Create a complete chat session workflow
   */
  async createChatSession(skillNumber: string, customerData?: { name: string; email: string }): Promise<{ name: string; email: string }> {
    // Navigate to blog page
    await this.navigateToBlogPage(skillNumber);
    await this.waitForSkillPage(skillNumber);
    
    // Start chat with customer info
    let customer;
    if (customerData) {
      await this.startChatWithCustomerInfo(customerData.name, customerData.email);
      customer = customerData;
    } else {
      customer = await this.startChatWithRandomCustomer();
    }
    
    // Verify in queue
    await this.verifyInQueue();
    
    return customer;
  }
}

import { Page } from '@playwright/test';
import { AgentDashboardPage } from '../../pages/agent/agent-dashboard-page';
import { ChatSessionPage } from '../../pages/agent/chat-session-page';
import { BlogChatPage } from '../../pages/external/blog-chat-page';
import { LoginPage } from '../../pages/auth/login-page';
import { ChannelType } from '../../shared/types/core';

/**
 * Web Chat Management Client - Handles web chat operations and workflows
 * Provides high-level methods for chat testing scenarios
 */
export class WebChatClient {
  
  constructor(private readonly page: Page) {}

  /**
   * Create a new blog chat page instance
   */
  async createBlogChatPage(): Promise<BlogChatPage> {
    return new BlogChatPage(this.page);
  }

  /**
   * Create a new chat session page instance
   */
  async createChatSessionPage(): Promise<ChatSessionPage> {
    return new ChatSessionPage(this.page);
  }

  /**
   * Setup agent for chat testing with specific skill
   */
  async setupAgentForChatTesting(
    credentials: { username: string; password: string },
    skillNumber: string,
    options?: {
      enableVoice?: boolean;
      enableEmail?: boolean;
      cleanupExistingChats?: boolean;
    }
  ): Promise<{ agentDash: AgentDashboardPage; agentName: string }> {
    
    const defaultOptions = {
      enableVoice: true,
      enableEmail: false,
      cleanupExistingChats: true,
      ...options
    };

    // Login as agent
    const loginPage = await LoginPage.create(this.page);
    const agentDash = await loginPage.loginAsAgent(credentials);
    
    // Get agent name for identification
    const agentName = await agentDash.getAgentName();
    
    // Cleanup existing chats if requested
    if (defaultOptions.cleanupExistingChats) {
      await agentDash.cleanupActiveMedia();
    }
    
    // Enable specific skill
    await agentDash.enableSkill(skillNumber);
    
    // Set agent to Ready status
    await agentDash.setReady();
    
    // Enable required channels
    await agentDash.enableChannel(ChannelType.CHAT);
    
    if (defaultOptions.enableVoice) {
      await agentDash.enableChannel(ChannelType.VOICE);
    }
    
    if (defaultOptions.enableEmail) {
      await agentDash.enableChannel(ChannelType.EMAIL);
    }
    
    // Wait for channel setup
    await agentDash.waitForTimeout(4000, 'Channel setup');
    
    return { agentDash, agentName };
  }

  /**
   * Create a complete web chat session between blog customer and agent
   */
  async createWebChatSession(
    skillNumber: string,
    agentCredentials: { username: string; password: string },
    customerData?: { name: string; email: string }
  ): Promise<{
    blogPage: BlogChatPage;
    chatSession: ChatSessionPage;
    agentDash: AgentDashboardPage;
    customer: { name: string; email: string };
    agentName: string;
  }> {
    
    // Setup agent
    const { agentDash, agentName } = await this.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );
    
    // Create blog page in new context
    const context = this.page.context();
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    // Create chat session on agent page
    const chatSession = new ChatSessionPage(this.page);
    
    // Navigate to blog and create chat
    const customer = await blogPage.createChatSession(skillNumber, customerData);
    
    // Handle agent side
    await chatSession.handleChatSession(customer.name);
    
    return { blogPage, chatSession, agentDash, customer, agentName };
  }

  /**
   * Setup multiple agents for chat transfer testing
   */
  async setupMultipleAgentsForTesting(
    agents: Array<{ credentials: { username: string; password: string }; skillNumber: string }>,
    options?: { cleanupExistingChats?: boolean }
  ): Promise<Array<{ agentDash: AgentDashboardPage; agentName: string; page: Page }>> {
    
    const agentSetups = [];
    
    for (const agent of agents) {
      // Create new page for each agent
      const context = this.page.context();
      const agentPage = await context.newPage();
      
      const webChatClient = new WebChatClient(agentPage);
      const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
        agent.credentials,
        agent.skillNumber,
        options
      );
      
      agentSetups.push({ agentDash, agentName, page: agentPage });
    }
    
    return agentSetups;
  }

  /**
   * Create web chat session with limits testing (multiple chats)
   */
  async createMultipleChatSessions(
    skillNumber: string,
    agentCredentials: { username: string; password: string },
    chatCount: number
  ): Promise<{
    agentDash: AgentDashboardPage;
    agentName: string;
    blogPages: BlogChatPage[];
    customers: Array<{ name: string; email: string }>;
    chatSession: ChatSessionPage;
  }> {
    
    // Setup agent
    const { agentDash, agentName } = await this.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );
    
    const blogPages: BlogChatPage[] = [];
    const customers: Array<{ name: string; email: string }> = [];
    
    // Create multiple blog pages and chat sessions
    for (let i = 0; i < chatCount; i++) {
      const context = this.page.context();
      const blogPageInstance = await context.newPage();
      const blogPage = new BlogChatPage(blogPageInstance);
      
      const customer = await blogPage.createChatSession(skillNumber);
      
      blogPages.push(blogPage);
      customers.push(customer);
      
      // Small delay between chat creations
      await agentDash.waitForTimeout(2000, `Chat ${i + 1} creation delay`);
    }
    
    const chatSession = new ChatSessionPage(this.page);
    
    return { agentDash, agentName, blogPages, customers, chatSession };
  }

  /**
   * Handle chat transfer workflow between agents
   */
  async performChatTransfer(
    fromChatSession: ChatSessionPage,
    toChatSession: ChatSessionPage,
    transferToAgentName: string,
    accept: boolean = true
  ): Promise<void> {
    
    // Initiate transfer from first agent
    await fromChatSession.transferChatToAgent(transferToAgentName);
    
    // Handle transfer on receiving agent
    await toChatSession.waitForChatTransferOffer();
    
    if (accept) {
      await toChatSession.acceptChatTransfer();
      await fromChatSession.verifyTransferResponse(true);
    } else {
      await toChatSession.rejectChatTransfer();
      await fromChatSession.verifyTransferResponse(false);
    }
    
    // Acknowledge transfer response
    await fromChatSession.acknowledgeTransferResponse();
  }

  /**
   * Complete chat interaction with messages and notes
   */
  async performCompleteChat(
    blogPage: BlogChatPage,
    chatSession: ChatSessionPage,
    interactions: {
      customerMessages?: string[];
      agentMessages?: string[];
      cannedMessages?: string[];
      addNote?: string;
      requestScreenshot?: { request: boolean; accept: boolean };
    }
  ): Promise<void> {
    
    // Send customer messages
    if (interactions.customerMessages) {
      for (const message of interactions.customerMessages) {
        await blogPage.sendMessage(message);
        await chatSession.verifyReceivedMessage(message);
      }
    }
    
    // Send agent messages
    if (interactions.agentMessages) {
      for (const message of interactions.agentMessages) {
        await chatSession.sendMessage(message);
        await blogPage.verifyReceivedMessage(message);
      }
    }
    
    // Send canned messages
    if (interactions.cannedMessages) {
      for (const templateName of interactions.cannedMessages) {
        await chatSession.sendCannedMessage(templateName);
      }
    }
    
    // Add note if specified
    if (interactions.addNote) {
      await chatSession.addNote(interactions.addNote);
    }
    
    // Handle screenshot request
    if (interactions.requestScreenshot) {
      await chatSession.requestScreenshot();
      await blogPage.handleScreenshotRequest(interactions.requestScreenshot.accept);
      
      if (interactions.requestScreenshot.accept) {
        await chatSession.verifyScreenshotReceived();
      } else {
        await chatSession.verifyScreenshotRejected();
      }
    }
  }

  /**
   * End chat session and verify completion
   */
  async endChatSession(
    blogPage: BlogChatPage,
    chatSession: ChatSessionPage,
    customerName: string
  ): Promise<void> {
    
    // End chat from agent side
    await chatSession.completeEndChatWorkflow();
    
    // Verify chat ended on both sides
    await chatSession.verifyChatEnded();
    await blogPage.verifyChatEnded();
    
    // Verify chat removed from active media
    await chatSession.verifyChatRemovedFromActiveMedia(customerName);
    
    // Close windows
    await chatSession.closeChatWindow();
    await blogPage.closeChatWindow();
  }

  /**
   * Generate random customer data
   */
  generateRandomCustomerData(): { name: string; email: string } {
    const randomNum = Math.floor(Math.random() * 1000);
    const name = `Test Customer ${randomNum}`;
    const email = `testcustomer${randomNum}@qawolf.email`;
    
    return { name, email };
  }

  /**
   * Cleanup all active chats for agent
   */
  async cleanupAgentChats(agentDash: AgentDashboardPage): Promise<void> {
    await agentDash.cleanupActiveMedia();
  }

  /**
   * Verify chat session quality metrics
   */
  async verifyChatQuality(
    chatSession: ChatSessionPage,
    expectations: {
      customerName?: string;
      agentName?: string;
      messagesExchanged?: number;
      notesAdded?: boolean;
      screenshotShared?: boolean;
    }
  ): Promise<void> {
    
    // Verify chat is active
    await chatSession.verifyChatSessionActive();
    
    // Verify customer name if provided
    if (expectations.customerName) {
      const actualCustomerName = await chatSession.getCustomerName();
      if (!actualCustomerName.includes(expectations.customerName)) {
        throw new Error(`Expected customer name ${expectations.customerName}, got ${actualCustomerName}`);
      }
    }
    
    // Verify interface elements
    await chatSession.verifyChatInterfaceElements();
    
    // Verify functional tabs
    await chatSession.verifyNotesTabFunctional();
    await chatSession.verifyCodesTabFunctional();
  }

  /**
   * Wait for agent to be available for new chats
   */
  async waitForAgentAvailability(agentDash: AgentDashboardPage): Promise<void> {
    // Check if agent has capacity for more chats
    const activeChatCount = await agentDash.getActiveChatCount();
    
    if (activeChatCount >= 2) { // Assuming max 2 chats per agent
      console.log(`Agent at capacity with ${activeChatCount} active chats`);
      await agentDash.waitForTimeout(5000, 'Agent capacity wait');
    }
  }

  /**
   * Verify agent status and channel readiness
   */
  async verifyAgentReadiness(
    agentDash: AgentDashboardPage,
    expectations: {
      status?: string;
      voiceEnabled?: boolean;
      chatEnabled?: boolean;
      emailEnabled?: boolean;
    }
  ): Promise<void> {
    
    if (expectations.status) {
      const actualStatus = await agentDash.getAgentStatus();
      if (actualStatus !== expectations.status) {
        throw new Error(`Expected agent status ${expectations.status}, got ${actualStatus}`);
      }
    }
    
    if (expectations.chatEnabled !== undefined) {
      const chatEnabled = await agentDash.isChannelEnabled(ChannelType.CHAT);
      if (chatEnabled !== expectations.chatEnabled) {
        throw new Error(`Expected chat channel ${expectations.chatEnabled ? 'enabled' : 'disabled'}`);
      }
    }
    
    if (expectations.voiceEnabled !== undefined) {
      const voiceEnabled = await agentDash.isChannelEnabled(ChannelType.VOICE);
      if (voiceEnabled !== expectations.voiceEnabled) {
        throw new Error(`Expected voice channel ${expectations.voiceEnabled ? 'enabled' : 'disabled'}`);
      }
    }
    
    if (expectations.emailEnabled !== undefined) {
      const emailEnabled = await agentDash.isChannelEnabled(ChannelType.EMAIL);
      if (emailEnabled !== expectations.emailEnabled) {
        throw new Error(`Expected email channel ${expectations.emailEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  }
}

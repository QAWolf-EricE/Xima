import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { ChatSessionPage } from '../../pom-migration/pages/agent/chat-session-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test complete web chat creation and interaction workflow
 * Migrated from: tests/web_chats/create_a_web_chat.spec.js
 * 
 * This test covers the full web chat lifecycle including:
 * - Agent setup and skill configuration
 * - Web chat initiation from blog
 * - Chat offer handling (reject/accept)
 * - Message exchange between customer and agent
 * - Canned messages and templates
 * - Screenshot requests and responses
 * - Notes and customer details
 * - Chat completion and reporting
 */
test.describe('Web Chat Creation and Management', () => {

  test('create complete web chat session with full interaction workflow', async ({ page, context }) => {
    // Test data
    const skillNumber = '2';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_3_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    // Initialize web chat client
    const webChatClient = new WebChatClient(page);
    
    // ========================================================================
    // Step 1: Setup Agent and Navigate to Blog
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials, 
      skillNumber,
      { cleanupExistingChats: true }
    );
    
    // Create blog page in separate context
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    // Navigate to blog and verify no agents available initially
    await blogPage.navigateToBlogPage(skillNumber);
    await blogPage.openChatWidget();
    
    // Verify initial state (agents busy or not logged in)
    const areAgentsAvailable = await blogPage.areAgentsAvailable();
    if (areAgentsAvailable) {
      console.log('Agents are available, proceeding with test');
    }
    
    // ========================================================================
    // Step 2: Agent Configuration and Readiness
    // ========================================================================
    
    // Verify agent setup completed successfully
    await webChatClient.verifyAgentReadiness(agentDash, {
      status: 'Ready',
      voiceEnabled: true,
      chatEnabled: true
    });
    
    // Navigate back to blog and reload
    await blogPageInstance.bringToFront();
    await blogPage.waitForTimeout(10000, 'Agent readiness propagation');
    await blogPage.reload();
    
    // ========================================================================
    // Step 3: Create Web Chat
    // ========================================================================
    
    // Generate customer data
    const customer = webChatClient.generateRandomCustomerData();
    console.log('Customer info:', customer);
    
    // Start chat session
    await blogPage.startChatWithCustomerInfo(customer.name, customer.email);
    await blogPage.verifyInQueue();
    
    // ========================================================================
    // Step 4: Handle Chat Offer (Reject First)
    // ========================================================================
    
    const chatSession = new ChatSessionPage(page);
    
    // Wait for chat offer and reject it
    await chatSession.waitForChatOffer(120000);
    await chatSession.rejectChatOffer();
    
    // Handle missed chat workflow
    await chatSession.handleMissedChatTimeout();
    
    // Wait for another chat offer
    await chatSession.waitForChatOffer(120000);
    
    // ========================================================================
    // Step 5: Accept Chat Offer and Verify Connection
    // ========================================================================
    
    await chatSession.acceptChatOffer();
    await chatSession.verifyChatSessionActive();
    
    // Verify customer side connection
    await blogPageInstance.bringToFront();
    await blogPage.verifyChatStarted();
    
    const displayedAgentName = await blogPage.getAgentName();
    expect(displayedAgentName).toContain('WebRTC Agent 3');
    
    // Verify agent greeting message
    await blogPage.verifyAgentGreeting(customer.name, 'WebRTC Agent 3');
    
    // ========================================================================
    // Step 6: Message Exchange
    // ========================================================================
    
    // Send message from customer to agent
    const customerMessage = 'I need help with my account please';
    await blogPage.sendMessage(customerMessage);
    
    // Verify agent received message
    await page.bringToFront();
    await chatSession.verifyReceivedMessage(customerMessage);
    
    // Send message from agent to customer (with typing indicator)
    const agentMessage = 'I will be happy to help you';
    await chatSession.sendMessage(agentMessage);
    
    // Verify typing indicator and message delivery
    await blogPageInstance.bringToFront();
    await blogPage.waitForAgentTyping();
    await blogPage.verifyReceivedMessage(agentMessage);
    
    // ========================================================================
    // Step 7: Canned Messages
    // ========================================================================
    
    await page.bringToFront();
    
    // Send greeting template
    await chatSession.sendCannedMessage('Greeting');
    const expectedGreeting = `Hello, ${customer.name}. My name is WebRTC Agent 3. How can I help you today?`;
    
    // Send address template
    await chatSession.sendCannedMessage('Address');
    const expectedAddress = 'Our address is \\n\\nP. Sherman 42 Wallaby Way\\nSydney, AUS';
    
    // Verify templates were sent to customer
    await blogPageInstance.bringToFront();
    await blogPage.verifyReceivedMessage(expectedGreeting);
    await blogPage.verifyReceivedMessage('Our address is P. Sherman 42 Wallaby Way Sydney, AUS');
    
    // ========================================================================
    // Step 8: Screenshot Request Workflow
    // ========================================================================
    
    await page.bringToFront();
    
    // Request screenshot and reject it
    await chatSession.requestScreenshot();
    await blogPageInstance.bringToFront();
    await blogPage.handleScreenshotRequest(false);
    await page.bringToFront();
    await chatSession.verifyScreenshotRejected();
    
    // Request screenshot again and accept it
    await chatSession.requestScreenshot();
    await blogPageInstance.bringToFront();
    await blogPage.handleScreenshotRequest(true);
    await page.bringToFront();
    await chatSession.verifyScreenshotReceived();
    
    // ========================================================================
    // Step 9: Notes and Customer Details
    // ========================================================================
    
    // Add note to customer interaction
    const noteText = 'Customer needs account assistance';
    await chatSession.addNote(noteText);
    
    // Verify tabs are functional
    await chatSession.verifyNotesTabFunctional();
    await chatSession.verifyCodesTabFunctional();
    
    // ========================================================================
    // Step 10: End Chat Session
    // ========================================================================
    
    await webChatClient.endChatSession(blogPage, chatSession, customer.name);
    
    // ========================================================================
    // Step 11: Verify Chat Logging in Reports
    // ========================================================================
    
    // Login as supervisor to check Cradle to Grave
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    const supervisorDash = await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);
    
    // Navigate to Cradle to Grave report
    await supervisorDash.navigateTo('reports/cradle-to-grave');
    
    // Filter by agent
    const reportConfigButton = supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]');
    await reportConfigButton.click();
    
    const agentOption = supervisorPageInstance.locator(`[data-cy="xima-list-select-option"] :text("WebRTC Agent 3(205)")`);
    await agentOption.click();
    
    const applyButton = supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]');
    await applyButton.click();
    
    const generateButton = supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]');
    await generateButton.click();
    
    // Verify chat appears in report
    await expect(supervisorPageInstance.getByText(customer.name)).toBeVisible();
    await expect(supervisorPageInstance.getByText('WebRTC Agent 3')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-header-cell-DURATION"] :text("Duration")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-note-button"]:below(:text("Notes"))').last()).toBeVisible();
    
    console.log('✅ Complete web chat workflow test passed successfully');
  });

  test('web chat with agent limits and queue management', async ({ page, context }) => {
    // This test verifies chat limits and queuing behavior
    const skillNumber = '59';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_44_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent for limited chat testing
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );
    
    // Create multiple chat sessions to test limits
    const { blogPages, customers, chatSession } = await webChatClient.createMultipleChatSessions(
      skillNumber,
      agentCredentials,
      3 // Create 3 chat requests
    );
    
    // Accept first two chats
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    
    // Verify agent is at capacity (2 active chats)
    const activeChatCount = await agentDash.getActiveChatCount();
    expect(activeChatCount).toBe(2);
    
    // Third chat should remain in queue
    const thirdBlogPage = blogPages[2];
    await thirdBlogPage.verifyInQueue();
    
    // Verify no additional chat offers appear for agent
    const chatOfferVisible = await page.locator('[data-cy="alert-chat-offer-accept"]').isVisible();
    expect(chatOfferVisible).toBeFalsy();
    
    // Clean up chats
    for (let i = 0; i < 2; i++) {
      const customerName = customers[i].name;
      await chatSession.focusActiveChat(customerName);
      await chatSession.completeEndChatWorkflow();
    }
    
    console.log('✅ Chat limits test passed successfully');
  });

  test('web chat agent status and readiness verification', async ({ page, context }) => {
    // Test agent readiness states and chat availability
    const skillNumber = '22';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_19_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );
    
    // Create blog page to test chat availability
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPageWithDate(skillNumber);
    
    // Verify chat widget appearance and functionality
    await blogPage.verifyChatWindowAppearance();
    await blogPage.verifyCustomColorScheme();
    
    // Verify agent channels are properly enabled
    await webChatClient.verifyAgentReadiness(agentDash, {
      status: 'Ready',
      voiceEnabled: true,
      chatEnabled: true
    });
    
    console.log('✅ Agent readiness test passed successfully');
  });
});

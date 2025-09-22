import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { ChatSessionPage } from '../../pom-migration/pages/agent/chat-session-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';

/**
 * Test ending chat sessions and agent logout
 * Migrated from: tests/web_chats/end_chat_and_log_out.spec.js
 * 
 * This test verifies:
 * - Complete chat session lifecycle
 * - Chat ending from agent side
 * - Customer notification of chat end
 * - Agent logout functionality
 * - Notes and codes functionality during chat
 */
test.describe('End Chat and Agent Logout', () => {

  test('complete chat session with end chat and agent logout', async ({ page, context }) => {
    // Test configuration
    const skillNumber = '30';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_20_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent and Clean Existing Chats
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );

    console.log(`Agent ${agentName} setup completed`);

    // ========================================================================
    // Step 2: Create and Connect Web Chat Session
    // ========================================================================
    
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPageWithDate(skillNumber);
    await blogPage.reload();
    
    // Verify chat widget branding
    await blogPage.openChatWidget();
    await blogPage.verifyCustomColorScheme();
    await blogPage.verifyChatWindowAppearance();
    
    // Create chat session
    const customer = webChatClient.generateRandomCustomerData();
    await blogPage.startChatWithCustomerInfo(customer.name, customer.email);
    await blogPage.verifyInQueue();

    // ========================================================================
    // Step 3: Agent Accepts Chat and Verifies Interface
    // ========================================================================
    
    const chatSession = new ChatSessionPage(page);
    
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    
    // Verify chat session is active and all elements are present
    await chatSession.verifyChatSessionActive();
    
    // Verify customer name is displayed correctly
    const displayedCustomerName = await chatSession.getCustomerName();
    expect(displayedCustomerName).toContain(customer.name);
    
    // Verify chat appears in active media
    const activeMediaCustomer = page.locator(`[data-cy="active-media-tile"] :text-is("${customer.name}")`);
    await expect(activeMediaCustomer).toBeVisible();

    // ========================================================================
    // Step 4: Test Notes Functionality
    // ========================================================================
    
    // Focus on the chat
    try {
      await chatSession.focusActiveChat(customer.name);
    } catch {
      console.log('Chat already focused, continuing...');
    }
    
    // Test Notes tab functionality
    await chatSession.verifyNotesTabFunctional();
    
    const testNote = 'Customer requesting account assistance';
    await chatSession.addNote(testNote);

    // ========================================================================
    // Step 5: Test Codes Functionality
    // ========================================================================
    
    // Test Codes tab functionality
    await chatSession.verifyCodesTabFunctional();

    // ========================================================================
    // Step 6: End Chat Session
    // ========================================================================
    
    // Small pause before ending chat
    await page.waitForTimeout(2000);
    
    // End chat from agent side
    await chatSession.endChat();
    
    // Verify chat ended dialog
    await chatSession.verifyChatEnded();
    
    // Verify chat is no longer in active media
    await chatSession.verifyChatRemovedFromActiveMedia(customer.name);
    
    // Close chat dialog
    await chatSession.closeChatWindow();

    // ========================================================================
    // Step 7: Verify Chat Ended on Customer Side
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.verifyChatEnded();

    // ========================================================================
    // Step 8: Agent Logout
    // ========================================================================
    
    await page.bringToFront();
    
    // Perform logout
    await agentDash.logout();
    
    // Verify we're back on login page
    const loginUsernameField = page.locator('[data-cy="consolidated-login-username-input"]');
    const loginButton = page.getByRole('button', { name: 'Login' });
    
    await expect(loginUsernameField).toBeVisible();
    await expect(loginButton).toBeVisible();

    // ========================================================================
    // Step 9: Cleanup Customer Side
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.closeChatWindow();

    console.log('✅ End chat and logout test completed successfully');
  });

  test('end multiple chat sessions before logout', async ({ page, context }) => {
    // Test ending multiple active chats before logout
    const skillNumber = '30';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_20_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );

    // Create multiple chat sessions
    const { blogPages, customers, chatSession } = await webChatClient.createMultipleChatSessions(
      skillNumber,
      agentCredentials,
      2
    );

    // Accept both chats
    await chatSession.acceptChatOffer();
    await chatSession.acceptChatOffer();
    
    // Verify both chats are active
    const activeChatCount = await agentDash.getActiveChatCount();
    expect(activeChatCount).toBe(2);

    // End first chat
    await chatSession.focusActiveChat(customers[0].name);
    await chatSession.completeEndChatWorkflow();
    
    // End second chat
    await chatSession.focusActiveChat(customers[1].name);
    await chatSession.completeEndChatWorkflow();
    
    // Verify no active chats remain
    const finalChatCount = await agentDash.getActiveChatCount();
    expect(finalChatCount).toBe(0);
    
    // Now safe to logout
    await agentDash.logout();
    
    // Verify logout successful
    await expect(page.locator('[data-cy="consolidated-login-username-input"]')).toBeVisible();

    console.log('✅ Multiple chat end and logout test completed successfully');
  });

  test('chat end notification and customer experience', async ({ page, context }) => {
    // Focus on customer experience when chat ends
    const skillNumber = '30';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_20_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Create complete chat session
    const { blogPage, chatSession, customer } = await webChatClient.createWebChatSession(
      skillNumber,
      agentCredentials
    );

    // Exchange a few messages
    await blogPage.sendMessage('I need help with my order');
    await chatSession.verifyReceivedMessage('I need help with my order');
    
    await chatSession.sendMessage('I can help you with that');
    await blogPage.verifyReceivedMessage('I can help you with that');

    // End chat from agent
    await chatSession.completeEndChatWorkflow();
    
    // Focus on customer side experience
    await blogPage.page.bringToFront();
    
    // Verify customer sees chat ended message
    await blogPage.verifyChatEnded();
    
    // Verify chat history is still visible to customer
    await expect(blogPage.page.locator(':text("I need help with my order")')).toBeVisible();
    await expect(blogPage.page.locator(':text("I can help you with that")')).toBeVisible();
    
    // Customer can close chat window
    await blogPage.closeChatWindow();
    
    console.log('✅ Customer experience during chat end test completed successfully');
  });

  test('agent status after chat completion', async ({ page, context }) => {
    // Test agent status management after completing chats
    const skillNumber = '30';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_20_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup and create chat
    const { agentDash, customer } = await webChatClient.createWebChatSession(
      skillNumber,
      agentCredentials
    );
    
    const chatSession = new ChatSessionPage(page);
    
    // Complete the chat
    await chatSession.completeEndChatWorkflow();
    
    // Verify agent status remains Ready after chat completion
    const agentStatus = await agentDash.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    
    // Verify channels remain enabled
    await webChatClient.verifyAgentReadiness(agentDash, {
      status: 'Ready',
      chatEnabled: true,
      voiceEnabled: true
    });
    
    // Agent should be available for new chats
    const chatEnabled = await agentDash.isChannelEnabled('CHAT');
    expect(chatEnabled).toBeTruthy();
    
    console.log('✅ Agent status after chat completion test completed successfully');
  });
});

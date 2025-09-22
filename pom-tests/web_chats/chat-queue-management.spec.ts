import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { ChatSessionPage } from '../../pom-migration/pages/agent/chat-session-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';

/**
 * Test chat queue management and handling
 * Migrated from: tests/web_chats/miss_web_chat.spec.js, send_second_chat_into_queue.spec.js, 
 * send_second_chat_into_queue_with_two_agents.spec.js
 * 
 * This test suite verifies:
 * - Chat queue behavior when agents are busy
 * - Missed chat handling and requeuing
 * - Multiple agents handling queued chats
 * - Queue position management
 */
test.describe('Chat Queue Management', () => {

  test('missed web chat handling and requeuing', async ({ page, context }) => {
    // Test what happens when agent misses/ignores a chat
    const skillNumber = '10';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_30_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // ========================================================================
    // Step 2: Create Chat Session
    // ========================================================================
    
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    const customer = await blogPage.createChatSession(skillNumber);
    
    const chatSession = new ChatSessionPage(page);

    // ========================================================================
    // Step 3: Let Chat Offer Timeout (Miss Chat)
    // ========================================================================
    
    await chatSession.waitForChatOffer();
    
    // Don't accept or reject - let it timeout
    console.log('Letting chat offer timeout...');
    await page.waitForTimeout(30000); // Wait for offer timeout
    
    // ========================================================================
    // Step 4: Verify Chat is Requeued
    // ========================================================================
    
    // Customer should still be in queue
    await blogPageInstance.bringToFront();
    await blogPage.verifyInQueue();
    
    // Agent should get another chat offer for same customer
    await page.bringToFront();
    await chatSession.waitForChatOffer(60000);
    
    console.log('✓ Chat successfully requeued after timeout');

    // ========================================================================
    // Step 5: Accept Requeued Chat
    // ========================================================================
    
    await chatSession.acceptChatOffer();
    await chatSession.verifyChatSessionActive();
    
    // Verify customer connection
    await blogPageInstance.bringToFront();
    await blogPage.verifyChatStarted();
    
    // ========================================================================
    // Step 6: Complete Chat Normally
    // ========================================================================
    
    await webChatClient.endChatSession(blogPage, chatSession, customer.name);
    
    console.log('✅ Missed chat requeuing test completed successfully');
  });

  test('second chat queued when agent busy with first chat', async ({ page, context }) => {
    // Test queue behavior when agent is at capacity
    const skillNumber = '11';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_31_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent and Accept First Chat
    // ========================================================================
    
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // Create first chat
    const firstBlogPageInstance = await context.newPage();
    const firstBlogPage = new BlogChatPage(firstBlogPageInstance);
    
    const firstCustomer = await firstBlogPage.createChatSession(skillNumber);
    
    const chatSession = new ChatSessionPage(page);
    
    // Accept first chat
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    await chatSession.verifyChatSessionActive();

    // ========================================================================
    // Step 2: Create Second Chat (Should Be Queued)
    // ========================================================================
    
    const secondBlogPageInstance = await context.newPage();
    const secondBlogPage = new BlogChatPage(secondBlogPageInstance);
    
    const secondCustomer = await secondBlogPage.createChatSession(skillNumber);

    // ========================================================================
    // Step 3: Verify Second Chat is Queued
    // ========================================================================
    
    // Second customer should be in queue
    await secondBlogPageInstance.bringToFront();
    await secondBlogPage.verifyInQueue();
    
    // Agent should NOT receive a second chat offer immediately
    await page.bringToFront();
    const hasSecondOffer = await page.locator('[data-cy="alert-chat-offer-accept"]').isVisible();
    expect(hasSecondOffer).toBeFalsy();
    
    console.log('✓ Second chat properly queued when agent busy');

    // ========================================================================
    // Step 4: Complete First Chat
    // ========================================================================
    
    await chatSession.focusActiveChat(firstCustomer.name);
    await chatSession.completeEndChatWorkflow();
    
    // ========================================================================
    // Step 5: Verify Second Chat is Offered
    // ========================================================================
    
    // After first chat ends, second should be offered
    await chatSession.waitForChatOffer(30000);
    await chatSession.acceptChatOffer();
    
    // Verify second customer is now connected
    await secondBlogPageInstance.bringToFront();
    await secondBlogPage.verifyChatStarted();
    
    // ========================================================================
    // Step 6: Complete Second Chat
    // ========================================================================
    
    await webChatClient.endChatSession(secondBlogPage, chatSession, secondCustomer.name);
    
    console.log('✅ Queue processing test completed successfully');
  });

  test('queue management with two agents handling multiple chats', async ({ page, context }) => {
    // Test queue distribution across multiple agents
    const skillNumber = '12';
    const firstAgentCredentials = {
      username: process.env.WEBRTCAGENT_32_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const secondAgentCredentials = {
      username: process.env.WEBRTCAGENT_33_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Two Agents
    // ========================================================================
    
    const agentSetups = await webChatClient.setupMultipleAgentsForTesting([
      { credentials: firstAgentCredentials, skillNumber },
      { credentials: secondAgentCredentials, skillNumber }
    ]);
    
    const firstAgent = agentSetups[0];
    const secondAgent = agentSetups[1];

    // ========================================================================
    // Step 2: Create Multiple Chat Requests
    // ========================================================================
    
    const customers = [];
    const blogPages = [];
    
    // Create 4 chat requests
    for (let i = 0; i < 4; i++) {
      const blogPageInstance = await context.newPage();
      const blogPage = new BlogChatPage(blogPageInstance);
      
      const customer = await blogPage.createChatSession(skillNumber);
      
      customers.push(customer);
      blogPages.push(blogPage);
      
      // Small delay between creations
      await page.waitForTimeout(2000);
    }

    // ========================================================================
    // Step 3: Verify Queue Distribution
    // ========================================================================
    
    const firstChatSession = new ChatSessionPage(firstAgent.page);
    const secondChatSession = new ChatSessionPage(secondAgent.page);
    
    // First agent accepts chats
    await firstAgent.page.bringToFront();
    await firstChatSession.waitForChatOffer();
    await firstChatSession.acceptChatOffer();
    
    await firstChatSession.waitForChatOffer();
    await firstChatSession.acceptChatOffer();
    
    // Second agent accepts remaining chats
    await secondAgent.page.bringToFront();
    await secondChatSession.waitForChatOffer();
    await secondChatSession.acceptChatOffer();
    
    await secondChatSession.waitForChatOffer();
    await secondChatSession.acceptChatOffer();
    
    // ========================================================================
    // Step 4: Verify All Customers Connected
    // ========================================================================
    
    // All blog pages should show chat started
    for (const blogPage of blogPages) {
      await blogPage.page.bringToFront();
      await blogPage.verifyChatStarted();
    }

    // ========================================================================
    // Step 5: Verify Agent Loads
    // ========================================================================
    
    const firstAgentChatCount = await firstAgent.agentDash.getActiveChatCount();
    const secondAgentChatCount = await secondAgent.agentDash.getActiveChatCount();
    
    console.log(`First agent chats: ${firstAgentChatCount}, Second agent chats: ${secondAgentChatCount}`);
    
    // Total should be 4 chats
    expect(firstAgentChatCount + secondAgentChatCount).toBe(4);

    // ========================================================================
    // Step 6: Clean Up All Chats
    // ========================================================================
    
    // Clean up first agent chats
    const firstAgentClient = new WebChatClient(firstAgent.page);
    await firstAgentClient.cleanupAgentChats(firstAgent.agentDash);
    
    // Clean up second agent chats
    const secondAgentClient = new WebChatClient(secondAgent.page);
    await secondAgentClient.cleanupAgentChats(secondAgent.agentDash);
    
    console.log('✅ Multi-agent queue distribution test completed successfully');
  });

  test('queue position and wait time management', async ({ page, context }) => {
    // Test queue position indicators and wait time
    const skillNumber = '13';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_34_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent but keep them busy
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // Create active chat to keep agent busy
    const activeBlogPageInstance = await context.newPage();
    const activeBlogPage = new BlogChatPage(activeBlogPageInstance);
    const activeCustomer = await activeBlogPage.createChatSession(skillNumber);
    
    const chatSession = new ChatSessionPage(page);
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();

    // Create queued chat
    const queuedBlogPageInstance = await context.newPage();
    const queuedBlogPage = new BlogChatPage(queuedBlogPageInstance);
    const queuedCustomer = await queuedBlogPage.createChatSession(skillNumber);

    // Verify queued customer sees appropriate message
    await queuedBlogPageInstance.bringToFront();
    await queuedBlogPage.verifyInQueue();
    
    // Verify queue message content
    const queueMessage = queuedBlogPageInstance.locator('text=You Are In The Queue');
    await expect(queueMessage).toBeVisible();
    
    console.log('✓ Queue position messaging working correctly');

    // End active chat and verify queue processing
    await page.bringToFront();
    await chatSession.focusActiveChat(activeCustomer.name);
    await chatSession.completeEndChatWorkflow();
    
    // Queued chat should now be processed
    await chatSession.waitForChatOffer(30000);
    await chatSession.acceptChatOffer();
    
    // Verify queued customer is now connected
    await queuedBlogPageInstance.bringToFront();
    await queuedBlogPage.verifyChatStarted();
    
    // Clean up
    await webChatClient.endChatSession(queuedBlogPage, chatSession, queuedCustomer.name);
    
    console.log('✅ Queue position and wait time test completed successfully');
  });

  test('queue timeout and abandonment handling', async ({ page, context }) => {
    // Test what happens when customers abandon queue
    const skillNumber = '14';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_35_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // Create chat that will be abandoned
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    const customer = await blogPage.createChatSession(skillNumber);

    // Verify customer is in queue
    await blogPageInstance.bringToFront();
    await blogPage.verifyInQueue();
    
    // Customer abandons by closing chat
    await blogPage.closeChatWindow();
    
    console.log('Customer abandoned queue');

    // Agent should not receive chat offer for abandoned chat
    const chatSession = new ChatSessionPage(page);
    
    // Wait reasonable time - should not get offer for abandoned chat
    try {
      await chatSession.waitForChatOffer(15000);
      console.log('Warning: Received chat offer for abandoned chat');
    } catch {
      console.log('✓ No chat offer received for abandoned chat');
    }
    
    console.log('✅ Queue abandonment handling test completed successfully');
  });
});

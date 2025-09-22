import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { ChatSessionPage } from '../../pom-migration/pages/agent/chat-session-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';

/**
 * Test agent chat limits and queue management
 * Migrated from: tests/web_chats/web_chats_agent_chat_limits.spec.js
 * 
 * This test verifies:
 * - Agent can accept multiple chat sessions up to limit
 * - Additional chats are queued when agent at capacity
 * - Chat limits are properly enforced
 * - Queue management works correctly
 */
test.describe('Web Chat Agent Limits', () => {

  test('agent chat session limits and queue management', async ({ page, context }) => {
    // Test configuration
    const skillNumber = '59';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_44_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent with Skill 59
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );

    console.log(`Agent setup completed: ${agentName}`);

    // ========================================================================
    // Step 2: Create Multiple Web Chat Sessions
    // ========================================================================
    
    const chatSession = new ChatSessionPage(page);
    
    // Create first blog page and chat session
    const firstBlogPageInstance = await context.newPage();
    const firstBlogPage = new BlogChatPage(firstBlogPageInstance);
    
    await firstBlogPage.navigateToBlogPageWithDate(skillNumber);
    await firstBlogPage.waitForSkillPage(skillNumber);
    
    const firstCustomer = webChatClient.generateRandomCustomerData();
    await firstBlogPage.startChatWithCustomerInfo(firstCustomer.name, firstCustomer.email);

    // Verify first chat offer appears
    await page.bringToFront();
    const firstCustomerElement = page.locator(`:text-is("${firstCustomer.name}"):below(:text("Active Media")) >> nth=0`);
    await expect(firstCustomerElement).toBeVisible({ timeout: 45000 });

    // ========================================================================
    // Step 3: Create Second Chat Session
    // ========================================================================
    
    // Create second blog page
    const secondBlogPageInstance = await context.newPage();
    const secondBlogPage = new BlogChatPage(secondBlogPageInstance);
    
    await secondBlogPage.navigateToBlogPageWithDate(skillNumber);
    await secondBlogPage.waitForTimeout(4000, 'Page load');
    await secondBlogPage.reload();
    
    const secondCustomer = webChatClient.generateRandomCustomerData();
    await secondBlogPage.startChatWithCustomerInfo(secondCustomer.name, secondCustomer.email);

    // Verify agent still sees first customer (hasn't accepted yet)
    await page.bringToFront();
    await expect(firstCustomerElement).toBeVisible();
    console.log(`First customer: ${firstCustomer.name}, Second customer: ${secondCustomer.name}`);

    // ========================================================================
    // Step 4: Accept Multiple Chat Sessions
    // ========================================================================
    
    // Accept first chat
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    await chatSession.verifyChatSessionActive();

    // Accept second chat
    await chatSession.waitForChatOffer();
    await chatSession.acceptChatOffer();
    
    // Verify second chat can be selected
    const secondCustomerActiveMedia = page.locator(`[data-cy="active-media-chat-username"] :text("${secondCustomer.name}")`);
    await expect(secondCustomerActiveMedia).toBeVisible();
    await secondCustomerActiveMedia.click();

    // ========================================================================
    // Step 5: Test Chat Session Limits (Create Third Chat)
    // ========================================================================
    
    // Create third blog page (should exceed limit)
    const thirdBlogPageInstance = await context.newPage();
    const thirdBlogPage = new BlogChatPage(thirdBlogPageInstance);
    
    await thirdBlogPage.navigateToBlogPageWithDate(skillNumber);
    await thirdBlogPage.waitForTimeout(4000, 'Page load');
    await thirdBlogPage.reload();
    
    const thirdCustomer = webChatClient.generateRandomCustomerData();
    await thirdBlogPage.startChatWithCustomerInfo(thirdCustomer.name, thirdCustomer.email);

    // ========================================================================
    // Step 6: Verify Chat Limits Enforced
    // ========================================================================
    
    // Verify third customer is queued (no new chat offer for agent)
    await thirdBlogPage.verifyInQueue();
    
    await page.bringToFront();
    
    // Clean up any lingering emails to focus on chat testing
    const emailCount = await page.locator('[data-mat-icon-name="active-media-email"]').count();
    let attempts = 0;
    while (emailCount > 0 && attempts < 5) {
      await page.click('[data-mat-icon-name="active-media-email"]');
      await page.click('div:text-is("Mark as Complete")');
      await page.waitForTimeout(2000);
      attempts++;
    }
    
    // Verify exactly 2 active chats (at limit)
    await expect(page.locator('[data-cy="active-media-tile"]')).toHaveCount(2);
    
    // Verify no additional chat offers are presented
    const chatOfferAccept = page.locator('[data-cy="alert-chat-offer-accept"]');
    await expect(chatOfferAccept).not.toBeVisible();

    // ========================================================================
    // Step 7: Clean Up Active Chats
    // ========================================================================
    
    // End first chat
    const firstCustomerTile = page.locator(`:text-is("${firstCustomer.name}"):below(:text("Active Media")) >> nth=0`);
    await firstCustomerTile.click();
    await chatSession.completeEndChatWorkflow();
    await page.waitForTimeout(1000);

    // End second chat  
    const secondCustomerTile = page.locator(`:text-is("${secondCustomer.name}"):below(:text("Active Media")) >> nth=0`);
    await expect(secondCustomerTile).toBeVisible({ timeout: 60000 });
    await secondCustomerTile.click();
    await chatSession.completeEndChatWorkflow();

    // Set agent to Lunch status to prevent new chats
    await page.locator('[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])').click();
    await page.getByRole('menuitem', { name: 'Lunch' }).click();

    console.log('✅ Chat limits test completed successfully');
  });

  test('chat queue behavior when agent becomes available', async ({ page, context }) => {
    // Test that queued chats are processed when agent capacity becomes available
    const skillNumber = '59';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_44_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // Setup agent
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      { cleanupExistingChats: true }
    );

    // Create multiple chat sessions to fill capacity
    const { blogPages, customers, chatSession } = await webChatClient.createMultipleChatSessions(
      skillNumber,
      agentCredentials,
      3
    );

    // Accept first two chats to reach capacity
    await chatSession.acceptChatOffer();
    await chatSession.acceptChatOffer();
    
    // Verify third chat is queued
    await blogPages[2].verifyInQueue();
    
    // End one chat to free up capacity
    await chatSession.focusActiveChat(customers[0].name);
    await chatSession.completeEndChatWorkflow();
    
    // Verify queued chat is now offered to agent
    await chatSession.waitForChatOffer(30000);
    await chatSession.acceptChatOffer();
    
    // Verify third customer chat is now active
    await chatSession.verifyChatSessionActive();
    const thirdCustomerActive = page.locator(`[data-cy="active-media-chat-username"] :text("${customers[2].name}")`);
    await expect(thirdCustomerActive).toBeVisible();

    // Clean up remaining chats
    await webChatClient.cleanupAgentChats(agentDash);

    console.log('✅ Chat queue processing test completed successfully');
  });

  test('multiple agents with same skill sharing chat load', async ({ page, context }) => {
    // Test load distribution across multiple agents with same skill
    const skillNumber = '59';
    const agents = [
      { credentials: { username: process.env.WEBRTCAGENT_44_EMAIL || '', password: process.env.DEFAULT_PASSWORD || '' }, skillNumber },
      { credentials: { username: process.env.WEBRTCAGENT_43_EMAIL || '', password: process.env.DEFAULT_PASSWORD || '' }, skillNumber }
    ];

    const webChatClient = new WebChatClient(page);
    
    // Setup multiple agents
    const agentSetups = await webChatClient.setupMultipleAgentsForTesting(agents, {
      cleanupExistingChats: true
    });

    // Create multiple chat sessions
    const blogPages: BlogChatPage[] = [];
    const customers = [];
    
    for (let i = 0; i < 4; i++) {
      const blogPageInstance = await context.newPage();
      const blogPage = new BlogChatPage(blogPageInstance);
      
      await blogPage.navigateToBlogPageWithDate(skillNumber);
      const customer = await blogPage.createChatSession(skillNumber);
      
      blogPages.push(blogPage);
      customers.push(customer);
    }

    // Each agent should receive 2 chats (distributed load)
    const firstAgentSession = new ChatSessionPage(agentSetups[0].page);
    const secondAgentSession = new ChatSessionPage(agentSetups[1].page);
    
    // First agent accepts 2 chats
    await firstAgentSession.acceptChatOffer();
    await firstAgentSession.acceptChatOffer();
    
    // Second agent accepts remaining 2 chats
    await secondAgentSession.acceptChatOffer();  
    await secondAgentSession.acceptChatOffer();
    
    // Verify load distribution
    const firstAgentChatCount = await agentSetups[0].agentDash.getActiveChatCount();
    const secondAgentChatCount = await agentSetups[1].agentDash.getActiveChatCount();
    
    expect(firstAgentChatCount).toBe(2);
    expect(secondAgentChatCount).toBe(2);

    // Clean up
    for (const agent of agentSetups) {
      await webChatClient.cleanupAgentChats(agent.agentDash);
    }

    console.log('✅ Multi-agent load sharing test completed successfully');
  });
});

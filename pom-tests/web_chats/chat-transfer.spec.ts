import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { ChatSessionPage } from '../../pom-migration/pages/agent/chat-session-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test web chat transfer functionality between agents
 * Migrated from: tests/web_chats/chat_transfer.spec.js
 * 
 * This test covers chat transfer scenarios including:
 * - Multi-agent setup with same skill
 * - Chat creation and acceptance
 * - Chat transfer initiation 
 * - Transfer rejection and timeout handling
 * - Transfer acceptance and verification
 * - Cradle to Grave reporting of transferred chats
 */
test.describe('Web Chat Transfer Management', () => {

  test('complete chat transfer workflow with reject, timeout, and accept scenarios', async ({ page, context }) => {
    // Test configuration
    const skillNumber = '3';
    const firstAgentCredentials = {
      username: process.env.WEBRTCAGENT_26_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const secondAgentCredentials = {
      username: process.env.WEBRTCAGENT_25_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Multiple Agents with Same Skill
    // ========================================================================
    
    const agentSetups = await webChatClient.setupMultipleAgentsForTesting([
      { credentials: firstAgentCredentials, skillNumber },
      { credentials: secondAgentCredentials, skillNumber }
    ]);
    
    const firstAgent = agentSetups[0];
    const secondAgent = agentSetups[1];
    
    // Verify both agents are ready
    const firstAgentClient = new WebChatClient(firstAgent.page);
    const secondAgentClient = new WebChatClient(secondAgent.page);
    
    await firstAgentClient.verifyAgentReadiness(firstAgent.agentDash, {
      status: 'Ready',
      voiceEnabled: true,
      chatEnabled: true
    });
    
    await secondAgentClient.verifyAgentReadiness(secondAgent.agentDash, {
      status: 'Ready', 
      voiceEnabled: true,
      chatEnabled: true
    });
    
    console.log(`First agent: ${firstAgent.agentName}`);
    console.log(`Second agent: ${secondAgent.agentName}`);
    
    // ========================================================================
    // Step 2: Create Web Chat and Connect to First Agent
    // ========================================================================
    
    // Create blog page for customer
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPage(skillNumber);
    
    // Generate customer data and start chat
    const customer = firstAgentClient.generateRandomCustomerData();
    await blogPage.startChatWithCustomerInfo(customer.name, customer.email);
    await blogPage.verifyInQueue();
    
    // First agent handles the chat
    const firstChatSession = new ChatSessionPage(firstAgent.page);
    await firstChatSession.waitForChatOffer(120000);
    await firstChatSession.acceptChatOffer();
    await firstChatSession.verifyChatSessionActive();
    
    // Verify connection on blog side
    await blogPageInstance.bringToFront();
    await blogPage.verifyChatStarted();
    await blogPage.verifyAgentGreeting(customer.name, firstAgent.agentName);
    
    // ========================================================================
    // Step 3: Transfer Chat to Second Agent and Reject
    // ========================================================================
    
    await firstAgent.page.bringToFront();
    const secondChatSession = new ChatSessionPage(secondAgent.page);
    
    // Initiate transfer
    await firstChatSession.transferChatToAgent(secondAgent.agentName);
    
    // Second agent rejects transfer
    await secondAgent.page.bringToFront();
    await secondChatSession.waitForChatTransferOffer();
    await secondChatSession.rejectChatTransfer();
    
    // Verify transfer declined on first agent
    await firstAgent.page.bringToFront();
    await firstChatSession.verifyTransferResponse(false);
    await firstChatSession.acknowledgeTransferResponse();
    
    // ========================================================================
    // Step 4: Transfer Chat Again and Let It Timeout
    // ========================================================================
    
    // Initiate another transfer
    await firstChatSession.transferChatToAgent(secondAgent.agentName);
    
    // Second agent doesn't respond (timeout scenario)
    await secondAgent.page.bringToFront();
    await secondChatSession.waitForChatTransferOffer();
    
    // Wait for timeout (30 seconds)
    await secondAgent.page.waitForTimeout(30000);
    
    // Verify timeout on first agent (shows as declined)
    await firstAgent.page.bringToFront();
    await firstChatSession.verifyTransferResponse(false);
    await firstChatSession.acknowledgeTransferResponse();
    
    // ========================================================================
    // Step 5: Transfer Chat Successfully
    // ========================================================================
    
    // Third transfer attempt
    await firstChatSession.transferChatToAgent(secondAgent.agentName);
    
    // Second agent accepts transfer
    await secondAgent.page.bringToFront();
    await secondChatSession.waitForChatTransferOffer();
    await secondChatSession.acceptChatTransfer();
    
    // Verify transfer accepted on first agent
    await firstAgent.page.bringToFront();
    await firstChatSession.verifyTransferResponse(true);
    await firstChatSession.acknowledgeTransferResponse();
    
    // ========================================================================
    // Step 6: Verify Transfer Completed Successfully
    // ========================================================================
    
    // Verify chat history is available to second agent
    await secondAgent.page.bringToFront();
    await secondChatSession.verifyChatSessionActive();
    
    // Verify original greeting message is visible
    const originalGreeting = `Hello, ${customer.name}. My name is ${firstAgent.agentName}. How can I help you today?`;
    await secondChatSession.page.locator(`:text("${originalGreeting}")`).waitFor({ state: 'visible' });
    
    // ========================================================================
    // Step 7: Complete Chat from Second Agent
    // ========================================================================
    
    await secondChatSession.completeEndChatWorkflow();
    
    // ========================================================================
    // Step 8: Verify Transfer in Cradle to Grave Report
    // ========================================================================
    
    // Login as supervisor
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    const supervisorDash = await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);
    
    // Navigate to Cradle to Grave
    await supervisorDash.navigateTo('reports');
    await supervisorPageInstance.hover('[data-cy="sidenav-menu-REPORTS"]');
    await supervisorPageInstance.click(':text("Cradle to Grave")');
    
    // Configure report for the transferring agent
    try {
      await supervisorPageInstance.click('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]');
    } catch {
      // If not available, add agent parameter
      await supervisorPageInstance.click('xima-header-add button');
      await supervisorPageInstance.fill('[data-cy="xima-criteria-selector-search-input"]', 'Agent');
      await supervisorPageInstance.getByText('Agent', { exact: true }).click();
      await supervisorPageInstance.click('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]');
    }
    
    // Select the first agent (who initiated the transfer)
    const cleanAgentName = firstAgent.agentName.replace(/[\(\)]/g, '');
    await supervisorPageInstance.click(`[data-cy="xima-list-select-option"] :text("${cleanAgentName}")`);
    await supervisorPageInstance.click('[data-cy="agents-roles-dialog-apply-button"]');
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.click('[data-cy="configure-cradle-to-grave-container-apply-button"]');
    
    // Verify chat transfer appears in report
    await expect(supervisorPageInstance.locator(`:text("${customer.name}"):below(:text("Calling Party")) >> nth=0`)).toBeVisible();
    await expect(supervisorPageInstance.locator(`:text("WebRTC Agent 26"):below(:text("Receiving Party")) >> nth=0`)).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-header-cell-DURATION"] :text("Duration")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-note-button"]:below(:text("Notes")) >> nth=0')).toBeVisible();
    
    console.log('✅ Chat transfer workflow test passed successfully');
  });

  test('chat transfer with message exchange verification', async ({ page, context }) => {
    // Simplified transfer test focusing on message continuity
    const skillNumber = '3';
    const firstAgentCredentials = {
      username: process.env.WEBRTCAGENT_26_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const secondAgentCredentials = {
      username: process.env.WEBRTCAGENT_25_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // Setup agents
    const agentSetups = await webChatClient.setupMultipleAgentsForTesting([
      { credentials: firstAgentCredentials, skillNumber },
      { credentials: secondAgentCredentials, skillNumber }
    ]);
    
    const firstAgent = agentSetups[0];
    const secondAgent = agentSetups[1];
    
    // Create chat session
    const { blogPage, customer } = await webChatClient.createWebChatSession(
      skillNumber,
      firstAgentCredentials
    );
    
    const firstChatSession = new ChatSessionPage(firstAgent.page);
    const secondChatSession = new ChatSessionPage(secondAgent.page);
    
    // Exchange some messages before transfer
    await blogPage.sendMessage('I need help with billing');
    await firstChatSession.verifyReceivedMessage('I need help with billing');
    
    await firstChatSession.sendMessage('I can help you with that');
    await blogPage.verifyReceivedMessage('I can help you with that');
    
    // Transfer chat
    await webChatClient.performChatTransfer(
      firstChatSession,
      secondChatSession, 
      secondAgent.agentName,
      true // accept = true
    );
    
    // Verify message history is preserved after transfer
    const billingMessage = secondChatSession.page.locator(':text("I need help with billing")');
    await expect(billingMessage).toBeVisible();
    
    const helpMessage = secondChatSession.page.locator(':text("I can help you with that")');
    await expect(helpMessage).toBeVisible();
    
    // Continue conversation from second agent
    await secondChatSession.sendMessage('I have been transferred to assist you');
    await blogPage.verifyReceivedMessage('I have been transferred to assist you');
    
    // End chat from second agent
    await webChatClient.endChatSession(blogPage, secondChatSession, customer.name);
    
    console.log('✅ Chat transfer message continuity test passed successfully');
  });

  test('multiple agent availability for transfers', async ({ page, context }) => {
    // Test transfer options when multiple agents with same skill are available
    const skillNumber = '3';
    const agents = [
      { credentials: { username: process.env.WEBRTCAGENT_26_EMAIL || '', password: process.env.DEFAULT_PASSWORD || '' }, skillNumber },
      { credentials: { username: process.env.WEBRTCAGENT_25_EMAIL || '', password: process.env.DEFAULT_PASSWORD || '' }, skillNumber },
      { credentials: { username: process.env.WEBRTCAGENT_24_EMAIL || '', password: process.env.DEFAULT_PASSWORD || '' }, skillNumber }
    ];

    const webChatClient = new WebChatClient(page);
    
    // Setup multiple agents
    const agentSetups = await webChatClient.setupMultipleAgentsForTesting(agents);
    
    // Verify all agents are ready
    for (const agent of agentSetups) {
      const agentClient = new WebChatClient(agent.page);
      await agentClient.verifyAgentReadiness(agent.agentDash, {
        status: 'Ready',
        chatEnabled: true
      });
    }
    
    // Create chat with first agent
    const { blogPage, customer } = await webChatClient.createWebChatSession(
      skillNumber,
      agents[0].credentials
    );
    
    const firstChatSession = new ChatSessionPage(agentSetups[0].page);
    
    // Open transfer menu and verify multiple agents are available
    await firstChatSession.page.click('[data-cy="chat-header-menu-button"]');
    await firstChatSession.page.click('[data-cy="transfer-chat"]');
    
    // Verify other agents are listed as transfer options
    for (let i = 1; i < agentSetups.length; i++) {
      const transferOption = firstChatSession.page.locator(`[data-cy*="transfer-chat-to-agent-${agentSetups[i].agentName}"]`);
      await expect(transferOption).toBeVisible();
    }
    
    // Cancel transfer by clicking away
    await firstChatSession.page.click('[data-cy="chat-text-input"]');
    
    // End chat
    await webChatClient.endChatSession(blogPage, firstChatSession, customer.name);
    
    console.log('✅ Multiple agent transfer availability test passed successfully');
  });
});

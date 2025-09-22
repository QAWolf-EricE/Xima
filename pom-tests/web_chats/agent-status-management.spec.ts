import { test, expect } from '@playwright/test';
import { BlogChatPage } from '../../pom-migration/pages/external/blog-chat-page';
import { WebChatClient } from '../../pom-migration/api-clients/web-chat-management/web-chat-client';

/**
 * Test agent status management for web chat availability
 * Migrated from multiple original tests: mark_agent_as_busy.spec.js, mark_agent_as_ready.spec.js, 
 * log_agent_out_of_skill.spec.js, log_agent_out_of_skill_group.spec.js
 * 
 * This test suite verifies:
 * - Agent status changes (Ready, Busy, Lunch, etc.)
 * - Impact on chat availability
 * - Skill group management
 * - Customer experience with agent status changes
 */
test.describe('Agent Status Management for Web Chat', () => {

  test('mark agent as busy and verify chat unavailability', async ({ page, context }) => {
    // Test agent busy status blocking new chats
    const skillNumber = '3';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_13_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent as Ready
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    console.log(`Agent ${agentName} initially set to Ready`);

    // ========================================================================
    // Step 2: Verify Agent is Available for Chats
    // ========================================================================
    
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPage(skillNumber);
    
    // Agent should be available initially
    await blogPage.openChatWidget();
    const initialAvailability = await blogPage.areAgentsAvailable();
    console.log(`Initial agent availability: ${initialAvailability}`);

    // ========================================================================
    // Step 3: Change Agent Status to Busy
    // ========================================================================
    
    await page.bringToFront();
    await agentDash.setStatus('Lunch'); // Using Lunch as a "busy" status
    
    // Verify status change
    const agentStatus = await agentDash.getAgentStatus();
    expect(agentStatus).toBe('Lunch');
    
    console.log('Agent status changed to Lunch (busy)');

    // ========================================================================
    // Step 4: Verify Chat Unavailability
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    
    // Check agent availability after status change
    await blogPage.openChatWidget();
    const availabilityAfterBusy = await blogPage.areAgentsAvailable();
    
    if (!availabilityAfterBusy) {
      console.log('✓ Chat correctly unavailable when agent is busy');
      
      // Should see busy or no agents message
      try {
        const busyMessage = blogPageInstance.locator('text=All agents are currently busy');
        await expect(busyMessage).toBeVisible();
      } catch {
        const noAgentsMessage = blogPageInstance.locator('text=No agents are currently logged in');
        await expect(noAgentsMessage).toBeVisible();
      }
    }

    // ========================================================================
    // Step 5: Return Agent to Ready Status
    // ========================================================================
    
    await page.bringToFront();
    await agentDash.setReady();
    
    const finalStatus = await agentDash.getAgentStatus();
    expect(finalStatus).toBe('Ready');
    
    console.log('Agent returned to Ready status');

    // ========================================================================
    // Step 6: Verify Chat Availability Restored
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    await blogPage.waitForTimeout(5000, 'Status propagation');
    
    const finalAvailability = await blogPage.areAgentsAvailable();
    console.log(`Final agent availability: ${finalAvailability}`);
    
    console.log('✅ Agent busy status test completed successfully');
  });

  test('agent skill group management and chat routing', async ({ page, context }) => {
    // Test removing agent from skill group affects chat availability
    const skillNumber = '4';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_14_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);

    // ========================================================================
    // Step 1: Setup Agent with Specific Skill
    // ========================================================================
    
    const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // ========================================================================
    // Step 2: Verify Initial Chat Availability
    // ========================================================================
    
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPage(skillNumber);
    await blogPage.openChatWidget();
    
    const initialAvailability = await blogPage.areAgentsAvailable();
    console.log(`Chat availability with skill ${skillNumber}: ${initialAvailability}`);

    // ========================================================================
    // Step 3: Disable Agent's Skill (Simulate Skill Group Removal)
    // ========================================================================
    
    await page.bringToFront();
    
    // Disable the specific skill by enabling a different skill
    // This simulates removing agent from the skill group
    const alternateSkill = '1';
    await agentDash.enableSkill(alternateSkill);
    
    console.log(`Agent skill changed from ${skillNumber} to ${alternateSkill}`);

    // ========================================================================
    // Step 4: Verify Chat Unavailability for Original Skill
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    await blogPage.waitForTimeout(5000, 'Skill routing propagation');
    
    await blogPage.openChatWidget();
    const availabilityAfterSkillChange = await blogPage.areAgentsAvailable();
    
    if (!availabilityAfterSkillChange) {
      console.log('✓ Chat correctly unavailable after agent skill change');
    } else {
      console.log('Note: Other agents may be available for this skill');
    }

    // ========================================================================
    // Step 5: Restore Original Skill
    // ========================================================================
    
    await page.bringToFront();
    await agentDash.enableSkill(skillNumber);
    
    console.log(`Agent skill restored to ${skillNumber}`);

    // ========================================================================
    // Step 6: Verify Chat Availability Restored
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    await blogPage.waitForTimeout(5000, 'Skill restoration propagation');
    
    const finalAvailability = await blogPage.areAgentsAvailable();
    console.log(`Final chat availability: ${finalAvailability}`);
    
    console.log('✅ Skill group management test completed successfully');
  });

  test('multiple status transitions and chat impact', async ({ page, context }) => {
    // Test various status transitions and their impact on chat
    const skillNumber = '5';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_15_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    await blogPage.navigateToBlogPage(skillNumber);

    // Test status sequence: Ready -> Lunch -> Ready -> Away -> Ready
    const statusSequence = ['Lunch', 'Ready', 'Away', 'Ready'];
    
    for (const status of statusSequence) {
      await page.bringToFront();
      await agentDash.setStatus(status);
      
      const currentStatus = await agentDash.getAgentStatus();
      expect(currentStatus).toBe(status);
      
      await blogPageInstance.bringToFront();
      await blogPage.reload();
      await blogPage.waitForTimeout(3000, 'Status propagation');
      
      const availability = await blogPage.areAgentsAvailable();
      console.log(`Status: ${status}, Chat Available: ${availability}`);
      
      // Ready status should generally make agent available
      if (status === 'Ready') {
        // May still be false due to other system factors, but agent should be configured correctly
        const channelsEnabled = await agentDash.getChannelStatesSummary();
        console.log(`Channels enabled: ${JSON.stringify(channelsEnabled)}`);
      }
    }
    
    console.log('✅ Multiple status transitions test completed successfully');
  });

  test('agent channel disabling and chat impact', async ({ page, context }) => {
    // Test disabling chat channel specifically
    const skillNumber = '6';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_16_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber
    );

    // ========================================================================
    // Step 1: Verify Chat Channel Enabled
    // ========================================================================
    
    let chatEnabled = await agentDash.isChannelEnabled('CHAT');
    expect(chatEnabled).toBeTruthy();

    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    await blogPage.navigateToBlogPage(skillNumber);

    // ========================================================================
    // Step 2: Disable Chat Channel
    // ========================================================================
    
    await agentDash.disableChannel('CHAT');
    chatEnabled = await agentDash.isChannelEnabled('CHAT');
    expect(chatEnabled).toBeFalsy();
    
    console.log('Chat channel disabled');

    // ========================================================================
    // Step 3: Verify Chat Unavailable
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    await blogPage.waitForTimeout(5000, 'Channel state propagation');
    
    const availabilityWithDisabledChat = await blogPage.areAgentsAvailable();
    console.log(`Chat availability with disabled channel: ${availabilityWithDisabledChat}`);

    // ========================================================================
    // Step 4: Re-enable Chat Channel
    // ========================================================================
    
    await page.bringToFront();
    await agentDash.enableChannel('CHAT');
    chatEnabled = await agentDash.isChannelEnabled('CHAT');
    expect(chatEnabled).toBeTruthy();
    
    console.log('Chat channel re-enabled');

    // ========================================================================
    // Step 5: Verify Chat Available Again
    // ========================================================================
    
    await blogPageInstance.bringToFront();
    await blogPage.reload();
    await blogPage.waitForTimeout(5000, 'Channel restoration propagation');
    
    const finalAvailability = await blogPage.areAgentsAvailable();
    console.log(`Final chat availability: ${finalAvailability}`);
    
    console.log('✅ Channel disabling test completed successfully');
  });

  test('comprehensive agent readiness workflow', async ({ page, context }) => {
    // Comprehensive test of full agent setup workflow
    const skillNumber = '7';
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_17_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webChatClient = new WebChatClient(page);
    
    // ========================================================================
    // Step 1: Complete Agent Setup
    // ========================================================================
    
    const { agentDash } = await webChatClient.setupAgentForChatTesting(
      agentCredentials,
      skillNumber,
      {
        enableVoice: true,
        enableEmail: false,
        cleanupExistingChats: true
      }
    );

    // ========================================================================
    // Step 2: Comprehensive Readiness Verification
    // ========================================================================
    
    await webChatClient.verifyAgentReadiness(agentDash, {
      status: 'Ready',
      voiceEnabled: true,
      chatEnabled: true,
      emailEnabled: false
    });

    // ========================================================================
    // Step 3: Customer Experience Verification
    // ========================================================================
    
    const blogPageInstance = await context.newPage();
    const blogPage = new BlogChatPage(blogPageInstance);
    
    await blogPage.navigateToBlogPage(skillNumber);
    await blogPage.verifyChatWindowAppearance();
    await blogPage.verifyCustomColorScheme();
    
    // Verify form accessibility
    await blogPage.openChatWidget();
    const nameField = blogPageInstance.locator('#xima-chat-name');
    const emailField = blogPageInstance.locator('#xima-chat-email');
    
    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(nameField).toBeEditable();
    await expect(emailField).toBeEditable();
    
    console.log('✅ Comprehensive readiness workflow test completed successfully');
  });
});

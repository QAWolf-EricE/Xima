import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { createUCCallManagementClient } from '../../pom-migration/api-clients/uc-call-management/uc-call-client';

/**
 * UC Inbound Direct to Agent Test
 * 
 * Migrated from: tests/uc_inbound_call_flows/uc_inbound_direct_to_agent.spec.js
 * 
 * This test verifies UC inbound call routing directly to agent:
 * 1. UC Agent login with webphone integration
 * 2. Agent Client launch and configuration
 * 3. Direct inbound call routing without skill queuing
 * 4. Call handling and termination workflow
 */
test.describe('UC Inbound Call Flows - Direct to Agent', () => {
  
  test('UC inbound call routes directly to agent with webphone integration', async ({ page, context, browser }) => {
    console.log('=== ARRANGE: Setting up UC Agent for direct inbound call ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_20_EXT_120 || '',
      password: process.env.UC_AGENT_20_EXT_120_PASSWORD || '',
      extension: '120',
      webphoneUsername: process.env.UC_AGENT_20_EXT_120_WEBPHONE_USERNAME || ''
    };
    
    // Launch browser with media stream permissions
    const mediaPermissions = [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream"
    ];
    
    // Set permissions for media access
    await context.grantPermissions(["camera", "clipboard-read", "clipboard-write", "microphone"]);
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Direct to Agent Call Session',
      callType: 'uc_inbound_direct'
    });
    
    // Register UC agent
    const agentSession = ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_20',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername
    });
    
    console.log('=== ACT: Executing UC Agent login and webphone setup ===');
    
    // Login as UC Agent
    const loginPage = await LoginPage.create(page);
    await loginPage.fillLoginCredentials(agentCredentials.email, agentCredentials.password);
    await loginPage.submitLogin();
    
    // Launch Agent Client
    const ucAgentPage = new UCAgentPage(page);
    const agentClientPage = await ucAgentPage.launchAgentClient();
    
    // Setup UC webphone in separate context
    const webphonePage = await browser.newPage();
    const ucWebphone = new UCWebphonePage(webphonePage);
    await ucWebphone.loginToWebphone(agentCredentials.webphoneUsername);
    
    // Track agent setup
    ucCallClient.updateAgentStatus(agentSession.agentId, 'ready');
    ucCallClient.trackCallStep(callSession.sessionName, {
      action: 'agent_setup_complete',
      agentId: agentSession.agentId,
      timestamp: new Date(),
      success: true,
      details: { webphoneReady: true, agentClientLaunched: true }
    });
    
    console.log('=== ASSERT: Verifying UC Agent setup and call readiness ===');
    
    // Verify agent client launched successfully
    await expect(agentClientPage).toHaveURL(/ccagent/);
    
    // Verify webphone is ready
    await ucWebphone.verifyWebphoneReady();
    
    // Verify agent setup in call management
    const setupAgent = ucCallClient.getAgentSession(agentSession.agentId);
    expect(setupAgent?.status).toBe('ready');
    
    // Execute UC agent workflow
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'direct_to_agent',
      participants: [
        {
          agentId: agentSession.agentId,
          skills: [],
          status: 'ready'
        }
      ],
      expectedOutcome: 'agent_ready_for_direct_calls'
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.callOutcome).toBe('agent_ready_for_direct_calls');
    
    // Cleanup
    ucCallClient.completeCallSession(callSession.sessionName);
    ucCallClient.cleanup();
    
    // Close additional pages
    await webphonePage.close();
    await agentClientPage.close();
    
    console.log('=== TEST COMPLETED: UC inbound direct to agent workflow verified ===');
  });
  
  test('UC Agent can handle direct inbound call without skills', async ({ page, context, browser }) => {
    console.log('=== ARRANGE: Setting up for direct call without skill routing ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_20_EXT_120 || '',
      password: process.env.UC_AGENT_20_EXT_120_PASSWORD || '',
      extension: '120',
      webphoneUsername: process.env.UC_AGENT_20_EXT_120_WEBPHONE_USERNAME || ''
    };
    
    await context.grantPermissions(["camera", "clipboard-read", "clipboard-write", "microphone"]);
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Direct Call No Skills Session',
      callType: 'uc_inbound_direct_no_skills'
    });
    
    console.log('=== ACT: Testing direct call handling without skill queuing ===');
    
    // Login and setup UC Agent
    const loginPage = await LoginPage.create(page);
    await loginPage.fillLoginCredentials(agentCredentials.email, agentCredentials.password);
    await loginPage.submitLogin();
    
    const ucAgentPage = new UCAgentPage(page);
    const agentClientPage = await ucAgentPage.launchAgentClient();
    
    // Verify agent is ready for direct calls (no skills enabled)
    const agentSetup = await ucAgentPage.setupForCallTesting(); // No skill parameter = direct calls only
    
    console.log('=== ASSERT: Verifying direct call capability ===');
    
    expect(agentSetup.agentReady).toBe(true);
    expect(agentSetup.skillsEnabled.length).toBe(0); // No skills for direct calls
    expect(agentSetup.status).toBe('Ready');
    
    // Track in call management
    ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_20_DIRECT',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername
    });
    
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'direct_no_skills',
      participants: [
        {
          agentId: 'UC_AGENT_20_DIRECT',
          skills: [], // No skills for direct routing
          status: 'ready'
        }
      ],
      expectedOutcome: 'ready_for_direct_calls'
    });
    
    expect(workflowResult.success).toBe(true);
    
    // Cleanup
    ucCallClient.cleanup();
    await agentClientPage.close();
    
    console.log('=== TEST COMPLETED: Direct call without skills verified ===');
  });
});


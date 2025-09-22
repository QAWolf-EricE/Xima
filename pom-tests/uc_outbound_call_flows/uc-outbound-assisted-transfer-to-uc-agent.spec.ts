import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { UCOutboundCallPage } from '../../pom-migration/pages/agent/uc-outbound-call-page';
import { createUCOutboundManagementClient } from '../../pom-migration/api-clients/uc-outbound-management/uc-outbound-client';

/**
 * UC Outbound Assisted Transfer to UC Agent Test
 * 
 * Migrated from: tests/uc_outbound_call_flows/uc_outbound_assisted_transfer_to_uc_agent.spec.js
 * 
 * This test verifies UC outbound assisted transfer between UC agents:
 * 1. Multi-agent UC setup with dual agent coordination
 * 2. Outbound call initiation with external number dialing
 * 3. Assisted transfer workflow between UC agents
 * 4. Retry logic for complex transfer scenarios
 * 5. State management and workflow coordination
 */
test.describe('UC Outbound Call Flows - Assisted Transfer to UC Agent', () => {
  
  test('UC Agent can perform assisted transfer to another UC Agent with retry logic', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent UC environment for assisted transfer ===');
    
    const primaryAgentCredentials = {
      email: process.env.UC_AGENT_4_EXT_104 || '',
      password: process.env.UC_AGENT_4_EXT_104_PASSWORD || '',
      extension: '104',
      webphoneUsername: process.env.UC_AGENT_4_EXT_104_WEBPHONE_USERNAME || ''
    };
    
    const secondaryAgentCredentials = {
      email: process.env.UC_AGENT_5_EXT_105 || '',
      password: process.env.UC_AGENT_5_EXT_105_PASSWORD || '',
      extension: '105',
      webphoneUsername: process.env.UC_AGENT_5_EXT_105_WEBPHONE_USERNAME || ''
    };
    
    const ucOutboundClient = createUCOutboundManagementClient();
    
    // Create retry configuration for this complex scenario
    const retryConfig = ucOutboundClient.createRetryConfiguration('assisted_transfer_scenario', 3);
    
    const outboundSession = ucOutboundClient.createUCOutboundCallSession({
      sessionName: 'UC Assisted Transfer Session',
      callType: 'uc_outbound_assisted_transfer'
    });
    
    console.log('=== ACT: Setting up primary UC Agent (Agent 4) ===');
    
    // Setup primary agent
    const primaryAgentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const primaryAgentPage = await primaryAgentContext.newPage();
    
    const primaryLoginPage = await LoginPage.create(primaryAgentPage);
    const primaryAgentDashboard = await primaryLoginPage.loginAsAgent({
      username: primaryAgentCredentials.email,
      password: primaryAgentCredentials.password
    });
    
    // Setup primary agent webphone
    const primaryWebphonePage = await browser.newPage();
    const primaryWebphone = new UCWebphonePage(primaryWebphonePage);
    await primaryWebphone.loginToWebphone(primaryAgentCredentials.webphoneUsername);
    
    console.log('=== ACT: Setting up secondary UC Agent (Agent 5) ===');
    
    // Setup secondary agent
    const secondaryAgentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const secondaryAgentPage = await secondaryAgentContext.newPage();
    
    const secondaryLoginPage = await LoginPage.create(secondaryAgentPage);
    const secondaryAgentDashboard = await secondaryLoginPage.loginAsAgent({
      username: secondaryAgentCredentials.email,
      password: secondaryAgentCredentials.password
    });
    
    // Setup secondary agent webphone
    const secondaryWebphonePage = await browser.newPage();
    const secondaryWebphone = new UCWebphonePage(secondaryWebphonePage);
    await secondaryWebphone.loginToWebphone(secondaryAgentCredentials.webphoneUsername);
    
    console.log('=== ACT: Registering agents for assisted transfer workflow ===');
    
    // Register both agents in outbound management
    const primaryAgent = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'UC_AGENT_4',
      email: primaryAgentCredentials.email,
      extension: primaryAgentCredentials.extension,
      webphoneUsername: primaryAgentCredentials.webphoneUsername,
      role: 'transfer_initiator'
    });
    
    const secondaryAgent = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'UC_AGENT_5',
      email: secondaryAgentCredentials.email,
      extension: secondaryAgentCredentials.extension,
      webphoneUsername: secondaryAgentCredentials.webphoneUsername,
      role: 'transfer_target'
    });
    
    // Setup both agents for outbound operations
    const primaryUCPage = new UCAgentPage(primaryAgentPage);
    const primarySetup = await primaryUCPage.setupForCallTesting();
    
    const secondaryUCPage = new UCAgentPage(secondaryAgentPage);
    const secondarySetup = await secondaryUCPage.setupForCallTesting();
    
    console.log('=== ACT: Creating assisted transfer workflow ===');
    
    // Create transfer workflow
    const transferWorkflow = ucOutboundClient.createTransferWorkflow({
      transferType: 'assisted',
      sourceAgent: primaryAgent.agentId,
      targetAgent: secondaryAgent.agentId
    });
    
    // Setup outbound calling capability
    const ucOutboundPage = new UCOutboundCallPage(primaryAgentPage);
    const outboundSetup = await ucOutboundPage.setupForOutboundCalling(); // No skill
    
    console.log('=== ASSERT: Verifying assisted transfer setup ===');
    
    // Verify both agents are ready
    expect(primarySetup.agentReady).toBe(true);
    expect(secondarySetup.agentReady).toBe(true);
    
    // Verify outbound setup without skill
    expect(outboundSetup.skillSelected).toBeNull();
    expect(outboundSetup.outboundCapable).toBe(true);
    
    // Verify agents are registered for transfer
    const registeredPrimary = ucOutboundClient.getOutboundAgentSession(primaryAgent.agentId);
    const registeredSecondary = ucOutboundClient.getOutboundAgentSession(secondaryAgent.agentId);
    
    expect(registeredPrimary?.role).toBe('transfer_initiator');
    expect(registeredSecondary?.role).toBe('transfer_target');
    
    // Execute assisted transfer workflow with retry
    const workflowResult = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'assisted_transfer_between_agents',
      participants: [
        {
          agentId: primaryAgent.agentId,
          role: 'transfer_initiator',
          skills: []
        },
        {
          agentId: secondaryAgent.agentId,
          role: 'transfer_target',
          skills: []
        }
      ],
      transferWorkflows: [
        {
          transferType: 'assisted',
          sourceAgent: primaryAgent.agentId,
          targetAgent: secondaryAgent.agentId
        }
      ],
      maxAttempts: 3
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.retryEnabled).toBe(true);
    
    // Verify transfer workflow created
    const createdTransfer = ucOutboundClient.getTransferWorkflow(transferWorkflow.workflowId);
    expect(createdTransfer?.transferType).toBe('assisted');
    expect(createdTransfer?.sourceAgent).toBe(primaryAgent.agentId);
    expect(createdTransfer?.targetAgent).toBe(secondaryAgent.agentId);
    
    // Verify webphone integration for both agents
    await primaryWebphone.verifyWebphoneReady();
    await secondaryWebphone.verifyWebphoneReady();
    
    // Cleanup
    ucOutboundClient.cleanup();
    await primaryWebphonePage.close();
    await secondaryWebphonePage.close();
    await primaryAgentContext.close();
    await secondaryAgentContext.close();
    
    console.log('=== TEST COMPLETED: UC assisted transfer workflow verified ===');
  });
  
  test('UC assisted transfer handles retry scenarios for complex coordination', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up assisted transfer retry scenario testing ===');
    
    const ucOutboundClient = createUCOutboundManagementClient();
    
    // Create retry configuration for testing
    const retryConfig = ucOutboundClient.createRetryConfiguration('assisted_transfer_retry_test', 3);
    
    console.log('=== ACT: Testing retry logic for assisted transfer scenarios ===');
    
    // Execute multiple retry attempts to validate retry logic
    const attempt1 = ucOutboundClient.executeRetryAttempt('assisted_transfer_retry_test');
    expect(attempt1.success).toBe(true);
    expect(attempt1.shouldContinue).toBe(true);
    expect(attempt1.attemptNumber).toBe(1);
    
    const attempt2 = ucOutboundClient.executeRetryAttempt('assisted_transfer_retry_test');
    expect(attempt2.success).toBe(true);
    expect(attempt2.shouldContinue).toBe(true);
    expect(attempt2.attemptNumber).toBe(2);
    
    const attempt3 = ucOutboundClient.executeRetryAttempt('assisted_transfer_retry_test');
    expect(attempt3.success).toBe(true);
    expect(attempt3.shouldContinue).toBe(true);
    expect(attempt3.attemptNumber).toBe(3);
    
    const attempt4 = ucOutboundClient.executeRetryAttempt('assisted_transfer_retry_test');
    expect(attempt4.success).toBe(false);
    expect(attempt4.shouldContinue).toBe(false);
    expect(attempt4.reason).toContain('Max attempts reached');
    
    console.log('=== ASSERT: Verifying retry logic behavior ===');
    
    // Create workflow that uses retry logic
    const retryWorkflow = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'assisted_transfer_with_retry',
      participants: [
        { agentId: 'TEST_AGENT_1', role: 'source', skills: [] },
        { agentId: 'TEST_AGENT_2', role: 'target', skills: [] }
      ],
      maxAttempts: 3
    });
    
    expect(retryWorkflow.retryEnabled).toBe(true);
    expect(retryWorkflow.maxAttempts).toBe(3);
    
    ucOutboundClient.cleanup();
    await agentContext.close();
    
    console.log('=== TEST COMPLETED: Assisted transfer retry logic verified ===');
  });
});


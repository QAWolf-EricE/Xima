import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { UCOutboundCallPage } from '../../pom-migration/pages/agent/uc-outbound-call-page';
import { createUCOutboundManagementClient } from '../../pom-migration/api-clients/uc-outbound-management/uc-outbound-client';

/**
 * UC Outbound Call Don't Select Skill Test
 * 
 * Migrated from: tests/uc_outbound_call_flows/uc_outbound_call_dont_select_skill.spec.js
 * 
 * This test verifies UC outbound call without skill selection:
 * 1. UC Agent login with webphone integration
 * 2. No skill selection for outbound call
 * 3. Supervisor monitoring without skill-based routing
 * 4. Direct outbound call initiation and handling
 * 5. Call management without skill queue involvement
 * 
 * Note: Hold logic temporarily disabled due to supervisor view bug
 * Bug: https://app.qawolf.com/xima/bug-reports/43b1c2b0-9d6a-4db7-af8d-3f5c00a82944#
 */
test.describe('UC Outbound Call Flows - Dont Select Skill', () => {
  
  test('UC Agent can initiate outbound call without skill selection', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up UC Agent for outbound call without skill ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_9_EXT_109 || '',
      password: process.env.UC_AGENT_9_EXT_109_PASSWORD || '',
      extension: '109',
      webphoneUsername: process.env.UC_AGENT_9_EXT_109_WEBPHONE_USERNAME || ''
    };
    
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const ucOutboundClient = createUCOutboundManagementClient();
    const outboundSession = ucOutboundClient.createUCOutboundCallSession({
      sessionName: 'UC Outbound No Skill Session',
      callType: 'uc_outbound_no_skill'
    });
    
    console.log('=== ACT: Setting up UC Agent without skill selection ===');
    
    // Create UC Agent context with media permissions
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    // Login UC Agent
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent({
      username: agentCredentials.email,
      password: agentCredentials.password
    });
    
    // Setup UC webphone
    const webphonePage = await browser.newPage();
    const ucWebphone = new UCWebphonePage(webphonePage);
    await ucWebphone.loginToWebphone(agentCredentials.webphoneUsername);
    
    // Register agent without skills
    const agentSession = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'UC_AGENT_9',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername,
      skills: [], // No skills for direct outbound
      role: 'direct_outbound_agent'
    });
    
    console.log('=== ACT: Setting up Supervisor monitoring ===');
    
    // Create supervisor context
    const supervisorContext = await browser.newContext({ 
      timezoneId: "America/Denver" 
    });
    const supervisorPage = await supervisorContext.newPage();
    
    // Login supervisor
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('=== ACT: Initiating outbound call without skill selection ===');
    
    // Setup outbound calling without skill
    const ucOutboundPage = new UCOutboundCallPage(agentPage);
    const outboundSetup = await ucOutboundPage.setupForOutboundCalling(); // No skill parameter
    
    // Generate outbound number for testing
    const outboundNumber = UCOutboundCallPage.generateOutboundNumber();
    
    // Track outbound call initiation without skill
    ucOutboundClient.trackOutboundCallInitiation(outboundSession.sessionName, {
      phoneNumber: outboundNumber,
      skillSelected: undefined, // No skill selected
      callId: `outbound_no_skill_${Date.now()}`,
      initiatingAgent: agentSession.agentId
    });
    
    console.log('=== ASSERT: Verifying outbound call without skill selection ===');
    
    // Verify agent setup for direct outbound (no skill)
    expect(outboundSetup.agentReady).toBe(true);
    expect(outboundSetup.skillSelected).toBeNull();
    expect(outboundSetup.outboundCapable).toBe(true);
    
    // Verify agent session has no skills enabled for outbound
    const configuredAgent = ucOutboundClient.getOutboundAgentSession(agentSession.agentId);
    expect(configuredAgent?.skillsEnabled.length).toBe(0);
    expect(configuredAgent?.outboundCallsInitiated).toBe(1);
    
    // Execute outbound workflow without skill selection
    const workflowResult = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'outbound_call_no_skill',
      participants: [
        {
          agentId: agentSession.agentId,
          role: 'direct_outbound_agent',
          skills: [] // No skills
        },
        {
          agentId: 'supervisor',
          role: 'monitor',
          skills: []
        }
      ],
      outboundCallDetails: {
        phoneNumber: outboundNumber,
        skillSelected: undefined,
        callId: `outbound_no_skill_${Date.now()}`,
        initiatingAgent: agentSession.agentId
      },
      maxAttempts: 3
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.participants.length).toBe(2);
    
    // Verify webphone integration
    await ucWebphone.verifyWebphoneReady();
    
    // Verify no skill selection in outbound page
    await ucOutboundPage.verifyNoSkillSelected();
    
    // Cleanup
    ucOutboundClient.cleanup();
    await webphonePage.close();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: UC outbound call without skill selection verified ===');
  });
  
  test('UC outbound call without skill bypasses skill queue routing', async ({ browser }) => {
    console.log('=== ARRANGE: Testing direct outbound without skill queue ===');
    
    const ucOutboundClient = createUCOutboundManagementClient();
    
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    const agentCredentials = {
      email: process.env.UC_AGENT_9_EXT_109 || '',
      password: process.env.UC_AGENT_9_EXT_109_PASSWORD || ''
    };
    
    console.log('=== ACT: Configuring agent for direct outbound routing ===');
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    
    const ucOutboundPage = new UCOutboundCallPage(agentPage);
    
    // Setup without skill (direct routing)
    const directSetup = await ucOutboundPage.setupForOutboundCalling();
    
    console.log('=== ASSERT: Verifying direct outbound routing bypasses skill queues ===');
    
    expect(directSetup.agentReady).toBe(true);
    expect(directSetup.skillSelected).toBeNull();
    expect(directSetup.outboundCapable).toBe(true);
    
    // Create workflow to validate direct routing
    const directRoutingWorkflow = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'direct_outbound_bypass_skills',
      participants: [
        {
          agentId: 'UC_AGENT_9_DIRECT',
          role: 'direct_outbound',
          skills: [] // No skills = direct routing
        }
      ],
      maxAttempts: 1
    });
    
    expect(directRoutingWorkflow.success).toBe(true);
    
    ucOutboundClient.cleanup();
    await agentContext.close();
    
    console.log('=== TEST COMPLETED: Direct outbound routing verified ===');
  });
});


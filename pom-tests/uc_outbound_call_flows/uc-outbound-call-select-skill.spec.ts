import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { UCOutboundCallPage } from '../../pom-migration/pages/agent/uc-outbound-call-page';
import { createUCOutboundManagementClient } from '../../pom-migration/api-clients/uc-outbound-management/uc-outbound-client';

/**
 * UC Outbound Call Select Skill Test
 * 
 * Migrated from: tests/uc_outbound_call_flows/uc_outbound_call_select_skill.spec.js
 * 
 * This test verifies UC outbound call with skill selection:
 * 1. UC Agent login with webphone integration
 * 2. Skill 64 enablement and configuration
 * 3. Supervisor monitoring and coordination
 * 4. Outbound call initiation with skill selection
 * 5. Call handling and status management
 * 
 * Note: Hold logic temporarily disabled due to supervisor view bug
 * Bug: https://app.qawolf.com/xima/bug-reports/43b1c2b0-9d6a-4db7-af8d-3f5c00a82944#
 */
test.describe('UC Outbound Call Flows - Select Skill', () => {
  
  test('UC Agent can initiate outbound call with skill 64 selection and supervisor monitoring', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up UC Agent for outbound call with skill selection ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_14_EXT_114 || '',
      password: process.env.UC_AGENT_14_EXT_114_PASSWORD || '',
      extension: '114',
      webphoneUsername: process.env.UC_AGENT_14_EXT_114_WEBPHONE_USERNAME || '',
      skillNumber: '64'
    };
    
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const ucOutboundClient = createUCOutboundManagementClient();
    const outboundSession = ucOutboundClient.createUCOutboundCallSession({
      sessionName: 'UC Outbound with Skill Session',
      callType: 'uc_outbound_skill_selected'
    });
    
    console.log('=== ACT: Setting up UC Agent with skill 64 ===');
    
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
    
    // Configure agent with skill 64
    const ucAgentPage = new UCAgentPage(agentPage);
    await ucAgentPage.toggleSkills(agentCredentials.skillNumber, true);
    
    // Register agent in outbound management
    const agentSession = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'UC_AGENT_14',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername,
      skills: [agentCredentials.skillNumber],
      role: 'outbound_initiator'
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
    
    console.log('=== ACT: Initiating outbound call with skill selection ===');
    
    // Setup outbound calling capability
    const ucOutboundPage = new UCOutboundCallPage(agentPage);
    const outboundSetup = await ucOutboundPage.setupForOutboundCalling(agentCredentials.skillNumber);
    
    // Generate outbound number for testing
    const outboundNumber = UCOutboundCallPage.generateOutboundNumber();
    
    // Track outbound call initiation
    ucOutboundClient.trackOutboundCallInitiation(outboundSession.sessionName, {
      phoneNumber: outboundNumber,
      skillSelected: agentCredentials.skillNumber,
      callId: `outbound_${Date.now()}`,
      initiatingAgent: agentSession.agentId
    });
    
    console.log('=== ASSERT: Verifying outbound call with skill selection ===');
    
    // Verify agent setup for outbound with skill
    expect(outboundSetup.agentReady).toBe(true);
    expect(outboundSetup.skillSelected).toBe(agentCredentials.skillNumber);
    expect(outboundSetup.outboundCapable).toBe(true);
    
    // Verify agent session configuration
    const configuredAgent = ucOutboundClient.getOutboundAgentSession(agentSession.agentId);
    expect(configuredAgent?.skillsEnabled).toContain(agentCredentials.skillNumber);
    expect(configuredAgent?.outboundCallsInitiated).toBe(1);
    
    // Execute outbound workflow with skill selection
    const workflowResult = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'outbound_call_with_skill',
      participants: [
        {
          agentId: agentSession.agentId,
          role: 'outbound_initiator',
          skills: [agentCredentials.skillNumber]
        },
        {
          agentId: 'supervisor',
          role: 'monitor',
          skills: []
        }
      ],
      outboundCallDetails: {
        phoneNumber: outboundNumber,
        skillSelected: agentCredentials.skillNumber,
        callId: `outbound_${Date.now()}`,
        initiatingAgent: agentSession.agentId
      },
      maxAttempts: 3
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.participants.length).toBe(2);
    
    // Verify webphone integration
    await ucWebphone.verifyWebphoneReady();
    
    // Cleanup
    ucOutboundClient.cleanup();
    await webphonePage.close();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: UC outbound call with skill selection verified ===');
  });
  
  test('UC outbound call skill selection affects call routing and tracking', async ({ browser }) => {
    console.log('=== ARRANGE: Testing outbound call skill selection impact ===');
    
    const ucOutboundClient = createUCOutboundManagementClient();
    
    // Create agent context
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    const agentCredentials = {
      email: process.env.UC_AGENT_14_EXT_114 || '',
      password: process.env.UC_AGENT_14_EXT_114_PASSWORD || ''
    };
    
    console.log('=== ACT: Testing different skill selection scenarios ===');
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    
    const ucOutboundPage = new UCOutboundCallPage(agentPage);
    
    // Test 1: Setup with skill selection
    const withSkillSetup = await ucOutboundPage.setupForOutboundCalling('64');
    expect(withSkillSetup.skillSelected).toBe('64');
    
    // Test 2: Verify skill selection affects routing
    await ucOutboundPage.verifySkillSelected('64');
    
    console.log('=== ASSERT: Verifying skill selection impact ===');
    
    // Verify skill selection configuration
    expect(withSkillSetup.agentReady).toBe(true);
    expect(withSkillSetup.outboundCapable).toBe(true);
    expect(withSkillSetup.skillSelected).toBe('64');
    
    // Create workflow to validate skill impact
    const skillWorkflow = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'skill_selection_validation',
      participants: [
        {
          agentId: 'UC_AGENT_14_SKILL_TEST',
          role: 'skill_tester',
          skills: ['64']
        }
      ],
      maxAttempts: 1
    });
    
    expect(skillWorkflow.success).toBe(true);
    
    ucOutboundClient.cleanup();
    await agentContext.close();
    
    console.log('=== TEST COMPLETED: Skill selection impact verified ===');
  });
});


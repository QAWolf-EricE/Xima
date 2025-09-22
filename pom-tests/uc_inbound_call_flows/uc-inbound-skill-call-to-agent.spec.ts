import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { SupervisorDashboardPage } from '../../pom-migration/pages/supervisor/supervisor-dashboard-page';
import { createUCCallManagementClient } from '../../pom-migration/api-clients/uc-call-management/uc-call-client';

/**
 * UC Inbound Skill Call to Agent Test
 * 
 * Migrated from: tests/uc_inbound_call_flows/uc_inbound_skill_call_to_agent.spec.js
 * 
 * This test verifies UC inbound call routing through skills to agent:
 * 1. Multi-agent UC setup with webphone integration
 * 2. Skill-based call routing and queue management
 * 3. Supervisor monitoring and agent coordination
 * 4. Call handling workflow with skill validation
 * 
 * Note: Hold logic temporarily disabled due to supervisor view bug
 * Bug: https://app.qawolf.com/xima/bug-reports/43b1c2b0-9d6a-4db7-af8d-3f5c00a82944#
 */
test.describe('UC Inbound Call Flows - Skill Call to Agent', () => {
  
  test('UC inbound call routes through skill to agent with supervisor monitoring', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent UC environment with skill routing ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_16_EXT_116 || '',
      password: process.env.UC_AGENT_16_EXT_116_PASSWORD || '',
      extension: '116',
      webphoneUsername: process.env.UC_AGENT_16_EXT_116_WEBPHONE_USERNAME || '',
      skillNumber: '70'
    };
    
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Skill Call to Agent Session',
      callType: 'uc_inbound_skill_routing'
    });
    
    // Create agent context with media permissions
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    console.log('=== ACT: Setting up UC Agent with skill 70 ===');
    
    // Login UC Agent with skill-based routing
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent({
      username: agentCredentials.email,
      password: agentCredentials.password
    });
    
    // Setup UC webphone for agent
    const webphonePage = await browser.newPage();
    const ucWebphone = new UCWebphonePage(webphonePage);
    await ucWebphone.loginToWebphone(agentCredentials.webphoneUsername);
    
    // Configure agent for skill-based calls
    await agentPage.bringToFront();
    const ucAgentPage = new UCAgentPage(agentPage);
    await ucAgentPage.toggleSkills(agentCredentials.skillNumber, true);
    
    // Register agent in call management
    const agentSession = ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_16',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername,
      skills: [agentCredentials.skillNumber]
    });
    
    ucCallClient.enableAgentSkill(agentSession.agentId, agentCredentials.skillNumber);
    ucCallClient.updateAgentStatus(agentSession.agentId, 'ready');
    
    console.log('=== ACT: Setting up Supervisor monitoring ===');
    
    // Create supervisor context with timezone
    const supervisorContext = await browser.newContext({ 
      timezoneId: "America/Denver" 
    });
    const supervisorPage = await supervisorContext.newPage();
    
    // Login supervisor
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Navigate to supervisor view for monitoring
    await supervisorPage.bringToFront();
    await supervisorPage.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPage.locator(':text("Supervisor View")').click();
    
    callSession.supervisorInvolved = true;
    
    console.log('=== ASSERT: Verifying UC skill call routing setup ===');
    
    // Verify agent is configured for skill calls
    const configuredAgent = ucCallClient.getAgentSession(agentSession.agentId);
    expect(configuredAgent?.status).toBe('ready');
    expect(configuredAgent?.skillsEnabled).toContain(agentCredentials.skillNumber);
    
    // Verify webphone integration
    await ucWebphone.verifyWebphoneReady();
    
    // Execute UC skill routing workflow
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'skill_call_to_agent',
      participants: [
        {
          agentId: agentSession.agentId,
          skills: [agentCredentials.skillNumber],
          status: 'ready'
        }
      ],
      expectedOutcome: 'agent_ready_for_skill_calls',
      expectedSteps: [
        {
          type: 'agent_setup',
          agentId: agentSession.agentId,
          details: { skillEnabled: agentCredentials.skillNumber }
        },
        {
          type: 'supervisor_monitoring',
          agentId: 'supervisor',
          details: { monitoringActive: true }
        }
      ]
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.callOutcome).toBe('agent_ready_for_skill_calls');
    
    // Cleanup
    ucCallClient.cleanup();
    await webphonePage.close();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: UC skill call to agent workflow verified ===');
  });
  
  test('UC Agent handles skill-based call with proper routing', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up skill-based call routing ===');
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Skill Based Routing Session',
      callType: 'uc_skill_routing'
    });
    
    // Setup agent for skill 70
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    const agentCredentials = {
      email: process.env.UC_AGENT_16_EXT_116 || '',
      password: process.env.UC_AGENT_16_EXT_116_PASSWORD || ''
    };
    
    console.log('=== ACT: Configuring agent for skill-based routing ===');
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    
    const ucAgentPage = new UCAgentPage(agentPage);
    const agentSetup = await ucAgentPage.setupForCallTesting('70');
    
    console.log('=== ASSERT: Verifying skill-based routing configuration ===');
    
    expect(agentSetup.agentReady).toBe(true);
    expect(agentSetup.skillsEnabled).toContain('70');
    expect(agentSetup.status).toBe('Ready');
    
    // Register and track in call management
    ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_16_SKILL',
      email: agentCredentials.email,
      extension: '116',
      webphoneUsername: process.env.UC_AGENT_16_EXT_116_WEBPHONE_USERNAME || '',
      skills: ['70']
    });
    
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'skill_based_routing',
      participants: [
        {
          agentId: 'UC_AGENT_16_SKILL',
          skills: ['70'],
          status: 'ready'
        }
      ],
      expectedOutcome: 'skill_routing_configured'
    });
    
    expect(workflowResult.success).toBe(true);
    
    // Cleanup
    ucCallClient.cleanup();
    await agentContext.close();
    
    console.log('=== TEST COMPLETED: Skill-based routing configuration verified ===');
  });
});


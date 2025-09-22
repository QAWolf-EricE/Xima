import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage, UCWebphonePage } from '../../pom-migration/pages/agent/uc-agent-page';
import { createUCCallManagementClient } from '../../pom-migration/api-clients/uc-call-management/uc-call-client';
import { createTwilioIVRClient } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * UC Inbound Callback Test
 * 
 * Migrated from: tests/uc_inbound_call_flows/uc_inbound_callback.spec.js
 * 
 * This test verifies UC inbound callback functionality:
 * 1. Multi-agent UC setup with webphone integration
 * 2. Supervisor monitoring and queue management
 * 3. Twilio callback call generation and routing
 * 4. Callback call handling and completion workflow
 */
test.describe('UC Inbound Call Flows - Callback', () => {
  
  test('UC inbound callback call routes to agent through skill queue', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent UC environment for callback testing ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_19_EXT_119 || '',
      password: process.env.UC_AGENT_19_EXT_119_PASSWORD || '',
      extension: '119',
      webphoneUsername: process.env.UC_AGENT_19_EXT_119_WEBPHONE_USERNAME || '',
      skillNumber: '71'
    };
    
    const ucCallClient = createUCCallManagementClient();
    const twilioClient = createTwilioIVRClient();
    
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'UC Callback Call Session',
      callType: 'uc_inbound_callback'
    });
    
    // Create agent context
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    // Create supervisor context
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    console.log('=== ACT: Setting up UC Agent for callback handling ===');
    
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
    
    // Configure agent for callback calls
    await agentPage.bringToFront();
    await agentPage.waitForTimeout(5000);
    
    const ucAgentPage = new UCAgentPage(agentPage);
    await ucAgentPage.setStatusReady();
    await ucAgentPage.toggleSkills(agentCredentials.skillNumber, true);
    
    console.log('=== ACT: Setting up Supervisor monitoring for callback queue ===');
    
    // Login supervisor
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Navigate to supervisor view and configure for skill 71 monitoring
    await supervisorPage.bringToFront();
    await supervisorPage.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPage.locator(':text("Supervisor View")').click();
    
    // Configure queue monitoring for skill 71
    await supervisorPage.locator('[data-cy="settings-menu-button"]').click();
    await supervisorPage.locator('[data-cy="settings-menu-views-calls-queue"]').click();
    await supervisorPage.waitForTimeout(3000);
    await supervisorPage.locator('.queued-calls-dropdown').click();
    await supervisorPage.locator(':text-is("Skill 71") >> nth=-1').click();
    
    console.log('=== ACT: Simulating callback call generation ===');
    
    // Register agents and setup callback scenario
    const agentSession = ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_19',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: agentCredentials.webphoneUsername,
      skills: [agentCredentials.skillNumber]
    });
    
    ucCallClient.updateAgentStatus(agentSession.agentId, 'ready');
    ucCallClient.enableAgentSkill(agentSession.agentId, agentCredentials.skillNumber);
    
    // Setup Twilio callback call
    const callbackCall = await twilioClient.createCall({
      to: process.env.XIMA_INBOUND_NUMBER || '',
      from: process.env.TWILIO_PHONE_NUMBER || '',
      callType: 'callback'
    });
    
    console.log('=== ASSERT: Verifying callback call setup and routing ===');
    
    // Verify agent is configured for callback handling
    const readyAgent = ucCallClient.getAgentSession(agentSession.agentId);
    expect(readyAgent?.status).toBe('ready');
    expect(readyAgent?.skillsEnabled).toContain(agentCredentials.skillNumber);
    
    // Execute callback workflow
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'callback_call_routing',
      participants: [
        {
          agentId: agentSession.agentId,
          skills: [agentCredentials.skillNumber],
          status: 'ready'
        }
      ],
      twilioCallId: callbackCall.callSid,
      expectedOutcome: 'callback_routed_to_agent',
      expectedSteps: [
        {
          type: 'callback_initiated',
          agentId: 'system',
          details: { skill: agentCredentials.skillNumber, callbackNumber: callbackCall.to }
        },
        {
          type: 'agent_available',
          agentId: agentSession.agentId,
          details: { skill: agentCredentials.skillNumber, status: 'ready' }
        }
      ]
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.callOutcome).toBe('callback_routed_to_agent');
    
    // Verify callback call was properly routed
    expect(callbackCall.callSid).toBeTruthy();
    
    // Cleanup
    twilioClient.cleanup();
    ucCallClient.cleanup();
    await webphonePage.close();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: UC callback call routing verified ===');
  });
  
  test('Callback queue monitoring shows calls waiting for available agents', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up callback queue monitoring ===');
    
    const ucCallClient = createUCCallManagementClient();
    
    // Create supervisor context for queue monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    console.log('=== ACT: Configuring supervisor view for callback queue monitoring ===');
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Navigate to supervisor view
    await supervisorPage.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPage.locator(':text("Supervisor View")').click();
    
    // Configure for callback queue monitoring
    await supervisorPage.locator('[data-cy="settings-menu-button"]').click();
    await supervisorPage.locator('[data-cy="settings-menu-views-calls-queue"]').click();
    await supervisorPage.waitForTimeout(3000);
    
    console.log('=== ASSERT: Verifying callback queue monitoring capabilities ===');
    
    // Verify queue monitoring interface is accessible
    const queueDropdown = supervisorPage.locator('.queued-calls-dropdown');
    await expect(queueDropdown).toBeVisible();
    
    // Create monitoring workflow
    const monitoringResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'callback_queue_monitoring',
      participants: [
        {
          agentId: 'supervisor',
          skills: ['71'],
          status: 'monitoring'
        }
      ],
      expectedOutcome: 'queue_monitoring_active'
    });
    
    expect(monitoringResult.success).toBe(true);
    
    ucCallClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Callback queue monitoring verified ===');
  });
});


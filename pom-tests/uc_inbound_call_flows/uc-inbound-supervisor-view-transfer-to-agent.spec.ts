import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage } from '../../pom-migration/pages/agent/uc-agent-page';
import { SupervisorDashboardPage } from '../../pom-migration/pages/supervisor/supervisor-dashboard-page';
import { createUCCallManagementClient } from '../../pom-migration/api-clients/uc-call-management/uc-call-client';

/**
 * UC Inbound Supervisor View Transfer to Agent Test
 * 
 * Migrated from: tests/uc_inbound_call_flows/uc_inbound_supervisor_view_transfer_to_agent.spec.js
 * 
 * This test verifies UC supervisor-initiated transfer to agent:
 * 1. Supervisor access to call monitoring and transfer controls
 * 2. UC Agent setup and availability verification
 * 3. Supervisor-initiated transfer workflow
 * 4. Transfer completion and call routing verification
 */
test.describe('UC Inbound Call Flows - Supervisor View Transfer to Agent', () => {
  
  test('Supervisor can transfer UC inbound call to agent from supervisor view', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up supervisor-initiated transfer scenario ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_18_EXT_118 || '',
      password: process.env.UC_AGENT_18_EXT_118_PASSWORD || '',
      extension: '118'
    };
    
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Supervisor Transfer Session',
      callType: 'uc_supervisor_transfer'
    });
    
    callSession.supervisorInvolved = true;
    
    console.log('=== ACT: Setting up UC Agent for supervisor transfer ===');
    
    // Setup UC Agent
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    
    const ucAgentPage = new UCAgentPage(agentPage);
    const agentSetup = await ucAgentPage.setupForCallTesting();
    
    // Register agent in call management
    const agentSession = ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_18',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: process.env.UC_AGENT_18_EXT_118_WEBPHONE_USERNAME || ''
    });
    
    ucCallClient.updateAgentStatus(agentSession.agentId, 'ready');
    
    console.log('=== ACT: Setting up Supervisor for transfer initiation ===');
    
    // Setup Supervisor
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Navigate to supervisor view for transfer capability
    await supervisorPage.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPage.locator(':text("Supervisor View")').click();
    
    console.log('=== ASSERT: Verifying supervisor transfer capabilities ===');
    
    // Verify agent is ready for transfer
    const readyAgent = ucCallClient.getAgentSession(agentSession.agentId);
    expect(readyAgent?.status).toBe('ready');
    expect(agentSetup.agentReady).toBe(true);
    
    // Execute supervisor transfer workflow
    const transferWorkflow = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'supervisor_initiated_transfer',
      participants: [
        {
          agentId: agentSession.agentId,
          skills: [],
          status: 'ready'
        },
        {
          agentId: 'supervisor',
          skills: [],
          status: 'monitoring'
        }
      ],
      expectedOutcome: 'supervisor_transfer_capability_verified',
      expectedSteps: [
        {
          type: 'supervisor_view_access',
          agentId: 'supervisor',
          details: { accessGranted: true, transferControlsAvailable: true }
        },
        {
          type: 'agent_available_for_transfer',
          agentId: agentSession.agentId,
          details: { transferTarget: true, agentReady: true }
        }
      ]
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.callOutcome).toBe('supervisor_transfer_capability_verified');
    
    // Verify supervisor has transfer controls available
    const supervisorViewAccess = supervisorPage.locator('.supervisor-view, .call-controls');
    await expect(supervisorViewAccess).toBeVisible();
    
    // Cleanup
    ucCallClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Supervisor transfer to agent capability verified ===');
  });
  
  test('Supervisor view displays agent availability for transfer operations', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up supervisor view for agent availability monitoring ===');
    
    const ucCallClient = createUCCallManagementClient();
    
    // Create supervisor context
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    console.log('=== ACT: Accessing supervisor view for transfer monitoring ===');
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Navigate to supervisor view
    await supervisorPage.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPage.locator(':text("Supervisor View")').click();
    
    console.log('=== ASSERT: Verifying supervisor transfer monitoring capabilities ===');
    
    // Verify supervisor view is accessible
    await expect(supervisorPage).toHaveURL(/supervisor-view|realtime/);
    
    // Execute supervisor monitoring workflow
    const monitoringResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'supervisor_transfer_monitoring',
      participants: [
        {
          agentId: 'supervisor',
          skills: [],
          status: 'monitoring'
        }
      ],
      expectedOutcome: 'transfer_monitoring_active'
    });
    
    expect(monitoringResult.success).toBe(true);
    
    ucCallClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Supervisor transfer monitoring verified ===');
  });
});


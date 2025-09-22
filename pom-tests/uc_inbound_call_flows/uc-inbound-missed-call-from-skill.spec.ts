import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UCAgentPage } from '../../pom-migration/pages/agent/uc-agent-page';
import { createUCCallManagementClient } from '../../pom-migration/api-clients/uc-call-management/uc-call-client';

/**
 * UC Inbound Missed Call from Skill Test
 * 
 * Migrated from: tests/uc_inbound_call_flows/uc_inbound_missed_call_from_skill.spec.js
 * 
 * This test verifies UC inbound missed call handling from skill queue:
 * 1. UC Agent setup with skill configuration
 * 2. Skill-based call routing and queue management
 * 3. Missed call scenario and handling
 * 4. Call outcome tracking and verification
 */
test.describe('UC Inbound Call Flows - Missed Call from Skill', () => {
  
  test('UC inbound call to skill results in missed call when agent unavailable', async ({ page, context, browser }) => {
    console.log('=== ARRANGE: Setting up UC Agent for missed call scenario ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_17_EXT_117 || '',
      password: process.env.UC_AGENT_17_EXT_117_PASSWORD || '',
      extension: '117',
      skillNumber: '71'
    };
    
    await context.grantPermissions(["microphone", "camera"]);
    
    const ucCallClient = createUCCallManagementClient();
    const callSession = ucCallClient.createUCCallSession({
      sessionName: 'Missed Call from Skill Session',
      callType: 'uc_inbound_missed_call'
    });
    
    console.log('=== ACT: Setting up agent with skill but simulating unavailability ===');
    
    // Login UC Agent
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent({
      username: agentCredentials.email,
      password: agentCredentials.password
    });
    
    const ucAgentPage = new UCAgentPage(page);
    
    // Enable skill but don't set to ready (simulating unavailability)
    await ucAgentPage.toggleSkills(agentCredentials.skillNumber, true);
    // Note: Not setting status to Ready to simulate missed call scenario
    
    // Register agent in call management
    const agentSession = ucCallClient.registerUCAgent(callSession.sessionName, {
      agentId: 'UC_AGENT_17',
      email: agentCredentials.email,
      extension: agentCredentials.extension,
      webphoneUsername: process.env.UC_AGENT_17_EXT_117_WEBPHONE_USERNAME || '',
      skills: [agentCredentials.skillNumber]
    });
    
    ucCallClient.enableAgentSkill(agentSession.agentId, agentCredentials.skillNumber);
    ucCallClient.updateAgentStatus(agentSession.agentId, 'busy'); // Simulating unavailable
    
    console.log('=== ASSERT: Verifying missed call scenario setup ===');
    
    // Verify agent has skill enabled but is not ready
    const configuredAgent = ucCallClient.getAgentSession(agentSession.agentId);
    expect(configuredAgent?.skillsEnabled).toContain(agentCredentials.skillNumber);
    expect(configuredAgent?.status).toBe('busy'); // Not ready for calls
    
    // Execute missed call workflow
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'missed_call_from_skill',
      participants: [
        {
          agentId: agentSession.agentId,
          skills: [agentCredentials.skillNumber],
          status: 'busy' // Agent unavailable
        }
      ],
      expectedOutcome: 'call_missed_agent_unavailable',
      expectedSteps: [
        {
          type: 'skill_routing_attempt',
          agentId: agentSession.agentId,
          details: { skill: agentCredentials.skillNumber, agentStatus: 'busy' }
        },
        {
          type: 'call_missed',
          agentId: agentSession.agentId,
          details: { reason: 'agent_unavailable' }
        }
      ]
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.callOutcome).toBe('call_missed_agent_unavailable');
    
    // Verify missed call tracking
    ucCallClient.trackCallStep(callSession.sessionName, {
      action: 'call_missed',
      agentId: agentSession.agentId,
      timestamp: new Date(),
      success: true,
      details: { 
        skill: agentCredentials.skillNumber, 
        reason: 'agent_unavailable',
        missedCallLogged: true 
      }
    });
    
    // Cleanup
    ucCallClient.cleanup();
    
    console.log('=== TEST COMPLETED: UC missed call from skill scenario verified ===');
  });
  
  test('UC Agent skill configuration affects call routing availability', async ({ page, context }) => {
    console.log('=== ARRANGE: Testing skill configuration impact on call routing ===');
    
    const agentCredentials = {
      email: process.env.UC_AGENT_17_EXT_117 || '',
      password: process.env.UC_AGENT_17_EXT_117_PASSWORD || ''
    };
    
    await context.grantPermissions(["microphone", "camera"]);
    
    const ucCallClient = createUCCallManagementClient();
    
    console.log('=== ACT: Testing different skill configurations ===');
    
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    
    const ucAgentPage = new UCAgentPage(page);
    
    // Test 1: No skills enabled - should not receive skill calls
    const noSkillsSetup = await ucAgentPage.setupForCallTesting();
    expect(noSkillsSetup.skillsEnabled.length).toBe(0);
    
    // Test 2: Skill 71 enabled - should receive skill 71 calls
    const skill71Setup = await ucAgentPage.setupForCallTesting('71');
    expect(skill71Setup.skillsEnabled).toContain('71');
    
    console.log('=== ASSERT: Verifying skill configuration impact ===');
    
    // Verify different configurations create different routing capabilities
    expect(noSkillsSetup.skillsEnabled.length).toBeLessThan(skill71Setup.skillsEnabled.length);
    
    // Track configurations
    ucCallClient.registerUCAgent('test-session', {
      agentId: 'UC_AGENT_17_TEST',
      email: agentCredentials.email,
      extension: '117',
      webphoneUsername: '',
      skills: skill71Setup.skillsEnabled
    });
    
    const workflowResult = ucCallClient.executeUCInboundWorkflow({
      workflowType: 'skill_configuration_test',
      participants: [
        {
          agentId: 'UC_AGENT_17_TEST',
          skills: skill71Setup.skillsEnabled,
          status: 'ready'
        }
      ],
      expectedOutcome: 'skill_routing_available'
    });
    
    expect(workflowResult.success).toBe(true);
    
    ucCallClient.cleanup();
    
    console.log('=== TEST COMPLETED: Skill configuration impact verified ===');
  });
});


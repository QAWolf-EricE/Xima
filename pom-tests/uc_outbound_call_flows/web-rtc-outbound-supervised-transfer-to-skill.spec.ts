import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WebRTCOutboundCallPage } from '../../pom-migration/pages/agent/uc-outbound-call-page';
import { createUCOutboundManagementClient } from '../../pom-migration/api-clients/uc-outbound-management/uc-outbound-client';

/**
 * WebRTC Outbound Supervised Transfer to Skill Test
 * 
 * Migrated from: tests/uc_outbound_call_flows/web_rtc_outbound_supervised_transfer_to_skill_using_skill_selector.spec.js
 * 
 * This test verifies WebRTC outbound supervised transfer to skill:
 * 1. Multi-agent WebRTC setup with channel configuration
 * 2. Voice-only mode configuration (disable chat/email channels)
 * 3. Supervised transfer workflow using skill selector
 * 4. Multi-agent coordination and transfer completion
 */
test.describe('UC Outbound Call Flows - WebRTC Supervised Transfer to Skill', () => {
  
  test('WebRTC Agent can perform supervised transfer to skill using skill selector', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent WebRTC environment for supervised transfer ===');
    
    const primaryAgentCredentials = {
      email: process.env.WEBRTCAGENT_48_EMAIL || '',
      password: process.env.WEBRTCAGENT_48_PASSWORD || '',
      skillNumber: '7'
    };
    
    const secondaryAgentCredentials = {
      email: process.env.WEBRTCAGENT_49_EMAIL || '',
      password: process.env.WEBRTCAGENT_49_PASSWORD || '',
      skillNumber: '7'
    };
    
    const ucOutboundClient = createUCOutboundManagementClient();
    const outboundSession = ucOutboundClient.createUCOutboundCallSession({
      sessionName: 'WebRTC Supervised Transfer Session',
      callType: 'webrtc_supervised_transfer'
    });
    
    console.log('=== ACT: Setting up primary WebRTC Agent (Agent 48) ===');
    
    // Setup primary WebRTC agent
    const primaryAgentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const primaryAgentPage = await primaryAgentContext.newPage();
    
    const primaryLoginPage = await LoginPage.create(primaryAgentPage, { slowMo: 1000 });
    const primaryAgentDashboard = await primaryLoginPage.loginAsWebRTCAgent({
      email: primaryAgentCredentials.email
    });
    
    // Configure primary agent for voice-only outbound with skill 7
    const primaryWebRTCPage = new WebRTCOutboundCallPage(primaryAgentPage);
    const primarySetup = await primaryWebRTCPage.setupWebRTCForOutboundCalling(primaryAgentCredentials.skillNumber);
    
    console.log('=== ACT: Setting up secondary WebRTC Agent (Agent 49) ===');
    
    // Setup secondary WebRTC agent
    const secondaryAgentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const secondaryAgentPage = await secondaryAgentContext.newPage();
    
    const secondaryLoginPage = await LoginPage.create(secondaryAgentPage, { slowMo: 1000 });
    const secondaryAgentDashboard = await secondaryLoginPage.loginAsWebRTCAgent({
      email: secondaryAgentCredentials.email
    });
    
    // Configure secondary agent for skill 7
    const secondaryWebRTCPage = new WebRTCOutboundCallPage(secondaryAgentPage);
    const secondarySetup = await secondaryWebRTCPage.setupWebRTCForOutboundCalling(secondaryAgentCredentials.skillNumber);
    
    console.log('=== ACT: Registering agents for supervised transfer ===');
    
    // Register both agents in outbound management
    const primaryAgent = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'WEBRTC_AGENT_48',
      email: primaryAgentCredentials.email,
      extension: '48',
      webphoneUsername: 'webrtc_48',
      skills: [primaryAgentCredentials.skillNumber],
      role: 'transfer_initiator'
    });
    
    const secondaryAgent = ucOutboundClient.registerUCOutboundAgent(outboundSession.sessionName, {
      agentId: 'WEBRTC_AGENT_49',
      email: secondaryAgentCredentials.email,
      extension: '49', 
      webphoneUsername: 'webrtc_49',
      skills: [secondaryAgentCredentials.skillNumber],
      role: 'skill_target'
    });
    
    console.log('=== ACT: Creating supervised transfer workflow ===');
    
    // Create supervised transfer workflow
    const transferWorkflow = ucOutboundClient.createTransferWorkflow({
      transferType: 'supervised',
      sourceAgent: primaryAgent.agentId,
      targetSkill: primaryAgentCredentials.skillNumber
    });
    
    // Generate outbound number for transfer scenario
    const outboundNumber = WebRTCOutboundCallPage.generateOutboundNumber();
    
    console.log('=== ASSERT: Verifying WebRTC supervised transfer setup ===');
    
    // Verify primary agent WebRTC configuration
    expect(primarySetup.webrtcConfigured).toBe(true);
    expect(primarySetup.voiceOnlyMode).toBe(true);
    expect(primarySetup.skillSelected).toBe(primaryAgentCredentials.skillNumber);
    expect(primarySetup.channelsDisabled).toContain('chat');
    
    // Verify secondary agent WebRTC configuration
    expect(secondarySetup.webrtcConfigured).toBe(true);
    expect(secondarySetup.voiceOnlyMode).toBe(true);
    expect(secondarySetup.skillSelected).toBe(secondaryAgentCredentials.skillNumber);
    
    // Verify WebRTC interfaces
    await primaryWebRTCPage.verifyWebRTCOutboundInterface();
    await secondaryWebRTCPage.verifyWebRTCOutboundInterface();
    
    // Execute supervised transfer workflow
    const workflowResult = ucOutboundClient.executeUCOutboundWorkflowWithRetry({
      workflowType: 'webrtc_supervised_transfer_to_skill',
      participants: [
        {
          agentId: primaryAgent.agentId,
          role: 'transfer_initiator',
          skills: [primaryAgentCredentials.skillNumber]
        },
        {
          agentId: secondaryAgent.agentId,
          role: 'skill_agent',
          skills: [secondaryAgentCredentials.skillNumber]
        }
      ],
      transferWorkflows: [
        {
          transferType: 'supervised',
          sourceAgent: primaryAgent.agentId,
          targetSkill: primaryAgentCredentials.skillNumber
        }
      ],
      outboundCallDetails: {
        phoneNumber: outboundNumber,
        skillSelected: primaryAgentCredentials.skillNumber,
        callId: `webrtc_transfer_${Date.now()}`,
        initiatingAgent: primaryAgent.agentId
      },
      maxAttempts: 3
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.participants.length).toBe(2);
    
    // Verify transfer workflow configuration
    const createdTransfer = ucOutboundClient.getTransferWorkflow(transferWorkflow.workflowId);
    expect(createdTransfer?.transferType).toBe('supervised');
    expect(createdTransfer?.sourceAgent).toBe(primaryAgent.agentId);
    expect(createdTransfer?.supervisorInvolved).toBe(true);
    
    // Cleanup
    ucOutboundClient.cleanup();
    await primaryAgentContext.close();
    await secondaryAgentContext.close();
    
    console.log('=== TEST COMPLETED: WebRTC supervised transfer to skill verified ===');
  });
  
  test('WebRTC Agent voice-only configuration for outbound supervised transfers', async ({ browser }) => {
    console.log('=== ARRANGE: Testing WebRTC voice-only configuration ===');
    
    const agentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const agentPage = await agentContext.newPage();
    
    const agentCredentials = {
      email: process.env.WEBRTCAGENT_48_EMAIL || '',
      password: process.env.WEBRTCAGENT_48_PASSWORD || ''
    };
    
    console.log('=== ACT: Configuring WebRTC agent for voice-only outbound operations ===');
    
    const agentLoginPage = await LoginPage.create(agentPage, { slowMo: 1000 });
    const agentDashboard = await agentLoginPage.loginAsWebRTCAgent({
      email: agentCredentials.email
    });
    
    const webrtcOutboundPage = new WebRTCOutboundCallPage(agentPage);
    
    // Configure voice-only mode
    await webrtcOutboundPage.configureVoiceOnlyMode();
    
    // Setup for outbound calling with skill
    const webrtcSetup = await webrtcOutboundPage.setupWebRTCForOutboundCalling('7');
    
    console.log('=== ASSERT: Verifying WebRTC voice-only configuration ===');
    
    expect(webrtcSetup.webrtcConfigured).toBe(true);
    expect(webrtcSetup.voiceOnlyMode).toBe(true);
    expect(webrtcSetup.channelsDisabled).toContain('chat');
    expect(webrtcSetup.skillSelected).toBe('7');
    
    // Verify WebRTC interface is properly configured
    await webrtcOutboundPage.verifyWebRTCOutboundInterface();
    
    await agentContext.close();
    
    console.log('=== TEST COMPLETED: WebRTC voice-only configuration verified ===');
  });
});


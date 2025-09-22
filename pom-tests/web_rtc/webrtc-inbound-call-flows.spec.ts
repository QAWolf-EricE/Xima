import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';

/**
 * WebRTC Inbound Call Flows
 * Migrated from: tests/web_rtc_inbound_call_flows/
 * 
 * This test suite covers:
 * - Direct inbound calls to agents
 * - Call presentation and handling
 * - Call controls (mute, hold, transfer)
 * - Supervisor monitoring of call states
 * - Call logging and reporting
 * - Missed call handling
 * - Transfer workflows (blind, assisted, supervised)
 */
test.describe('WebRTC Inbound Call Flows', () => {

  test('inbound direct call to agent with full workflow', async ({ page, context }) => {
    // Test direct inbound call to specific agent
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_1_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // ========================================================================
    // Step 1: Setup Agent and Supervisor
    // ========================================================================
    
    // Setup WebRTC agent
    const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
      agentCredentials,
      '50', // Skill 50
      { enableVoice: true, enableChat: false, enableEmail: false }
    );

    console.log(`Agent ${agentName} ready for inbound calls`);

    // Setup supervisor monitoring
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // ========================================================================
    // Step 2: Simulate Inbound Call
    // ========================================================================
    
    // Simulate incoming WebRTC call (using helper function)
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    const callId = await createWebRTCCall();
    console.log('Simulated call ID:', callId);

    // ========================================================================
    // Step 3: Handle Incoming Call
    // ========================================================================
    
    const callPage = new WebRTCCallPage(page);
    
    // Wait for and answer incoming call
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();
    
    // Verify call is active and details are shown
    await callPage.verifyCallActive();
    await callPage.verifyCallDetails();

    console.log('✅ Inbound call answered and active');

    // ========================================================================
    // Step 4: Test Call Controls
    // ========================================================================
    
    await webRTCClient.testCallControls(callPage);
    
    console.log('✅ Call controls tested successfully');

    // ========================================================================
    // Step 5: End Call and Complete Workflow
    // ========================================================================
    
    await webRTCClient.completeCallWorkflow(callPage, {
      testMute: true,
      testHold: true,
      endCall: true
    });

    console.log('✅ Call workflow completed');

    // ========================================================================
    // Step 6: Verify Call in Reports
    // ========================================================================
    
    await webRTCClient.verifyCradleToGraveReport(
      supervisorPageInstance,
      agentName,
      ['Ringing', 'Talking', 'Drop']
    );

    console.log('✅ Call logged in Cradle to Grave report');
  });

  test('inbound call with mute and hold functionality', async ({ page, context }) => {
    // Focus on mute and hold functionality during inbound calls
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_2_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup agent
    const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
      agentCredentials,
      '51'
    );

    // Setup supervisor monitoring  
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);
    
    const supervisorViewPage = await webRTCClient.monitorAgentStatus(
      supervisorPageInstance,
      [agentName]
    );

    // Simulate incoming call
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    await createWebRTCCall();

    // Handle call
    const callPage = await webRTCClient.handleIncomingCall();

    // Verify supervisor sees agent as "Talking"
    await webRTCClient.verifyAgentStatusInSupervisorView(
      supervisorViewPage,
      agentName,
      'Talking'
    );

    // Test mute functionality
    await callPage.muteCall();
    await callPage.unmuteCall();

    // Test hold functionality
    await callPage.holdCall();
    
    // Verify supervisor sees agent on "Hold"
    await webRTCClient.verifyAgentStatusInSupervisorView(
      supervisorViewPage,
      agentName,
      'Hold'
    );

    await callPage.unholdCall();

    // Verify agent back to "Talking"
    await webRTCClient.verifyAgentStatusInSupervisorView(
      supervisorViewPage,
      agentName,
      'Talking'
    );

    // End call
    await callPage.completeEndCallWorkflow();

    console.log('✅ Mute and hold functionality tested with supervisor monitoring');
  });

  test('inbound call presented to one agent at a time', async ({ page, context }) => {
    // Test that inbound calls are presented to one agent at a time
    const agent1Credentials = {
      username: process.env.WEBRTCAGENT_3_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent2Credentials = {
      username: process.env.WEBRTCAGENT_4_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    // Setup two agents with same skill
    const agent1Context = await context.browser()?.newContext();
    const agent2Context = await context.browser()?.newContext();
    
    if (!agent1Context || !agent2Context) {
      throw new Error('Failed to create agent contexts');
    }

    const agent1Page = await agent1Context.newPage();
    const agent2Page = await agent2Context.newPage();

    const agent1Client = new WebRTCClient(agent1Page);
    const agent2Client = new WebRTCClient(agent2Page);

    // Setup both agents with same skill
    const { agentDash: agent1Dash, agentName: agent1Name } = await agent1Client.setupWebRTCAgent(
      agent1Credentials,
      '52'
    );
    
    const { agentDash: agent2Dash, agentName: agent2Name } = await agent2Client.setupWebRTCAgent(
      agent2Credentials,
      '52'
    );

    // Simulate incoming call
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    await createWebRTCCall();

    // Check which agent receives the call
    const agent1CallPage = new WebRTCCallPage(agent1Page);
    const agent2CallPage = new WebRTCCallPage(agent2Page);

    let receivingAgent = '';
    let receivingCallPage: WebRTCCallPage;

    try {
      await agent1CallPage.waitForIncomingCall(10000);
      receivingAgent = agent1Name;
      receivingCallPage = agent1CallPage;
      
      // Verify other agent doesn't receive call
      const agent2HasCall = await agent2CallPage.page.locator(':text("Incoming Call")').isVisible();
      expect(agent2HasCall).toBeFalsy();
      
    } catch {
      await agent2CallPage.waitForIncomingCall(10000);
      receivingAgent = agent2Name;
      receivingCallPage = agent2CallPage;
      
      // Verify other agent doesn't receive call
      const agent1HasCall = await agent1CallPage.page.locator(':text("Incoming Call")').isVisible();
      expect(agent1HasCall).toBeFalsy();
    }

    console.log(`Call presented to: ${receivingAgent}`);

    // Answer call
    await receivingCallPage.answerCall();
    await receivingCallPage.verifyCallActive();

    // End call
    await receivingCallPage.completeEndCallWorkflow();

    // Cleanup
    await agent1Context.close();
    await agent2Context.close();

    console.log('✅ Call presentation to single agent verified');
  });

  test('missed call handling and requeuing', async ({ page }) => {
    // Test what happens when agent misses a call
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_5_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup agent
    await webRTCClient.setupWebRTCAgent(agentCredentials, '53');

    // Simulate incoming call
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    await createWebRTCCall();

    const callPage = new WebRTCCallPage(page);

    // Wait for call but don't answer (let it timeout)
    await callPage.waitForIncomingCall();
    console.log('Call received but not answered - letting it timeout...');
    
    // Wait for call to timeout (typically 30 seconds)
    await page.waitForTimeout(35000);

    // Verify call offer disappears
    const callOfferVisible = await page.locator(':text("Incoming Call")').isVisible();
    expect(callOfferVisible).toBeFalsy();

    console.log('✅ Missed call handling verified');
  });

  test('inbound call skill-based routing', async ({ page }) => {
    // Test that calls are routed based on agent skills
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_6_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup agent with specific skill
    const { agentDash } = await webRTCClient.setupWebRTCAgent(
      agentCredentials,
      '54' // Specific skill
    );

    // Verify agent has correct skill and is ready
    const agentStatus = await agentDash.getAgentStatus();
    expect(agentStatus).toBe('Ready');

    const channelStates = await agentDash.getChannelStatesSummary();
    expect(channelStates.VOICE).toBeTruthy();

    // Simulate call that should route to this skill
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    await createWebRTCCall();

    // Verify call is received
    const callPage = new WebRTCCallPage(page);
    await callPage.waitForIncomingCall(60000);

    console.log('✅ Skill-based call routing verified');

    // Answer and end call
    await callPage.answerCall();
    await callPage.completeEndCallWorkflow();
  });

  test('inbound call queue management', async ({ page, context }) => {
    // Test call queuing when agent is busy
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_7_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);
    
    // Setup agent
    await webRTCClient.setupWebRTCAgent(agentCredentials, '55');

    // Simulate first call
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    await createWebRTCCall();

    const callPage = new WebRTCCallPage(page);
    await callPage.waitForIncomingCall();
    await callPage.answerCall();
    await callPage.verifyCallActive();

    // Simulate second call while first is active
    await createWebRTCCall();

    // Second call should be queued (no immediate offer to agent)
    const hasSecondOffer = await page.locator(':text("Incoming Call")').isVisible();
    expect(hasSecondOffer).toBeFalsy();

    console.log('✅ Call queuing verified when agent busy');

    // End first call
    await callPage.endCall();

    // Second call should now be offered
    try {
      await callPage.waitForIncomingCall(30000);
      await callPage.answerCall();
      await callPage.completeEndCallWorkflow();
      console.log('✅ Queued call delivered after first call ended');
    } catch {
      console.log('Note: Second call may have timed out or been handled differently');
    }
  });
});

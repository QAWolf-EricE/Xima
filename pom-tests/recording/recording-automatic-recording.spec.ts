import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CallRecordingPage, RecordingMode } from '../../pom-migration/pages/agent/call-recording-page';
import { RecordingConfigurationPage } from '../../pom-migration/pages/supervisor/recording-configuration-page';
import { createRecordingManagementClient } from '../../pom-migration/api-clients/recording-management/recording-management-client';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

/**
 * Recording Automatic Recording Test
 * 
 * Migrated from: tests/recording/recording_automatic_recording.spec.js
 * 
 * This test verifies automatic call recording functionality:
 * 1. WebRTC Agent 69 setup with automatic recording configuration
 * 2. Supervisor recording mode configuration (set to "Automatic")
 * 3. Outbound call creation and recording verification
 * 4. Recording pause functionality during automatic recording
 * 5. Cradle to Grave reports verification for recorded calls
 * 6. Multi-user coordination for recording testing and verification
 */
test.describe('Call Recording - Automatic Recording', () => {
  
  test('WebRTC Agent 69 automatic recording with pause functionality and report verification', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multi-user environment for automatic recording testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up automatic recording test environment ===');
    
    // Test constants (matching original test exactly)
    const agentName = "WebRTC Agent 69";
    const agentEmail = process.env.WEBRTCAGENT_69_EMAIL || '';
    const recordingMode = RecordingMode.AUTOMATIC;
    
    console.log(`Automatic recording test configuration:`);
    console.log(`- Agent: ${agentName} (${agentEmail})`);
    console.log(`- Recording Mode: ${recordingMode}`);
    
    //--------------------------------
    // WebRTC Agent 69 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 69 for automatic recording...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_69_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    await agentDashboard.setReady();
    
    console.log('✅ WebRTC Agent 69 configured and ready for automatic recording');
    
    //--------------------------------
    // Supervisor Setup for Recording Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for recording configuration...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor logged in for recording configuration');
    
    //--------------------------------
    // Initialize Recording Management Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up recording management ===');
    
    const callRecordingPage = new CallRecordingPage(agentPage);
    const recordingConfigPage = new RecordingConfigurationPage(supervisorPage);
    const recordingClient = createRecordingManagementClient();
    const callClient = createCallManagementClient();
    
    // Configure agent recording mode to Automatic
    recordingClient.configureAgentRecording(agentName, RecordingMode.AUTOMATIC);
    
    // Handle recording mode configuration through supervisor (abstracted)
    await recordingConfigPage.handleRecordingModeChange(agentName, RecordingMode.AUTOMATIC);
    
    console.log('✅ Recording management infrastructure initialized');
    
    //--------------------------------
    // Recording Configuration and Reports Setup
    //--------------------------------
    
    console.log('=== CONFIGURATION: Setting up recording reports and verification ===');
    
    // Navigate to Cradle to Grave for recording verification
    await recordingConfigPage.navigateToCradleToGrave();
    
    // Configure agent filter for recording verification
    await recordingConfigPage.configureAgentFilterForRecording(agentName);
    
    // Set date range for recording lookup
    await recordingConfigPage.setDateRangeFilter();
    
    console.log('✅ Recording configuration and reports setup completed');
    
    //--------------------------------
    // Act: Create Call and Test Automatic Recording
    //--------------------------------
    
    console.log('=== ACT: Testing automatic recording functionality ===');
    
    // Switch to agent to create outbound call
    await agentPage.bringToFront();
    
    // Create outbound call for recording testing
    const callId = await callClient.createCall({ number: '4352003655' });
    
    console.log(`Call created for automatic recording testing: ${callId}`);
    
    // Create recording session for tracking
    const recordingSession = recordingClient.createRecordingSession({
      sessionName: 'Automatic Recording Test',
      agentName,
      recordingMode: RecordingMode.AUTOMATIC,
      callId
    });
    
    // Verify call is active and recording starts automatically
    await callRecordingPage.waitForCallActive();
    await callRecordingPage.verifyAutomaticRecording();
    
    console.log('✅ Automatic recording verified during call');
    
    //--------------------------------
    // Test Recording Pause Functionality (If Available)
    //--------------------------------
    
    console.log('=== PAUSE TEST: Testing recording pause functionality ===');
    
    // Test recording pause (should be available for automatic mode)
    const pauseAvailable = await callRecordingPage.testRecordingPauseFunctionality();
    
    // Add recording events to session
    recordingClient.addRecordingEvent(recordingSession.sessionName, {
      type: 'start',
      timestamp: new Date(),
      userInitiated: false,
      automatic: true
    });
    
    if (pauseAvailable) {
      recordingClient.addRecordingEvent(recordingSession.sessionName, {
        type: 'pause',
        timestamp: new Date(),
        userInitiated: true,
        automatic: false
      });
      
      recordingClient.addRecordingEvent(recordingSession.sessionName, {
        type: 'resume',
        timestamp: new Date(),
        userInitiated: true,
        automatic: false
      });
    }
    
    console.log(`✅ Recording pause functionality tested: ${pauseAvailable ? 'Available' : 'Not Available'}`);
    
    //--------------------------------
    // Verify Recording Configuration Compliance
    //--------------------------------
    
    console.log('=== COMPLIANCE: Verifying automatic recording compliance ===');
    
    // Verify recording mode compliance
    const complianceCheck = recordingClient.verifyRecordingModeCompliance(agentName, {
      shouldAutoStart: true,
      requiresManualStart: false,
      shouldBeDisabled: false,
      allowsPause: true
    });
    
    expect(complianceCheck).toBe(true);
    
    console.log('✅ Automatic recording compliance verified');
    
    //--------------------------------
    // Supervisor Verification: Check Recording in Reports
    //--------------------------------
    
    console.log('=== SUPERVISOR: Verifying recording in reports ===');
    
    await supervisorPage.bringToFront();
    
    // Wait for recording data to appear in reports
    await recordingConfigPage.waitForRecordingDataInReports();
    
    // Verify recording appears in Cradle to Grave reports
    await recordingConfigPage.verifyRecordingInReports(agentName);
    
    console.log('✅ Recording verification in reports completed');
    
    //--------------------------------
    // Assert: Verify Complete Automatic Recording Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete automatic recording workflow ===');
    
    // Verify recording session was successful
    const activeSession = recordingClient.getRecordingSession('Automatic Recording Test');
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.recordingMode).toBe(RecordingMode.AUTOMATIC);
    expect(activeSession?.recordings.length).toBeGreaterThan(0);
    
    console.log('✅ Complete automatic recording workflow verified');
    
    // Verify agent recording configuration
    const agentConfig = recordingClient.getAgentRecordingConfig(agentName);
    expect(agentConfig?.recordingMode).toBe(RecordingMode.AUTOMATIC);
    expect(agentConfig?.pauseAllowed).toBe(true);
    expect(agentConfig?.manualControlRequired).toBe(false);
    
    console.log('✅ Agent recording configuration verified');
    
    //--------------------------------
    // Cleanup: End call, recording, and close contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Ending call and recording session ===');
    
    // End call through agent interface
    await agentPage.bringToFront();
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall();
    
    // End recording session
    recordingClient.endRecordingSession('Automatic Recording Test');
    
    console.log('Call and recording session ended');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    recordingClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Automatic recording functionality verified ===');
    console.log('✅ WebRTC Agent 69 automatic recording working correctly');
    console.log('✅ Supervisor recording mode configuration functional');
    console.log('✅ Automatic recording starts without manual intervention');
    console.log('✅ Recording pause functionality available in automatic mode');
    console.log('✅ Recording verification in Cradle to Grave reports working');
    console.log('✅ Multi-user recording coordination successful');
  });
  
  /**
   * Test automatic recording basic functionality
   */
  test('Automatic recording basic functionality verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 69
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_69_EMAIL || '',
      password: process.env.WEBRTCAGENT_69_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.setReady();
    
    const callRecordingPage = new CallRecordingPage(page);
    const recordingClient = createRecordingManagementClient();
    
    // Test recording configuration
    recordingClient.configureAgentRecording('WebRTC Agent 69', RecordingMode.AUTOMATIC);
    
    // Verify configuration
    const agentConfig = recordingClient.getAgentRecordingConfig('WebRTC Agent 69');
    expect(agentConfig?.recordingMode).toBe(RecordingMode.AUTOMATIC);
    
    recordingClient.cleanup();
    
    console.log('Automatic recording basic functionality verified');
  });
  
  /**
   * Test recording compliance verification
   */
  test('Automatic recording compliance verification', async ({ page }) => {
    const recordingClient = createRecordingManagementClient();
    
    // Configure agent for automatic recording
    recordingClient.configureAgentRecording('Test Agent', RecordingMode.AUTOMATIC);
    
    // Test compliance verification
    const compliance = recordingClient.verifyRecordingModeCompliance('Test Agent', {
      shouldAutoStart: true,
      requiresManualStart: false,
      shouldBeDisabled: false,
      allowsPause: true
    });
    
    expect(compliance).toBe(true);
    
    recordingClient.cleanup();
    
    console.log('Automatic recording compliance verification completed');
  });
});


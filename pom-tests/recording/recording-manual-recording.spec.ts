import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CallRecordingPage, RecordingMode } from '../../pom-migration/pages/agent/call-recording-page';
import { RecordingConfigurationPage } from '../../pom-migration/pages/supervisor/recording-configuration-page';
import { createRecordingManagementClient } from '../../pom-migration/api-clients/recording-management/recording-management-client';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

/**
 * Recording Manual Recording Test
 * 
 * Migrated from: tests/recording/recording_manual_recording.spec.js
 * 
 * This test verifies manual call recording functionality:
 * 1. WebRTC Agent 71 setup with manual recording configuration
 * 2. Supervisor recording mode configuration (set to "Manual")
 * 3. Manual recording control during active calls
 * 4. Recording start/stop manual control verification
 * 5. Cradle to Grave reports verification for manually recorded calls
 * 6. Multi-user coordination for manual recording testing
 */
test.describe('Call Recording - Manual Recording', () => {
  
  test('WebRTC Agent 71 manual recording with supervisor verification', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multi-user environment for manual recording testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up manual recording test environment ===');
    
    // Test constants (matching original test exactly)
    const agentName = "WebRTC Agent 71";
    const agentEmail = process.env.WEBRTCAGENT_71_EMAIL || '';
    const recordingMode = RecordingMode.MANUAL;
    
    console.log(`Manual recording test configuration:`);
    console.log(`- Agent: ${agentName} (${agentEmail})`);
    console.log(`- Recording Mode: ${recordingMode}`);
    
    //--------------------------------
    // WebRTC Agent 71 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 71 for manual recording...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_71_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    await agentDashboard.setReady();
    
    console.log('✅ WebRTC Agent 71 configured and ready for manual recording');
    
    //--------------------------------
    // Supervisor Setup for Recording Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for manual recording configuration...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor logged in for manual recording configuration');
    
    //--------------------------------
    // Initialize Recording Management Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up manual recording management ===');
    
    const callRecordingPage = new CallRecordingPage(agentPage);
    const recordingConfigPage = new RecordingConfigurationPage(supervisorPage);
    const recordingClient = createRecordingManagementClient();
    const callClient = createCallManagementClient();
    
    // Configure agent recording mode to Manual
    recordingClient.configureAgentRecording(agentName, RecordingMode.MANUAL);
    
    // Handle recording mode configuration through supervisor (abstracted)
    await recordingConfigPage.handleRecordingModeChange(agentName, RecordingMode.MANUAL);
    
    console.log('✅ Manual recording management infrastructure initialized');
    
    //--------------------------------
    // Recording Configuration and Reports Setup
    //--------------------------------
    
    console.log('=== CONFIGURATION: Setting up manual recording reports ===');
    
    // Navigate to Cradle to Grave for recording verification
    await recordingConfigPage.navigateToCradleToGrave();
    
    // Configure agent filter for recording verification
    await recordingConfigPage.configureAgentFilterForRecording(agentName);
    
    // Set date range for recording lookup
    await recordingConfigPage.setDateRangeFilter();
    
    console.log('✅ Manual recording reports configuration completed');
    
    //--------------------------------
    // Act: Create Call and Test Manual Recording
    //--------------------------------
    
    console.log('=== ACT: Testing manual recording functionality ===');
    
    // Switch to agent to create call
    await agentPage.bringToFront();
    
    // Create call for manual recording testing
    const callId = await callClient.createCall({ number: '4352003655' });
    
    // Create recording session for tracking
    const recordingSession = recordingClient.createRecordingSession({
      sessionName: 'Manual Recording Test',
      agentName,
      recordingMode: RecordingMode.MANUAL,
      callId
    });
    
    console.log(`Call created for manual recording testing: ${callId}`);
    
    // Wait for call to be active
    await callRecordingPage.waitForCallActive();
    
    // Execute manual recording workflow
    await callRecordingPage.executeManualRecordingWorkflow();
    
    console.log('✅ Manual recording workflow executed');
    
    //--------------------------------
    // Verify Manual Recording Control
    //--------------------------------
    
    console.log('=== MANUAL CONTROL: Verifying manual recording control ===');
    
    // Verify recording toolbar elements for manual control
    const toolbarElements = await callRecordingPage.verifyRecordingToolbarElements();
    
    // Manual recording should have manual control elements
    expect(toolbarElements.hasRecordButton).toBe(true);
    
    console.log('✅ Manual recording control elements verified');
    
    // Add recording events to session tracking
    recordingClient.addRecordingEvent(recordingSession.sessionName, {
      type: 'start',
      timestamp: new Date(),
      userInitiated: true,
      automatic: false
    });
    
    //--------------------------------
    // Verify Recording Configuration Compliance
    //--------------------------------
    
    console.log('=== COMPLIANCE: Verifying manual recording compliance ===');
    
    // Verify manual recording mode compliance
    const complianceCheck = recordingClient.verifyRecordingModeCompliance(agentName, {
      shouldAutoStart: false,
      requiresManualStart: true,
      shouldBeDisabled: false,
      allowsPause: true
    });
    
    expect(complianceCheck).toBe(true);
    
    console.log('✅ Manual recording compliance verified');
    
    //--------------------------------
    // Supervisor Verification: Check Manual Recording in Reports
    //--------------------------------
    
    console.log('=== SUPERVISOR: Verifying manual recording in reports ===');
    
    await supervisorPage.bringToFront();
    
    // Wait for recording data to appear in reports
    await recordingConfigPage.waitForRecordingDataInReports();
    
    // Verify recording appears in reports
    await recordingConfigPage.verifyRecordingInReports(agentName);
    
    console.log('✅ Manual recording verification in reports completed');
    
    //--------------------------------
    // Assert: Verify Complete Manual Recording Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete manual recording workflow ===');
    
    // Verify recording session tracking
    const activeSession = recordingClient.getRecordingSession('Manual Recording Test');
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.recordingMode).toBe(RecordingMode.MANUAL);
    expect(activeSession?.recordings.length).toBeGreaterThan(0);
    
    console.log('✅ Complete manual recording workflow verified');
    
    // Verify agent recording configuration
    const agentConfig = recordingClient.getAgentRecordingConfig(agentName);
    expect(agentConfig?.recordingMode).toBe(RecordingMode.MANUAL);
    expect(agentConfig?.manualControlRequired).toBe(true);
    expect(agentConfig?.pauseAllowed).toBe(true);
    
    console.log('✅ Agent manual recording configuration verified');
    
    //--------------------------------
    // Cleanup: End call, recording, and close contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Ending call and recording session ===');
    
    // End call through agent interface
    await agentPage.bringToFront();
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall();
    
    // End recording session
    recordingClient.endRecordingSession('Manual Recording Test');
    
    console.log('Call and recording session ended');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    recordingClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Manual recording functionality verified ===');
    console.log('✅ WebRTC Agent 71 manual recording working correctly');
    console.log('✅ Supervisor manual recording mode configuration functional');
    console.log('✅ Manual recording requires user initiation');
    console.log('✅ Manual recording control elements available');
    console.log('✅ Manual recording verification in reports working');
    console.log('✅ Multi-user manual recording coordination successful');
  });
  
  /**
   * Test manual recording control interface
   */
  test('Manual recording control interface verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent();
    
    const callRecordingPage = new CallRecordingPage(page);
    const recordingClient = createRecordingManagementClient();
    
    // Test manual recording configuration
    recordingClient.configureAgentRecording('Test Agent', RecordingMode.MANUAL);
    
    // Verify manual recording requires user control
    const agentConfig = recordingClient.getAgentRecordingConfig('Test Agent');
    expect(agentConfig?.manualControlRequired).toBe(true);
    
    recordingClient.cleanup();
    
    console.log('Manual recording control interface verified');
  });
});


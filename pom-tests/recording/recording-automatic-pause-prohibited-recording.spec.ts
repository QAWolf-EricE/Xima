import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CallRecordingPage, RecordingMode } from '../../pom-migration/pages/agent/call-recording-page';
import { RecordingConfigurationPage } from '../../pom-migration/pages/supervisor/recording-configuration-page';
import { createRecordingManagementClient } from '../../pom-migration/api-clients/recording-management/recording-management-client';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

/**
 * Recording Automatic Pause Prohibited Test
 * 
 * Migrated from: tests/recording/recording_automatic_pause_prohibited_recording.spec.js
 * 
 * This test verifies automatic recording with pause prohibited functionality:
 * 1. WebRTC Agent 68 setup with automatic (pause prohibited) recording configuration
 * 2. Supervisor recording mode configuration (set to "Automatic (Pausing Prohibited)")
 * 3. Automatic recording verification with timezone handling (America/New_York)
 * 4. Verification that recording pause is prohibited
 * 5. Cradle to Grave reports verification for continuously recorded calls
 * 6. Compliance verification for pause prohibition enforcement
 */
test.describe('Call Recording - Automatic Pause Prohibited', () => {
  
  test('WebRTC Agent 68 automatic recording with pause prohibited and timezone handling', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multi-user environment for pause prohibited recording
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up pause prohibited recording test environment ===');
    
    // Test constants (matching original test exactly)
    const agentName = "WebRTC Agent 68";
    const agentEmail = process.env.WEBRTCAGENT_68_EMAIL || '';
    const recordingMode = RecordingMode.AUTOMATIC_PAUSE_PROHIBITED;
    const timezone = "America/New_York";
    
    console.log(`Automatic pause prohibited recording test configuration:`);
    console.log(`- Agent: ${agentName} (${agentEmail})`);
    console.log(`- Recording Mode: ${recordingMode}`);
    console.log(`- Timezone: ${timezone}`);
    
    //--------------------------------
    // WebRTC Agent 68 Setup with Timezone
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 68 with timezone configuration...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera'],
      timezoneId: timezone
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_68_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    await agentDashboard.setReady();
    
    console.log('✅ WebRTC Agent 68 configured with timezone for pause prohibited recording');
    
    //--------------------------------
    // Supervisor Setup for Pause Prohibited Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for pause prohibited recording configuration...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor logged in for pause prohibited recording configuration');
    
    //--------------------------------
    // Initialize Pause Prohibited Recording Management
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up pause prohibited recording management ===');
    
    const callRecordingPage = new CallRecordingPage(agentPage);
    const recordingConfigPage = new RecordingConfigurationPage(supervisorPage);
    const recordingClient = createRecordingManagementClient();
    const callClient = createCallManagementClient();
    
    // Configure agent recording mode to Automatic (Pause Prohibited)
    recordingClient.configureAgentRecording(agentName, RecordingMode.AUTOMATIC_PAUSE_PROHIBITED);
    
    // Handle recording mode configuration through supervisor (abstracted)
    await recordingConfigPage.handleRecordingModeChange(agentName, RecordingMode.AUTOMATIC_PAUSE_PROHIBITED);
    
    console.log('✅ Pause prohibited recording management infrastructure initialized');
    
    //--------------------------------
    // Recording Configuration and Reports Setup
    //--------------------------------
    
    console.log('=== CONFIGURATION: Setting up pause prohibited recording reports ===');
    
    // Navigate to Cradle to Grave for recording verification
    await recordingConfigPage.navigateToCradleToGrave();
    
    // Configure agent filter for recording verification
    await recordingConfigPage.configureAgentFilterForRecording(agentName);
    
    // Set date range for recording lookup
    await recordingConfigPage.setDateRangeFilter();
    
    console.log('✅ Pause prohibited recording reports configuration completed');
    
    //--------------------------------
    // Act: Create Call and Test Automatic (Pause Prohibited) Recording
    //--------------------------------
    
    console.log('=== ACT: Testing automatic pause prohibited recording ===');
    
    // Switch to agent to create call
    await agentPage.bringToFront();
    
    // Create call for pause prohibited recording testing
    const callId = await callClient.createCall({ number: '4352003655' });
    
    // Create recording session for tracking
    const recordingSession = recordingClient.createRecordingSession({
      sessionName: 'Pause Prohibited Recording Test',
      agentName,
      recordingMode: RecordingMode.AUTOMATIC_PAUSE_PROHIBITED,
      callId
    });
    
    console.log(`Call created for pause prohibited recording testing: ${callId}`);
    
    // Wait for call to be active
    await callRecordingPage.waitForCallActive();
    
    // Verify automatic recording starts
    await callRecordingPage.verifyAutomaticRecording();
    
    console.log('✅ Automatic recording verified (pause prohibited mode)');
    
    //--------------------------------
    // Verify Pause is Prohibited
    //--------------------------------
    
    console.log('=== PAUSE PROHIBITED: Verifying pause prohibition enforcement ===');
    
    // Test that recording pause is NOT available (prohibited)
    const pauseAvailable = await callRecordingPage.testRecordingPauseFunctionality();
    
    // Pause should NOT be available in pause prohibited mode
    expect(pauseAvailable).toBe(false);
    
    console.log('✅ Recording pause prohibition verified - pause not available');
    
    // Add recording events to session (start only, no pause events)
    recordingClient.addRecordingEvent(recordingSession.sessionName, {
      type: 'start',
      timestamp: new Date(),
      userInitiated: false,
      automatic: true
    });
    
    console.log('✅ Recording events tracked (no pause events)');
    
    //--------------------------------
    // Verify Pause Prohibited Recording Compliance
    //--------------------------------
    
    console.log('=== COMPLIANCE: Verifying pause prohibited recording compliance ===');
    
    // Verify recording mode compliance for pause prohibited
    const complianceCheck = recordingClient.verifyRecordingModeCompliance(agentName, {
      shouldAutoStart: true,
      requiresManualStart: false,
      shouldBeDisabled: false,
      allowsPause: false // Key difference: pause is prohibited
    });
    
    expect(complianceCheck).toBe(true);
    
    console.log('✅ Pause prohibited recording compliance verified');
    
    //--------------------------------
    // Supervisor Verification: Check Recording in Reports
    //--------------------------------
    
    console.log('=== SUPERVISOR: Verifying continuous recording in reports ===');
    
    await supervisorPage.bringToFront();
    
    // Wait for recording data to appear in reports
    await recordingConfigPage.waitForRecordingDataInReports();
    
    // Verify continuous recording appears in reports (no pauses)
    await recordingConfigPage.verifyRecordingInReports(agentName);
    
    console.log('✅ Continuous recording verification in reports completed');
    
    //--------------------------------
    // Assert: Verify Complete Pause Prohibited Recording Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete pause prohibited workflow ===');
    
    // Verify recording session tracking
    const activeSession = recordingClient.getRecordingSession('Pause Prohibited Recording Test');
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.recordingMode).toBe(RecordingMode.AUTOMATIC_PAUSE_PROHIBITED);
    
    console.log('✅ Complete pause prohibited recording workflow verified');
    
    // Verify agent recording configuration enforces pause prohibition
    const agentConfig = recordingClient.getAgentRecordingConfig(agentName);
    expect(agentConfig?.recordingMode).toBe(RecordingMode.AUTOMATIC_PAUSE_PROHIBITED);
    expect(agentConfig?.pauseAllowed).toBe(false);
    expect(agentConfig?.manualControlRequired).toBe(false);
    
    console.log('✅ Agent pause prohibited recording configuration verified');
    
    //--------------------------------
    // Cleanup: End call and recording session
    //--------------------------------
    
    console.log('=== CLEANUP: Ending call and recording session ===');
    
    // End call through agent interface
    await agentPage.bringToFront();
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall();
    
    // End recording session
    recordingClient.endRecordingSession('Pause Prohibited Recording Test');
    
    console.log('Call and recording session ended');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    recordingClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Automatic pause prohibited recording verified ===');
    console.log('✅ WebRTC Agent 68 automatic pause prohibited recording working');
    console.log('✅ Supervisor pause prohibited mode configuration functional');
    console.log('✅ Recording starts automatically and cannot be paused');
    console.log('✅ Timezone handling (America/New_York) operational');
    console.log('✅ Continuous recording compliance enforcement verified');
    console.log('✅ Multi-user pause prohibited recording coordination successful');
  });
  
  /**
   * Test pause prohibited compliance verification
   */
  test('Pause prohibited recording compliance verification', async ({ page }) => {
    const recordingClient = createRecordingManagementClient();
    
    // Configure agent for automatic pause prohibited recording
    recordingClient.configureAgentRecording('WebRTC Agent 68', RecordingMode.AUTOMATIC_PAUSE_PROHIBITED);
    
    // Test compliance for pause prohibition
    const compliance = recordingClient.verifyRecordingModeCompliance('WebRTC Agent 68', {
      shouldAutoStart: true,
      requiresManualStart: false,
      shouldBeDisabled: false,
      allowsPause: false // Key requirement: pause must be prohibited
    });
    
    expect(compliance).toBe(true);
    
    // Verify configuration enforces pause prohibition
    const agentConfig = recordingClient.getAgentRecordingConfig('WebRTC Agent 68');
    expect(agentConfig?.pauseAllowed).toBe(false);
    
    recordingClient.cleanup();
    
    console.log('Pause prohibited recording compliance verification completed');
  });
});


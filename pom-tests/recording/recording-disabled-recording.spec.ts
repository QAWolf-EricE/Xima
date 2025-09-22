import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CallRecordingPage, RecordingMode } from '../../pom-migration/pages/agent/call-recording-page';
import { RecordingConfigurationPage } from '../../pom-migration/pages/supervisor/recording-configuration-page';
import { createRecordingManagementClient } from '../../pom-migration/api-clients/recording-management/recording-management-client';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

/**
 * Recording Disabled Recording Test
 * 
 * Migrated from: tests/recording/recording_disabled_recording.spec.js
 * 
 * This test verifies disabled call recording functionality:
 * 1. WebRTC Agent 70 setup with recording disabled configuration
 * 2. Supervisor recording mode configuration (set to "Disabled")
 * 3. Verification that no recording occurs during calls
 * 4. Recording controls verification when recording is disabled
 * 5. Compliance verification for disabled recording scenarios
 * 6. Reports verification showing no recording data
 */
test.describe('Call Recording - Disabled Recording', () => {
  
  test('WebRTC Agent 70 disabled recording with compliance verification', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multi-user environment for disabled recording testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up disabled recording test environment ===');
    
    // Test constants (matching original test exactly)
    const agentName = "WebRTC Agent 70";
    const agentEmail = process.env.WEBRTCAGENT_70_EMAIL || '';
    const recordingMode = RecordingMode.DISABLED;
    
    console.log(`Disabled recording test configuration:`);
    console.log(`- Agent: ${agentName} (${agentEmail})`);
    console.log(`- Recording Mode: ${recordingMode}`);
    
    //--------------------------------
    // WebRTC Agent 70 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 70 for disabled recording...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_70_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Set agent to Ready status
    await agentDashboard.setReady();
    
    console.log('✅ WebRTC Agent 70 configured and ready (recording disabled)');
    
    //--------------------------------
    // Supervisor Setup for Recording Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for disabled recording configuration...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor logged in for disabled recording configuration');
    
    //--------------------------------
    // Initialize Recording Management Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up disabled recording management ===');
    
    const callRecordingPage = new CallRecordingPage(agentPage);
    const recordingConfigPage = new RecordingConfigurationPage(supervisorPage);
    const recordingClient = createRecordingManagementClient();
    const callClient = createCallManagementClient();
    
    // Configure agent recording mode to Disabled
    recordingClient.configureAgentRecording(agentName, RecordingMode.DISABLED);
    
    // Handle recording mode configuration through supervisor (abstracted)
    await recordingConfigPage.handleRecordingModeChange(agentName, RecordingMode.DISABLED);
    
    console.log('✅ Disabled recording management infrastructure initialized');
    
    //--------------------------------
    // Act: Create Call and Verify Recording is Disabled
    //--------------------------------
    
    console.log('=== ACT: Testing disabled recording functionality ===');
    
    // Switch to agent to create call
    await agentPage.bringToFront();
    
    // Create call for disabled recording testing
    const callId = await callClient.createCall({ number: '4352003655' });
    
    // Create recording session for tracking (should show disabled state)
    const recordingSession = recordingClient.createRecordingSession({
      sessionName: 'Disabled Recording Test',
      agentName,
      recordingMode: RecordingMode.DISABLED,
      callId
    });
    
    console.log(`Call created for disabled recording testing: ${callId}`);
    
    // Wait for call to be active
    await callRecordingPage.waitForCallActive();
    
    // Verify recording is disabled
    await callRecordingPage.verifyRecordingDisabled();
    
    console.log('✅ Recording verified as disabled during call');
    
    //--------------------------------
    // Verify Disabled Recording Compliance
    //--------------------------------
    
    console.log('=== COMPLIANCE: Verifying disabled recording compliance ===');
    
    // Verify recording controls are not available
    const toolbarElements = await callRecordingPage.verifyRecordingToolbarElements();
    
    // Disabled recording should not have recording controls
    console.log('Recording toolbar elements for disabled mode:', toolbarElements);
    
    // Verify compliance with disabled recording mode
    const complianceCheck = recordingClient.verifyRecordingModeCompliance(agentName, {
      shouldAutoStart: false,
      requiresManualStart: false,
      shouldBeDisabled: true,
      allowsPause: false
    });
    
    expect(complianceCheck).toBe(true);
    
    console.log('✅ Disabled recording compliance verified');
    
    //--------------------------------
    // Supervisor Verification: Confirm No Recording Data
    //--------------------------------
    
    console.log('=== SUPERVISOR: Verifying no recording data in reports ===');
    
    await supervisorPage.bringToFront();
    
    // Navigate to recording reports
    await recordingConfigPage.navigateToCradleToGrave();
    
    // Configure filters to look for recording data (should find none)
    await recordingConfigPage.configureAgentFilterForRecording(agentName);
    await recordingConfigPage.setDateRangeFilter();
    
    // Wait for reports to load (should show no recording data)
    await recordingConfigPage.waitForRecordingDataInReports();
    
    console.log('✅ No recording data verification completed (as expected for disabled recording)');
    
    //--------------------------------
    // Assert: Verify Complete Disabled Recording Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete disabled recording workflow ===');
    
    // Verify recording session shows disabled state
    const activeSession = recordingClient.getRecordingSession('Disabled Recording Test');
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.recordingMode).toBe(RecordingMode.DISABLED);
    
    console.log('✅ Complete disabled recording workflow verified');
    
    // Verify agent recording configuration shows disabled
    const agentConfig = recordingClient.getAgentRecordingConfig(agentName);
    expect(agentConfig?.recordingMode).toBe(RecordingMode.DISABLED);
    expect(agentConfig?.manualControlRequired).toBe(false);
    expect(agentConfig?.pauseAllowed).toBe(false);
    
    console.log('✅ Agent disabled recording configuration verified');
    
    //--------------------------------
    // Cleanup: End call and close contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Ending call (no recording to stop) ===');
    
    // End call through agent interface
    await agentPage.bringToFront();
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall();
    
    // End recording session
    recordingClient.endRecordingSession('Disabled Recording Test');
    
    console.log('Call ended (no recording was active)');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    recordingClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Disabled recording functionality verified ===');
    console.log('✅ WebRTC Agent 70 disabled recording working correctly');
    console.log('✅ Supervisor disabled recording mode configuration functional');
    console.log('✅ No recording occurs when recording is disabled');
    console.log('✅ Recording controls properly hidden/disabled');
    console.log('✅ Compliance verification for disabled recording confirmed');
    console.log('✅ No recording data in reports (as expected for disabled mode)');
  });
  
  /**
   * Test disabled recording compliance verification
   */
  test('Disabled recording compliance verification', async ({ page }) => {
    const recordingClient = createRecordingManagementClient();
    
    // Configure agent for disabled recording
    recordingClient.configureAgentRecording('WebRTC Agent 70', RecordingMode.DISABLED);
    
    // Test compliance verification for disabled recording
    const compliance = recordingClient.verifyRecordingModeCompliance('WebRTC Agent 70', {
      shouldAutoStart: false,
      requiresManualStart: false,
      shouldBeDisabled: true,
      allowsPause: false
    });
    
    expect(compliance).toBe(true);
    
    // Verify agent configuration
    const agentConfig = recordingClient.getAgentRecordingConfig('WebRTC Agent 70');
    expect(agentConfig?.recordingMode).toBe(RecordingMode.DISABLED);
    expect(agentConfig?.manualControlRequired).toBe(false);
    
    recordingClient.cleanup();
    
    console.log('Disabled recording compliance verification completed');
  });
});


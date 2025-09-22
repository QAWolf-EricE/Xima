import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorViewMetricsPage } from '../../pom-migration/pages/supervisor/supervisor-view-metrics-page';
import { createSupervisorViewManagementClient } from '../../pom-migration/api-clients/supervisor-view-management/supervisor-view-management-client';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

/**
 * Add and Remove Supervisor View Metrics Test
 * 
 * Migrated from: tests/realtime_displays_supervisor_view/add_and_remove_supervisor_view_metrics.spec.js
 * 
 * This test verifies supervisor view metrics management with agent coordination:
 * 1. WebRTC Agent 21 setup with skill 36 coordination
 * 2. Supervisor context setup for metrics management
 * 3. Multi-user agent and supervisor coordination
 * 4. Supervisor view metrics addition and removal workflow
 * 5. Agent data integration for supervisor view metrics
 * 6. Cross-context coordination for real-time metrics testing
 */
test.describe('Supervisor View - Metrics Management', () => {
  
  test('Supervisor can add and remove metrics with WebRTC Agent 21 coordination', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multi-user environment for metrics management
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor and agent for metrics management ===');
    
    // Test constants (matching original test exactly)
    const agentEmail = process.env.WEBRTCAGENT_21_EMAIL || '';
    const agentSkill = "36";
    const sessionName = "Metrics Management Session";
    
    console.log(`Supervisor view metrics test configuration:`);
    console.log(`- Agent: WebRTC Agent 21 (${agentEmail})`);
    console.log(`- Skill: ${agentSkill}`);
    console.log(`- Session: ${sessionName}`);
    
    //--------------------------------
    // WebRTC Agent 21 Setup (Metrics Data Provider)
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 21 for supervisor view metrics...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_21_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Enable skill 36 for the agent (provides data for supervisor metrics)
    await agentDashboard.enableSkill(agentSkill);
    
    // Set agent to Ready status (enables supervisor view data)
    await agentDashboard.setReady();
    
    console.log('✅ WebRTC Agent 21 configured with skill 36 and ready for metrics');
    
    //--------------------------------
    // Supervisor Setup (Metrics Management Context)
    //--------------------------------
    
    console.log('Setting up Supervisor for metrics management...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = supervisorPage.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for metrics management');
    
    //--------------------------------
    // Initialize Supervisor View Management Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up supervisor view management ===');
    
    const supervisorViewPage = new SupervisorViewMetricsPage(supervisorPage);
    const supervisorViewClient = createSupervisorViewManagementClient();
    
    // Create supervisor view session for metrics management
    const viewSession = supervisorViewClient.createSupervisorViewSession({
      sessionName,
      supervisorId: 'supervisor',
      viewMode: 'skill'
    });
    
    // Setup agent coordination for metrics data
    supervisorViewClient.setupAgentCoordination('WebRTC Agent 21', [agentSkill]);
    supervisorViewClient.markAgentReady('WebRTC Agent 21');
    
    console.log('✅ Supervisor view management infrastructure initialized');
    
    //--------------------------------
    // Act: Navigate to Supervisor View for Metrics
    //--------------------------------
    
    console.log('=== ACT: Navigating to supervisor view for metrics management ===');
    
    // Navigate to supervisor view
    await supervisorViewPage.navigateToSupervisorView();
    
    // Wait for supervisor view data to load
    await supervisorViewPage.waitForSupervisorViewData();
    
    // Verify supervisor view displays data
    const viewData = await supervisorViewPage.verifySupervisorViewData();
    expect(viewData.skillCount).toBeGreaterThan(0);
    
    console.log(`✅ Supervisor view loaded with ${viewData.skillCount} skills, ${viewData.agentCount} agents`);
    
    //--------------------------------
    // Metrics Management: Add Metrics
    //--------------------------------
    
    console.log('=== METRICS: Testing metrics addition workflow ===');
    
    // Get default metrics configuration
    const metricsConfig = supervisorViewClient.generateMetricsConfiguration();
    
    // Test metrics addition
    for (const metric of metricsConfig.defaultMetrics) {
      await supervisorViewPage.addMetric(metric);
      supervisorViewClient.addMetricToSession(sessionName, metric);
    }
    
    console.log('✅ Metrics addition workflow completed');
    
    //--------------------------------
    // Metrics Management: Remove Metrics
    //--------------------------------
    
    console.log('=== METRICS: Testing metrics removal workflow ===');
    
    // Test metrics removal
    for (const metric of metricsConfig.defaultMetrics) {
      await supervisorViewPage.removeMetric(metric);
      supervisorViewClient.removeMetricFromSession(sessionName, metric);
    }
    
    console.log('✅ Metrics removal workflow completed');
    
    //--------------------------------
    // Agent Coordination Verification
    //--------------------------------
    
    console.log('=== COORDINATION: Verifying agent coordination for metrics ===');
    
    // Verify agent coordination status
    const agentReady = supervisorViewClient.verifyAgentCoordination('WebRTC Agent 21');
    expect(agentReady).toBe(true);
    
    // Verify agent is providing data for supervisor metrics
    await agentPage.bringToFront();
    const agentStatus = await agentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    
    console.log('✅ Agent coordination for metrics verified');
    
    //--------------------------------
    // Assert: Verify Complete Metrics Management Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete metrics management workflow ===');
    
    // Execute complete metrics workflow
    const workflowResult = await supervisorViewClient.executeMetricsWorkflow(
      sessionName,
      metricsConfig.defaultMetrics
    );
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.metricsAdded.length).toBe(metricsConfig.defaultMetrics.length);
    expect(workflowResult.metricsRemoved.length).toBe(metricsConfig.defaultMetrics.length);
    
    console.log('✅ Complete metrics management workflow verified');
    
    // Verify session tracking
    const activeSession = supervisorViewClient.getSupervisorViewSession(sessionName);
    expect(activeSession?.isActive).toBe(true);
    
    console.log('✅ Supervisor view session tracking verified');
    
    //--------------------------------
    // Cleanup: End sessions and close contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Ending sessions and closing contexts ===');
    
    supervisorViewClient.endSupervisorViewSession(sessionName);
    supervisorViewClient.cleanup();
    
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Supervisor view metrics management verified ===');
    console.log('✅ WebRTC Agent 21 provides data for supervisor view metrics');
    console.log('✅ Supervisor can add metrics to supervisor view');
    console.log('✅ Supervisor can remove metrics from supervisor view');
    console.log('✅ Multi-user coordination for metrics testing functional');
    console.log('✅ Agent skill coordination with supervisor view operational');
    console.log('✅ Supervisor view metrics management workflow validated');
  });
  
  /**
   * Test simplified metrics management workflow
   */
  test('Supervisor view metrics management basic workflow', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    await supervisorViewPage.navigateToSupervisorView();
    
    // Test basic metrics workflow
    await supervisorViewPage.switchToSkillView();
    await supervisorViewPage.verifySkillViewMode();
    
    console.log('Supervisor view metrics basic workflow verified');
  });
  
  /**
   * Test metrics configuration and session tracking
   */
  test('Metrics configuration and session tracking verification', async ({ page }) => {
    const supervisorViewClient = createSupervisorViewManagementClient();
    
    // Test metrics configuration generation
    const metricsConfig = supervisorViewClient.generateMetricsConfiguration();
    expect(metricsConfig.defaultMetrics.length).toBeGreaterThan(0);
    expect(metricsConfig.availableMetrics.length).toBeGreaterThan(0);
    
    // Test session creation
    const session = supervisorViewClient.createSupervisorViewSession({
      sessionName: 'Test Session',
      supervisorId: 'test-supervisor'
    });
    expect(session.isActive).toBe(true);
    
    supervisorViewClient.cleanup();
    
    console.log('Metrics configuration and session tracking verified');
  });
});


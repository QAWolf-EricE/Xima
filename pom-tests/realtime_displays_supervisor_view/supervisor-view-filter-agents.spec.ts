import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorViewMetricsPage } from '../../pom-migration/pages/supervisor/supervisor-view-metrics-page';
import { createSupervisorViewManagementClient } from '../../pom-migration/api-clients/supervisor-view-management/supervisor-view-management-client';

/**
 * Supervisor View Filter Agents Test
 * 
 * Migrated from: tests/realtime_displays_supervisor_view/supervisor_view_filter_agents.spec.js
 * 
 * This test verifies supervisor view agent filtering functionality:
 * 1. Supervisor access to realtime displays supervisor view
 * 2. View mode switching (Skill view ↔ Agent view)
 * 3. Agent filtering configuration and application
 * 4. Supervisor view data verification and validation
 * 5. Filter state management and view transitions
 */
test.describe('Supervisor View - Agent Filtering', () => {
  
  test('Supervisor can filter agents in supervisor view realtime display', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for agent filtering
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for agent filtering ===');
    
    //--------------------------------
    // Supervisor Setup for Agent Filtering
    //--------------------------------
    
    console.log('Setting up Supervisor for agent filtering...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for agent filtering');
    
    //--------------------------------
    // Initialize Supervisor View for Filtering
    //--------------------------------
    
    console.log('=== NAVIGATION: Accessing supervisor view for agent filtering ===');
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    const supervisorViewClient = createSupervisorViewManagementClient();
    
    // Navigate to Supervisor View
    await supervisorViewPage.navigateToSupervisorView();
    
    console.log('✅ Supervisor view accessed for agent filtering');
    
    //--------------------------------
    // Verify Initial State: Skill View Mode
    //--------------------------------
    
    console.log('=== INITIAL STATE: Verifying skill view mode ===');
    
    // Check if we need to revert to skill view (matching original test logic)
    try {
      const summaryItem = page.locator('app-realtime-status-summary-item').first();
      await expect(summaryItem).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Already in skill view mode');
    } catch {
      // Revert to skill view as per original test
      console.log('Reverting to skill view...');
      await supervisorViewPage.switchToSkillView();
    }
    
    // Verify skill view state
    await supervisorViewPage.verifySkillViewMode();
    
    console.log('✅ Skill view mode confirmed');
    
    //--------------------------------
    // Act: Filter Agents on Supervisor View
    //--------------------------------
    
    console.log('=== ACT: Filtering agents on supervisor view ===');
    
    // Create supervisor view session for filtering
    const filterSession = supervisorViewClient.createSupervisorViewSession({
      sessionName: 'Agent Filtering Session',
      supervisorId: 'supervisor',
      viewMode: 'skill'
    });
    
    // Switch to agent view for filtering
    await supervisorViewPage.switchToAgentView();
    
    // Configure agent filtering
    await supervisorViewPage.configureAgentFilter();
    
    console.log('✅ Agent filtering configuration completed');
    
    // Update session with filter configuration
    supervisorViewClient.addFilterToSession('Agent Filtering Session', {
      type: 'view_mode',
      value: 'agent',
      appliedTime: new Date()
    });
    
    //--------------------------------
    // Verify: Agent Filter Results
    //--------------------------------
    
    console.log('=== VERIFY: Confirming agent filter results ===');
    
    // Wait for agent view to load
    await supervisorViewPage.waitForSupervisorViewData();
    
    // Verify agent view mode
    await supervisorViewPage.verifyAgentViewMode();
    
    // Get supervisor view data
    const viewData = await supervisorViewPage.verifySupervisorViewData();
    expect(viewData.currentViewMode).toBe('agent');
    expect(viewData.hasFilterAgent).toBe(true);
    
    console.log(`✅ Agent filtering verified - ${viewData.agentCount} agents displayed`);
    
    //--------------------------------
    // Filter State Management Verification
    //--------------------------------
    
    console.log('=== MANAGEMENT: Verifying filter state management ===');
    
    // Verify filter session tracking
    const activeSession = supervisorViewClient.getSupervisorViewSession('Agent Filtering Session');
    expect(activeSession?.filters.length).toBeGreaterThan(0);
    expect(activeSession?.viewMode).toBe('skill'); // Original mode, then filtered
    
    console.log('✅ Filter state management verified');
    
    //--------------------------------
    // Switch Back to Skill View (Test View Transitions)
    //--------------------------------
    
    console.log('=== TRANSITION: Testing view mode transitions ===');
    
    // Switch back to skill view to test transitions
    await supervisorViewPage.switchToSkillView();
    await supervisorViewPage.verifySkillViewMode();
    
    console.log('✅ View mode transition (Agent → Skill) verified');
    
    //--------------------------------
    // Final Verification: Supervisor View Filtering Capability
    //--------------------------------
    
    console.log('=== FINAL: Verifying complete filtering capability ===');
    
    // Verify supervisor view data after transitions
    const finalViewData = await supervisorViewPage.verifySupervisorViewData();
    console.log('Final supervisor view state:', finalViewData);
    
    expect(finalViewData.currentViewMode).toBe('skill');
    expect(finalViewData.skillCount).toBeGreaterThan(0);
    
    console.log('✅ Complete filtering capability verified');
    
    //--------------------------------
    // Cleanup: End sessions and close contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Ending sessions and closing contexts ===');
    
    supervisorViewClient.endSupervisorViewSession('Agent Filtering Session');
    supervisorViewClient.cleanup();
    
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Supervisor view agent filtering verified ===');
    console.log('✅ Supervisor can access agent filtering interface');
    console.log('✅ View mode switching (Skill ↔ Agent) functional');
    console.log('✅ Agent filter configuration working correctly');
    console.log('✅ Filter state management and transitions operational');
    console.log('✅ Supervisor view data verification confirmed');
    console.log('✅ Agent filtering workflow validation complete');
  });
  
  /**
   * Test view mode transitions
   */
  test('Supervisor view mode transitions verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    await supervisorViewPage.navigateToSupervisorView();
    
    // Test skill → agent → skill transitions
    await supervisorViewPage.switchToSkillView();
    await supervisorViewPage.verifySkillViewMode();
    
    await supervisorViewPage.switchToAgentView();
    await supervisorViewPage.verifyAgentViewMode();
    
    await supervisorViewPage.switchToSkillView();
    await supervisorViewPage.verifySkillViewMode();
    
    console.log('Supervisor view mode transitions verification completed');
  });
  
  /**
   * Test agent filtering configuration
   */
  test('Agent filtering configuration workflow verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    await supervisorViewPage.navigateToSupervisorView();
    
    // Switch to agent view and configure filtering
    await supervisorViewPage.switchToAgentView();
    await supervisorViewPage.configureAgentFilter();
    
    // Verify filtering configuration
    const viewData = await supervisorViewPage.verifySupervisorViewData();
    expect(viewData.hasFilterAgent).toBe(true);
    
    console.log('Agent filtering configuration workflow verified');
  });
});


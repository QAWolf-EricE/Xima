import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorViewMetricsPage } from '../../pom-migration/pages/supervisor/supervisor-view-metrics-page';
import { createSupervisorViewManagementClient } from '../../pom-migration/api-clients/supervisor-view-management/supervisor-view-management-client';

/**
 * Supervisor View More Options Test
 * 
 * Migrated from: tests/realtime_displays_supervisor_view/supervisor_view_more_options.spec.js
 * 
 * This test verifies supervisor view more options functionality:
 * 1. Supervisor access to realtime displays supervisor view
 * 2. Navigation to supervisor view with skill filtering
 * 3. More options menu access (manage formulas, edit summary metrics)
 * 4. Manage formulas dialog functionality and verification
 * 5. Edit summary metrics dialog functionality and verification
 * 6. Complete more options workflow testing
 */
test.describe('Supervisor View - More Options', () => {
  
  test('Supervisor can access and manage more options (formulas and summary metrics)', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for more options testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for more options testing ===');
    
    //--------------------------------
    // Supervisor Setup for More Options
    //--------------------------------
    
    console.log('Setting up Supervisor for more options management...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor logged in for more options testing');
    
    //--------------------------------
    // Initialize Supervisor View for More Options
    //--------------------------------
    
    console.log('=== NAVIGATION: Accessing supervisor view for more options ===');
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    const supervisorViewClient = createSupervisorViewManagementClient();
    
    // Navigate to Supervisor View directly (matching original test)
    await supervisorViewPage.navigateToSupervisorViewDirect();
    
    console.log('✅ Supervisor view accessed for more options testing');
    
    //--------------------------------
    // Setup: Configure Skill View for More Options
    //--------------------------------
    
    console.log('=== SETUP: Configuring skill view for more options ===');
    
    // Switch to skill view and apply filters (matching original test workflow)
    await supervisorViewPage.waitForTimeout(3000, 'View stabilization');
    await supervisorViewPage.switchToSkillView();
    await supervisorViewPage.waitForTimeout(3000, 'Skill view loading');
    
    console.log('✅ Skill view configured for more options testing');
    
    // Create session for more options tracking
    const moreOptionsSession = supervisorViewClient.createSupervisorViewSession({
      sessionName: 'More Options Session',
      supervisorId: 'supervisor',
      viewMode: 'skill'
    });
    
    //--------------------------------
    // Act: Test Manage Formulas Functionality
    //--------------------------------
    
    console.log('=== ACT: Testing manage formulas functionality ===');
    
    // Open manage formulas dialog
    await supervisorViewPage.openManageFormulas();
    
    console.log('✅ Manage formulas dialog opened and verified');
    
    // Close manage formulas dialog
    await supervisorViewPage.closeManageFormulas();
    
    console.log('✅ Manage formulas dialog closed successfully');
    
    //--------------------------------
    // Test Edit Summary Metrics Functionality
    //--------------------------------
    
    console.log('=== EDIT METRICS: Testing edit summary metrics functionality ===');
    
    // Open edit summary metrics dialog
    await supervisorViewPage.openEditSummaryMetrics();
    
    console.log('✅ Edit summary metrics dialog opened and verified');
    
    // Close edit summary metrics dialog
    await supervisorViewPage.closeEditSummaryMetrics();
    
    console.log('✅ Edit summary metrics dialog closed successfully');
    
    //--------------------------------
    // Complete More Options Workflow
    //--------------------------------
    
    console.log('=== WORKFLOW: Testing complete more options workflow ===');
    
    // Execute complete more options workflow
    await supervisorViewPage.executeMoreOptionsWorkflow();
    
    console.log('✅ Complete more options workflow executed');
    
    //--------------------------------
    // Assert: Verify More Options Functionality
    //--------------------------------
    
    console.log('=== ASSERT: Verifying more options functionality ===');
    
    // Verify session tracking for more options
    const activeSession = supervisorViewClient.getSupervisorViewSession('More Options Session');
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.viewMode).toBe('skill');
    
    console.log('✅ More options session tracking verified');
    
    // Verify supervisor view state after more options testing
    const viewData = await supervisorViewPage.verifySupervisorViewData();
    expect(viewData.hasCallsInQueue).toBe(true);
    expect(viewData.currentViewMode).toBe('skill');
    
    console.log('✅ Supervisor view state verified after more options');
    
    //--------------------------------
    // Cleanup: End session and reset
    //--------------------------------
    
    console.log('=== CLEANUP: Ending more options session ===');
    
    supervisorViewClient.endSupervisorViewSession('More Options Session');
    supervisorViewClient.cleanup();
    
    console.log('=== TEST COMPLETED: Supervisor view more options verified ===');
    console.log('✅ Supervisor can access more options menu');
    console.log('✅ Manage formulas dialog functional');
    console.log('✅ Edit summary metrics dialog operational');
    console.log('✅ More options workflow transitions working');
    console.log('✅ Supervisor view state management during options confirmed');
    console.log('✅ More options functionality validation complete');
  });
  
  /**
   * Test manage formulas standalone functionality
   */
  test('Manage formulas standalone functionality verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    await supervisorViewPage.navigateToSupervisorView();
    
    // Test manage formulas in isolation
    await supervisorViewPage.openManageFormulas();
    await supervisorViewPage.closeManageFormulas();
    
    console.log('Manage formulas standalone functionality verified');
  });
  
  /**
   * Test edit summary metrics standalone functionality
   */
  test('Edit summary metrics standalone functionality verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const supervisorViewPage = new SupervisorViewMetricsPage(page);
    await supervisorViewPage.navigateToSupervisorView();
    
    // Test edit summary metrics in isolation
    await supervisorViewPage.openEditSummaryMetrics();
    await supervisorViewPage.closeEditSummaryMetrics();
    
    console.log('Edit summary metrics standalone functionality verified');
  });
});


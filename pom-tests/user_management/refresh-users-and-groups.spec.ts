import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UserManagementPage } from '../../pom-migration/pages/admin/user-management-page';
import { createUserManagementClient } from '../../pom-migration/api-clients/user-management/user-management-client';

/**
 * Refresh Users and Groups Test
 * 
 * Migrated from: tests/user_management/refresh_users_and_groups.spec.js
 * 
 * This test verifies user directory refresh functionality:
 * 1. Supervisor access to user management interface
 * 2. User directory synchronization (Sync UC Users or Refresh Directory)
 * 3. Progress bar monitoring and completion verification
 * 4. Refresh modal handling and page update workflow
 */
test.describe('User Management - Refresh Users and Groups', () => {
  
  test('Supervisor can refresh users and groups directory with progress tracking', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for user directory refresh ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(page);
    await userManagementPage.verifyUserManagementPageLoaded();
    
    const userMgmtClient = createUserManagementClient();
    const userSession = userMgmtClient.createUserManagementSession({
      sessionName: 'User Directory Refresh Session',
      sessionType: 'directory_refresh'
    });
    
    console.log('=== ACT: Executing user directory refresh workflow ===');
    
    // Execute complete refresh workflow
    const refreshResult = await userManagementPage.executeUserRefreshWorkflow();
    
    // Track directory operation
    const directoryOp = userMgmtClient.trackDirectoryOperation('sync_uc_users');
    userMgmtClient.completeDirectoryOperation(directoryOp.operationId, refreshResult.success, {
      duration: refreshResult.steps.find(s => s.step === 'directory_refresh')?.details?.duration,
      progressBarShown: refreshResult.steps.find(s => s.step === 'directory_refresh')?.details?.progressBarShown,
      modalHandled: refreshResult.steps.find(s => s.step === 'directory_refresh')?.details?.modalHandled
    });
    
    console.log('=== ASSERT: Verifying user directory refresh completed ===');
    
    // Verify refresh workflow completed successfully
    expect(refreshResult.success).toBe(true);
    expect(refreshResult.workflowType).toBe('user_directory_refresh');
    expect(refreshResult.steps.length).toBeGreaterThan(0);
    
    // Verify all workflow steps completed successfully
    refreshResult.steps.forEach(step => {
      expect(step.success).toBe(true);
    });
    
    // Verify directory operation tracking
    const completedOperation = userMgmtClient.directoryOperations.get(directoryOp.operationId);
    expect(completedOperation?.status).toBe('completed');
    
    // Execute user management workflow tracking
    const workflowResult = userMgmtClient.executeUserManagementWorkflow({
      workflowType: 'directory_refresh_validation',
      operations: [
        {
          type: 'directory_sync',
          target: 'uc_users',
          details: {
            syncType: 'full_refresh',
            progressTracked: true,
            modalHandled: true
          }
        }
      ]
    });
    
    expect(workflowResult.success).toBe(true);
    expect(workflowResult.operations.length).toBe(1);
    
    // Generate analytics
    const analytics = userMgmtClient.generateUserManagementAnalytics();
    expect(analytics.directoryOperations).toBeGreaterThan(0);
    
    // Cleanup
    userMgmtClient.endUserManagementSession(userSession.sessionName);
    userMgmtClient.cleanup();
    
    console.log('=== TEST COMPLETED: User directory refresh workflow verified ===');
  });
  
  test('User directory refresh handles progress bar and modal correctly', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for refresh progress and modal validation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(page);
    
    console.log('=== ACT: Testing refresh progress and modal handling ===');
    
    // Execute just the refresh operation to test progress tracking
    const refreshResult = await userManagementPage.refreshUsersAndGroups();
    
    console.log('=== ASSERT: Verifying progress tracking and modal handling ===');
    
    // Verify progress bar was shown and handled
    expect(refreshResult.progressBarShown).toBe(true);
    expect(refreshResult.modalHandled).toBe(true);
    expect(refreshResult.success).toBe(true);
    expect(refreshResult.duration).toBeGreaterThan(0);
    
    // Verify timing is reasonable (should be less than 30 seconds)
    expect(refreshResult.duration).toBeLessThan(30000);
    
    console.log('=== TEST COMPLETED: Refresh progress and modal handling verified ===');
  });
});


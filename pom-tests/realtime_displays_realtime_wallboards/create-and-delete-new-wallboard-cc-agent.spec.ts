import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

/**
 * Create and Delete New Wallboard - CC Agent Test
 * 
 * Migrated from: tests/realtime_displays_realtime_wallboards/create_and_delete_new_wallboard_cc_agent.spec.js
 * 
 * This test verifies CC Agent wallboard creation and deletion:
 * 1. CC Agent specific wallboard template and configuration
 * 2. Contact Center agent integration with wallboard displays
 * 3. Wallboard creation, verification, and deletion workflow
 * 4. CC Agent wallboard cleanup and management
 */
test.describe('Realtime Wallboards - CC Agent Creation', () => {
  
  test('Supervisor can create and delete CC Agent wallboard', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for CC Agent wallboard ===');
    
    const wallboardName = "Create CC Agent Wallboard";
    
    console.log(`CC Agent wallboard test starting: ${wallboardName}`);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    await wallboardsPage.navigateToWallboards();
    
    console.log('=== ACT: Creating CC Agent wallboard ===');
    
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.AGENT_AND_SKILL, // CC Agent template
      configureSkills: true,
      configureAgents: true
    });
    
    console.log('=== ASSERT: Verifying CC Agent wallboard ===');
    
    await wallboardsPage.verifyWallboardExists(wallboardName);
    
    console.log('=== CLEANUP: Removing CC Agent wallboard ===');
    
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: CC Agent wallboard creation and deletion verified ===');
  });
});

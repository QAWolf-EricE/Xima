import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

/**
 * Create New Wallboard - SLA Test
 * 
 * Migrated from: tests/realtime_displays_realtime_wallboards/create_new_wallboard_sla.spec.js
 * 
 * This test verifies SLA wallboard creation functionality:
 * 1. SLA-specific wallboard template selection
 * 2. SLA metrics configuration and setup
 * 3. Service Level Agreement monitoring wallboard creation
 * 4. SLA wallboard verification and management
 */
test.describe('Realtime Wallboards - SLA Creation', () => {
  
  test('Supervisor can create SLA wallboard for service level monitoring', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for SLA wallboard creation ===');
    
    const wallboardName = "Create SLA Wallboard";
    
    console.log(`SLA wallboard test starting: ${wallboardName}`);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    await wallboardsPage.navigateToWallboards();
    
    console.log('=== ACT: Creating SLA wallboard ===');
    
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.SLA,
      configureSkills: true,
      configureAgents: true
    });
    
    console.log('=== ASSERT: Verifying SLA wallboard ===');
    
    await wallboardsPage.verifyWallboardExists(wallboardName);
    
    console.log('=== CLEANUP: Removing test wallboard ===');
    
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: SLA wallboard creation verified ===');
  });
});


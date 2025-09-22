import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

/**
 * Create New Wallboard - Two Skills Test
 * 
 * Migrated from: tests/realtime_displays_realtime_wallboards/create_new_wallboard_two_skills.spec.js
 * 
 * This test verifies two skills wallboard creation functionality:
 * 1. Two skills wallboard template selection and configuration
 * 2. Multi-skill template configuration and setup
 * 3. Wallboard creation and verification workflow
 * 4. Two skills wallboard cleanup and management
 */
test.describe('Realtime Wallboards - Two Skills Creation', () => {
  
  test('Supervisor can create two skills wallboard with multi-skill configuration', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for two skills wallboard creation ===');
    
    const wallboardName = "Create Two Skills Wallboard";
    
    console.log(`Two skills wallboard test starting: ${wallboardName}`);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    await wallboardsPage.navigateToWallboards();
    
    console.log('=== ACT: Creating two skills wallboard ===');
    
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.TWO_SKILLS,
      configureSkills: true,
      configureAgents: true
    });
    
    console.log('=== ASSERT: Verifying two skills wallboard ===');
    
    await wallboardsPage.verifyWallboardExists(wallboardName);
    
    console.log('=== CLEANUP: Removing test wallboard ===');
    
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: Two skills wallboard creation verified ===');
  });
});


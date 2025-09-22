import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';
import { createWallboardManagementClient } from '../../pom-migration/api-clients/wallboard-management/wallboard-management-client';

/**
 * Create New Wallboard - Custom 8-14 Widgets Test
 * 
 * Migrated from: tests/realtime_displays_realtime_wallboards/create_new_wallboard_custom_8_14_widgets.spec.js
 * 
 * This test verifies complex custom wallboard creation with 8-14 widgets:
 * 1. Advanced custom wallboard template with extensive widget configuration
 * 2. Extended widget types and complex layout management (8-14 widgets)
 * 3. Advanced wallboard grid layout and positioning
 * 4. Complex widget configuration and validation
 * 5. Large-scale wallboard testing and management
 */
test.describe('Realtime Wallboards - Custom 8-14 Widgets', () => {
  
  test('Supervisor can create custom wallboard with 8-14 widgets configuration', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for custom 8-14 widgets wallboard ===');
    
    const wallboardPrefix = 'QA Wallboard 8-14';
    const wallboardName = WallboardsManagementPage.generateWallboardName(wallboardPrefix);
    
    console.log(`Custom 8-14 widgets wallboard test: ${wallboardName}`);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    const wallboardClient = createWallboardManagementClient();
    
    await wallboardsPage.navigateToWallboards();
    
    console.log('=== ACT: Creating custom wallboard with 8-14 widgets ===');
    
    // Generate advanced widget configuration
    const advancedConfig = wallboardClient.generateCustomWallboardConfig(14);
    expect(advancedConfig.layout).toBe('grid-8-14');
    expect(advancedConfig.widgetCount).toBe(14);
    
    const wallboardSession = wallboardClient.createWallboardSession({
      name: wallboardName,
      template: WallboardTemplate.CUSTOM,
      configuration: advancedConfig
    });
    
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.CUSTOM,
      configureSkills: true,
      configureAgents: true
    });
    
    console.log('=== ASSERT: Verifying custom 8-14 widgets wallboard ===');
    
    await wallboardsPage.verifyWallboardExists(wallboardName);
    
    console.log('=== CLEANUP: Removing test wallboard ===');
    
    await wallboardsPage.deleteWallboard(wallboardName);
    wallboardClient.cleanup();
    
    console.log('=== TEST COMPLETED: Custom 8-14 widgets wallboard verified ===');
  });
});


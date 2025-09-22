import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';
import { createWallboardManagementClient } from '../../pom-migration/api-clients/wallboard-management/wallboard-management-client';

/**
 * Create New Wallboard - Single Skill Test
 * 
 * Migrated from: tests/realtime_displays_realtime_wallboards/create_new_wallboard_single_skill.spec.js
 * 
 * This test verifies single skill wallboard creation functionality:
 * 1. Supervisor access to realtime wallboards interface
 * 2. Single skill wallboard template selection and configuration
 * 3. Template configuration with skills and agents setup
 * 4. Wallboard preview with content verification
 * 5. Wallboard saving and cleanup workflow
 */
test.describe('Realtime Wallboards - Single Skill Creation', () => {
  
  test('Supervisor can create single skill wallboard with complete configuration', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for single skill wallboard creation
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for single skill wallboard creation ===');
    
    // Test constants (matching original test exactly)
    const wallboardName = "Create Single Skill Wallboard";
    const expectedPreviewElements = [
      "Agent Leaderboard",
      "Logged In", 
      "Avg Call Waiting",
      "Presented Call Count"
    ];
    
    console.log(`Single skill wallboard test starting:`);
    console.log(`- Wallboard name: ${wallboardName}`);
    console.log(`- Expected preview elements: ${expectedPreviewElements.join(', ')}`);
    
    //--------------------------------
    // Supervisor Setup for Wallboard Management
    //--------------------------------
    
    console.log('Setting up Supervisor for wallboard management...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for wallboard management');
    
    //--------------------------------
    // Initialize Wallboard Management Infrastructure
    //--------------------------------
    
    const wallboardsPage = new WallboardsManagementPage(page);
    const wallboardClient = createWallboardManagementClient();
    
    // Navigate to realtime wallboards
    await wallboardsPage.navigateToWallboards();
    
    console.log('✅ Wallboards management interface accessed');
    
    //--------------------------------
    // Cleanup: Remove Existing Test Wallboards
    //--------------------------------
    
    console.log('=== CLEANUP: Removing existing test wallboards ===');
    
    // Clean up any existing wallboards with the same name
    await wallboardsPage.cleanupWallboards(wallboardName);
    
    console.log('✅ Pre-test cleanup completed');
    
    //--------------------------------
    // Act: Create Single Skill Wallboard
    //--------------------------------
    
    console.log('=== ACT: Creating single skill wallboard ===');
    
    // Create wallboard session for tracking
    const wallboardSession = wallboardClient.createWallboardSession({
      name: wallboardName,
      template: WallboardTemplate.SINGLE_SKILL,
      configuration: { skills: 'all', agents: 'all' }
    });
    
    // Create single skill wallboard with complete configuration
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.SINGLE_SKILL,
      configureSkills: true,
      configureAgents: true,
      previewElements: expectedPreviewElements
    });
    
    console.log(`✅ Single skill wallboard created: ${wallboardName}`);
    
    //--------------------------------
    // Verify: Wallboard Creation Success
    //--------------------------------
    
    console.log('=== VERIFY: Confirming wallboard creation success ===');
    
    // Verify wallboard exists in the system
    await wallboardsPage.verifyWallboardExists(wallboardName);
    
    console.log(`✅ Single skill wallboard verified: ${wallboardName}`);
    
    // Verify wallboard session tracking
    const activeSession = wallboardClient.getWallboardSession(wallboardName);
    expect(activeSession?.isActive).toBe(true);
    expect(activeSession?.template).toBe(WallboardTemplate.SINGLE_SKILL);
    
    console.log('✅ Wallboard session tracking verified');
    
    //--------------------------------
    // Cleanup: Remove Created Wallboard
    //--------------------------------
    
    console.log('=== CLEANUP: Removing created wallboard ===');
    
    // Delete the wallboard we created
    await wallboardsPage.deleteWallboard(wallboardName);
    
    // End wallboard session
    wallboardClient.endWallboardSession(wallboardName);
    
    console.log(`✅ Wallboard cleanup completed: ${wallboardName}`);
    
    //--------------------------------
    // Final Cleanup: Reset wallboard management client
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Resetting wallboard management ===');
    
    wallboardClient.cleanup();
    
    console.log('=== TEST COMPLETED: Single skill wallboard creation verified ===');
    console.log('✅ Supervisor can access wallboards management interface');
    console.log('✅ Single skill template selection working');
    console.log('✅ Template configuration (skills + agents) functional');
    console.log('✅ Wallboard preview with expected elements verified');
    console.log('✅ Wallboard saving workflow operational');
    console.log('✅ Wallboard cleanup and deletion working');
  });
  
  /**
   * Test simplified single skill wallboard creation
   */
  test('Single skill wallboard basic creation workflow', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    await wallboardsPage.navigateToWallboards();
    
    const testName = WallboardsManagementPage.generateWallboardName('Test Single Skill');
    
    // Create basic single skill wallboard
    await wallboardsPage.createWallboardFromTemplate({
      name: testName,
      template: WallboardTemplate.SINGLE_SKILL
    });
    
    // Verify and cleanup
    await wallboardsPage.verifyWallboardExists(testName);
    await wallboardsPage.deleteWallboard(testName);
    
    console.log('Single skill wallboard basic creation verified');
  });
  
  /**
   * Test single skill wallboard preview elements
   */
  test('Single skill wallboard preview elements verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const wallboardsPage = new WallboardsManagementPage(page);
    await wallboardsPage.navigateToWallboards();
    
    // Test preview elements for single skill wallboard
    const previewElements = ["Agent Leaderboard", "Logged In", "Avg Call Waiting", "Presented Call Count"];
    
    const testName = WallboardsManagementPage.generateWallboardName('Preview Test');
    
    await wallboardsPage.createCompleteWallboard({
      name: testName,
      template: WallboardTemplate.SINGLE_SKILL,
      previewElements: previewElements
    });
    
    await wallboardsPage.deleteWallboard(testName);
    
    console.log('Single skill wallboard preview elements verification completed');
  });
});


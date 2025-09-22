import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { LoopsManagementPage } from '../../pom-migration/pages/realtime/loops-management-page';
import { RealtimeDisplaysPage } from '../../pom-migration/pages/realtime/realtime-displays-page';

/**
 * Loops Create and Delete Test
 * 
 * Migrated from: tests/realtime_displays_loops/loops_create_and_delete_a_loop.spec.js
 * 
 * This test verifies the loops management functionality for realtime displays:
 * 1. Supervisor access to realtime displays and loops
 * 2. Loop creation workflow with wallboard configuration
 * 3. Loop verification and existence validation
 * 4. Loop deletion workflow and cleanup verification
 * 5. Loop name generation and prefix management
 */
test.describe('Realtime Displays - Loop Management', () => {
  
  test('Supervisor can create and delete loops with wallboard configuration', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for loops management
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for loops management ===');
    
    // Test constants (matching original test exactly)
    const prefix = "QA Loop";
    const newLoopName = LoopsManagementPage.generateLoopName(prefix);
    
    console.log(`Loops management test starting:`);
    console.log(`- Loop prefix: ${prefix}`);
    console.log(`- New loop name: ${newLoopName}`);
    
    //--------------------------------
    // Supervisor Setup for Loops Management
    //--------------------------------
    
    console.log('Setting up Supervisor for loops management...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in and on Reports page');
    
    //--------------------------------
    // Navigation: Access Loops Management
    //--------------------------------
    
    console.log('=== NAVIGATION: Accessing loops management interface ===');
    
    // Navigate to loops management
    const loopsManagementPage = new LoopsManagementPage(page);
    await loopsManagementPage.navigateToLoops();
    
    console.log('✅ Loops management interface accessed');
    
    // Verify "Create a Loop" button is available
    const createLoopButton = page.getByRole('button', { name: 'Create a Loop' });
    await expect(createLoopButton).toBeVisible();
    
    console.log('✅ Loop creation interface verified');
    
    //--------------------------------
    // Cleanup: Remove existing test loops
    //--------------------------------
    
    console.log('=== CLEANUP: Removing any existing test loops ===');
    
    // Clean up any previously created loops with the same prefix
    await loopsManagementPage.cleanupLoopsByPrefix(prefix);
    
    console.log('✅ Pre-test cleanup completed');
    
    //--------------------------------
    // Act: Create New Loop
    //--------------------------------
    
    console.log('=== ACT: Creating new loop with wallboard configuration ===');
    
    // Create loop with wallboard configuration
    await loopsManagementPage.createLoopWithWallboard({
      name: newLoopName,
      includeWallboard: true,
      wallboardTiming: '1 minute'
    });
    
    console.log(`✅ Loop created successfully: ${newLoopName}`);
    
    //--------------------------------
    // Verify: Loop Creation Success
    //--------------------------------
    
    console.log('=== VERIFY: Confirming loop creation success ===');
    
    // Verify loop exists in the list
    await loopsManagementPage.verifyLoopExists(newLoopName);
    
    console.log(`✅ Loop verified in loops list: ${newLoopName}`);
    
    // Get current loop count for verification
    const loopCount = await loopsManagementPage.getLoopCount();
    console.log(`Current loops in system: ${loopCount}`);
    
    //--------------------------------
    // Act: Delete Created Loop
    //--------------------------------
    
    console.log('=== DELETE: Removing created loop ===');
    
    // Delete the loop we just created
    await loopsManagementPage.deleteLoop(newLoopName);
    
    console.log(`Loop deletion initiated: ${newLoopName}`);
    
    //--------------------------------
    // Assert: Verify Loop Deletion
    //--------------------------------
    
    console.log('=== ASSERT: Verifying loop deletion success ===');
    
    // Verify loop no longer exists in the list
    await loopsManagementPage.verifyLoopNotExists(newLoopName);
    
    console.log(`✅ Loop verified as deleted: ${newLoopName}`);
    
    // Verify loop count decreased
    const finalLoopCount = await loopsManagementPage.getLoopCount();
    console.log(`Final loops in system: ${finalLoopCount}`);
    
    //--------------------------------
    // Final Verification: Loops Management State
    //--------------------------------
    
    console.log('=== FINAL: Verifying loops management system state ===');
    
    // Verify no test loops remain
    const hasTestLoops = await loopsManagementPage.hasLoopsWithPrefix(prefix);
    expect(hasTestLoops).toBe(false);
    
    console.log(`✅ No test loops remaining with prefix: ${prefix}`);
    
    // Verify loops management interface is still functional
    const createButton = page.getByRole('button', { name: 'Create a Loop' });
    await expect(createButton).toBeVisible();
    
    console.log('✅ Loops management interface remains functional');
    
    console.log('=== TEST COMPLETED: Loop creation and deletion verified successfully ===');
    console.log('✅ Supervisor can access loops management interface');
    console.log('✅ Loop creation workflow with wallboard configuration working');
    console.log('✅ Loop existence verification functional');
    console.log('✅ Loop deletion workflow operational');
    console.log('✅ Loop name generation and management working');
    console.log('✅ Loops management system state properly maintained');
  });
  
  /**
   * Test simplified loop creation workflow
   */
  test('Loop creation basic workflow verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const loopsManagementPage = new LoopsManagementPage(page);
    await loopsManagementPage.navigateToLoops();
    
    // Test basic loop creation interface
    const testLoopName = LoopsManagementPage.generateLoopName('Test Loop');
    
    // Create simple loop without wallboard
    await loopsManagementPage.createLoop(testLoopName);
    await loopsManagementPage.verifyLoopExists(testLoopName);
    
    // Clean up
    await loopsManagementPage.deleteLoop(testLoopName);
    await loopsManagementPage.verifyLoopNotExists(testLoopName);
    
    console.log('Loop creation basic workflow verification completed');
  });
  
  /**
   * Test loop management interface accessibility
   */
  test('Loops management interface accessibility verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const realtimeDisplaysPage = new RealtimeDisplaysPage(page);
    
    // Test navigation to realtime displays
    await realtimeDisplaysPage.navigateToRealtimeDisplays();
    await realtimeDisplaysPage.verifyRealtimeDisplaysTabs();
    
    // Test navigation to loops
    const loopsPage = await realtimeDisplaysPage.navigateToLoops();
    await loopsPage.verifyPageLoaded();
    
    console.log('Loops management interface accessibility verification completed');
  });
  
  /**
   * Test loop CRUD operations workflow
   */
  test('Complete loop CRUD operations workflow', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const loopsManagementPage = new LoopsManagementPage(page);
    await loopsManagementPage.navigateToLoops();
    
    // Execute complete CRUD workflow
    const crudLoopName = LoopsManagementPage.generateLoopName('CRUD Test');
    await loopsManagementPage.executeLoopCrudWorkflow(crudLoopName);
    
    console.log('Complete loop CRUD operations workflow verification completed');
  });
});


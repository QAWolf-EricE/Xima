import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

test.describe('Realtime Wallboards - Callbacks Creation', () => {
  test('Supervisor can create callbacks wallboard', async ({ page }) => {
    const wallboardName = "Create Callbacks Wallboard";
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const wallboardsPage = new WallboardsManagementPage(page);
    
    await wallboardsPage.navigateToWallboards();
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.CALLBACKS
    });
    await wallboardsPage.verifyWallboardExists(wallboardName);
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: Callbacks wallboard verified ===');
  });
});

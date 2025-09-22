import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

test.describe('Realtime Wallboards - 4 Skills Creation', () => {
  test('Supervisor can create 4 skills wallboard', async ({ page }) => {
    const wallboardName = "Create 4 Skills Wallboard";
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const wallboardsPage = new WallboardsManagementPage(page);
    
    await wallboardsPage.navigateToWallboards();
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.FOUR_SKILLS
    });
    await wallboardsPage.verifyWallboardExists(wallboardName);
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: 4 Skills wallboard verified ===');
  });
});


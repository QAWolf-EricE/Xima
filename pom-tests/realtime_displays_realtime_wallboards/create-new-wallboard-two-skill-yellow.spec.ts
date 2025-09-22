import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

test.describe('Realtime Wallboards - Two Skill Yellow', () => {
  test('Supervisor can create two skill yellow wallboard', async ({ page }) => {
    const wallboardName = "Create Two Skill Yellow Wallboard";
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const wallboardsPage = new WallboardsManagementPage(page);
    
    await wallboardsPage.navigateToWallboards();
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.TWO_SKILLS
    });
    await wallboardsPage.verifyWallboardExists(wallboardName);
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: Two Skill Yellow wallboard verified ===');
  });
});


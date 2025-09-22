import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

test.describe('Realtime Wallboards - Daily SLA Voice', () => {
  test('Supervisor can create daily SLA voice wallboard', async ({ page }) => {
    const wallboardName = "Create Daily SLA Voice Wallboard";
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const wallboardsPage = new WallboardsManagementPage(page);
    
    await wallboardsPage.navigateToWallboards();
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.DAILY_SLA_VOICE
    });
    await wallboardsPage.verifyWallboardExists(wallboardName);
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: Daily SLA Voice wallboard verified ===');
  });
});


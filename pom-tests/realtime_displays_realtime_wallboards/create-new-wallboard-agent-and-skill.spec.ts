import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WallboardsManagementPage, WallboardTemplate } from '../../pom-migration/pages/realtime/wallboards-management-page';

test.describe('Realtime Wallboards - Agent and Skill Creation', () => {
  test('Supervisor can create agent and skill wallboard', async ({ page }) => {
    const wallboardName = "Create Agent and Skill Wallboard";
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const wallboardsPage = new WallboardsManagementPage(page);
    
    await wallboardsPage.navigateToWallboards();
    await wallboardsPage.createCompleteWallboard({
      name: wallboardName,
      template: WallboardTemplate.AGENT_AND_SKILL
    });
    await wallboardsPage.verifyWallboardExists(wallboardName);
    await wallboardsPage.deleteWallboard(wallboardName);
    
    console.log('=== TEST COMPLETED: Agent and Skill wallboard verified ===');
  });
});


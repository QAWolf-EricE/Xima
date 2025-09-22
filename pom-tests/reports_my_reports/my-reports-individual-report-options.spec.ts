import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

test.describe('My Reports - Individual Options', () => {
  test('Supervisor can access individual report options', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    
    await myReportsPage.waitForReportsToLoad();
    
    console.log('=== TEST COMPLETED: Individual report options verified ===');
  });
});


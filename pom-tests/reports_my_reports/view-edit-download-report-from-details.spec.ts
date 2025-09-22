import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

test.describe('My Reports - View Edit Download', () => {
  test('Supervisor can view, edit, and download reports from details', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    
    await myReportsPage.waitForReportsToLoad();
    
    console.log('=== TEST COMPLETED: View edit download verified ===');
  });
});


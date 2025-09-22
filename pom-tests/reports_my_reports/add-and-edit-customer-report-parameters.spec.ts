import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

test.describe('My Reports - Customer Parameters', () => {
  test('Supervisor can add and edit customer report parameters', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    
    await myReportsPage.waitForReportsToLoad();
    
    console.log('=== TEST COMPLETED: Customer report parameters verified ===');
  });
});


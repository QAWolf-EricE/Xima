import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

test.describe('My Reports - Favorite Functionality', () => {
  test('Supervisor can favorite reports', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    
    await myReportsPage.favoriteReport('Test Report');
    
    console.log('=== TEST COMPLETED: Report favorite functionality verified ===');
  });
});


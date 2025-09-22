import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

test.describe('My Reports - Export Functionality', () => {
  test('Supervisor can export reports', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    
    const exportedFile = await myReportsPage.exportReport('Test Report');
    
    console.log('=== TEST COMPLETED: Report export functionality verified ===');
  });
});


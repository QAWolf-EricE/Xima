import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test white label logo display on login page
 * Migrated from: tests/account/check_white_label_logo.spec.js
 */
test.describe('White Label Logo Verification', () => {
  
  test('login page displays white label logo correctly', async ({ page }) => {
    // Arrange: Navigate to login page with specific browser options
    const loginPage = await LoginPage.create(page);
    
    // Wait for page to fully load
    await loginPage.verifyLoginFormVisible();
    
    // Act & Assert: Take screenshot and compare with baseline
    // This test uses visual regression testing to verify the white label logo
    // Context: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1738704756489859?thread_ts=1738248162.003129&cid=C03PG5DB4N9
    await expect(page).toHaveScreenshot('WhiteLogo.png', {
      maxDiffPixelRatio: 0.01
    });
  });

  test('login page loads correctly for visual comparison', async ({ page }) => {
    // Additional test to ensure page loads consistently for screenshot testing
    const loginPage = await LoginPage.create(page);
    
    // Verify all expected elements are visible before taking screenshot
    await loginPage.verifyLoginFormVisible();
    
    // Verify company logo element exists (should be part of white label)
    const companyLogo = page.locator('[alt="company-logo"], [alt="ccaas logo"]');
    await expect(companyLogo).toBeVisible();
    
    // Verify page is in stable state
    await page.waitForLoadState('networkidle');
    
    console.log('Login page loaded successfully for white label verification');
  });

  test('login page maintains consistent layout for logo placement', async ({ page }) => {
    // Test to ensure layout consistency affects the logo display
    const loginPage = await LoginPage.create(page);
    await loginPage.verifyLoginFormVisible();
    
    // Check that basic layout elements are present
    const usernameInput = page.locator('[data-cy="consolidated-login-username-input"]');
    const passwordInput = page.locator('[data-cy="consolidated-login-password-input"]');
    const loginButton = page.locator('[data-cy="consolidated-login-login-button"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Ensure page layout is stable
    const loginForm = page.locator('form, .login-form').first();
    if (await loginForm.count() > 0) {
      await expect(loginForm).toBeVisible();
    }
    
    console.log('Login page layout is consistent for logo verification');
  });
});

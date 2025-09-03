# Example Migration: Before and After

This document shows a real example of migrating an existing test to the new POM architecture.

## Before: Original Test Structure

Here's how the `login_and_logout_as_supervisor.spec.js` test currently looks:

```javascript
// Original: tests/account/login_and_logout_as_supervisor.spec.js
import { assert, expect, test, launch } from '../../qawHelpers';

test("login_and_logout_as_supervisor", async () => {
  // Constants
  const username = process.env.SUPERVISOR_USERNAME;
  const password = process.env.SUPERVISOR_PASSWORD;

  // Launch web browser
  const { context } = await launch();
  const page = await context.newPage();
  
  // Go to the login URL
  await page.goto(process.env.DEFAULT_URL);

  // Fill in "Username" input field
  await page.locator(`[data-cy="consolidated-login-username-input"]`).fill(username);
  
  // Fill in "Password" input field
  await page.locator(`[data-cy="consolidated-login-password-input"]`).fill(password);
  
  // Click the "Login" button
  await page.locator(`[data-cy="consolidated-login-login-button"]`).click();

  // Store "User Menu" locator
  const userMenu = page.locator(`xima-user-menu`);

  // Assert "User Menu" is visible
  await expect(userMenu).toBeVisible();

  // Assert "SA" initials is within the "User Menu" and is visible
  await expect(userMenu.getByText(`SA`, { exact: true })).toBeVisible();

  // Assert "Cradle to Grave" tab is visible
  await expect(
    page.locator(`[data-cy="reports-c2g-component-tab-ctog"]:has-text("Cradle to Grave")`)
  ).toBeVisible();

  // Logout
  await page.locator(`xima-user-menu`).getByRole(`button`).hover();
  await page.getByRole(`menuitem`, { name: `Logout` }).click();
  
  // Assert redirected to login page
  await expect(page).toHaveURL(/login/);
});
```

## After: Migrated POM Test

Here's the same test using the new POM architecture:

```typescript
// Migrated: tests/account/supervisor-login-logout.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

test.describe('Supervisor Authentication', () => {
  test('supervisor can login and logout successfully', async ({ page }) => {
    // Arrange: Create login page (entry point)
    const loginPage = await LoginPage.create(page);
    
    // Act: Login as supervisor (returns dashboard)
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Assert: Verify supervisor dashboard loaded correctly
    await supervisorDash.verifyDashboardLoaded();
    
    const userInitials = await supervisorDash.getUserInitials();
    expect(userInitials).toBe('SA');
    
    // Verify supervisor privileges
    const hasSupervisorAccess = await supervisorDash.hasSupervisorPrivileges();
    expect(hasSupervisorAccess).toBe(true);
    
    // Act: Logout
    await supervisorDash.logout();
    
    // Assert: Back on login page
    await loginPage.expectUrl(/login|\/$/);
  });
});
```

## Migration Benefits Demonstrated

### 1. **Cleaner Test Logic**
- **Before**: Mixed browser operations with test logic
- **After**: High-level test actions with clear intent

### 2. **Better Error Messages**
- **Before**: Generic Playwright errors about selectors
- **After**: Contextual errors from page objects ("Failed to login as supervisor")

### 3. **Reusability**
- **Before**: Login logic duplicated across many tests
- **After**: `loginAsSupervisor()` method reused everywhere

### 4. **Type Safety**
- **Before**: No compile-time checking for selector typos
- **After**: TypeScript catches errors during development

### 5. **Navigation Flow**
- **Before**: Manual navigation with direct page manipulation
- **After**: Guided navigation with returned page instances

## Complex Test Migration Example

Here's a more complex test showing API integration:

### Before: UC Inbound Call Test

```javascript
// Original: Complex test with mixed concerns
import { logInSupervisor, createCall, inputDigits, dropCall } from '../../lib/node_20_helpers';

test("uc_inbound_direct_to_agent", async () => {
  // Manual browser setup
  const { context, browser } = await launch({
    email: process.env.UC_AGENT_20_EXT_120,
    password: process.env.UC_AGENT_20_EXT_120_PASSWORD,
    args: ["--use-fake-device-for-media-stream"],
    permissions: ["microphone"]
  });
  
  const page = await context.newPage();
  await page.goto(buildUrl("/"));
  
  // Manual login process
  await page.fill('[data-cy="consolidated-login-username-input"]', process.env.UC_AGENT_20_EXT_120);
  await page.fill('[data-cy="consolidated-login-password-input"]', process.env.UC_AGENT_20_EXT_120_PASSWORD);
  await page.click('[data-cy="consolidated-login-login-button"]');
  
  // Manual webphone login
  const webPhoneURL = `https://voice.ximasoftware.com/webphone`;
  const { ucWebPhonePage: webPhonePage } = await logUCAgentIntoUCWebphone(
    context,
    process.env.UC_AGENT_20_EXT_120_WEBPHONE_USERNAME,
    { webphonePassword: process.env.UC_AGENT_20_EXT_120_PASSWORD }
  );
  
  // Supervisor setup in new context
  const context2 = await browser.newContext({ timezoneId: "America/Denver" });
  const page2 = await context2.newPage();
  await page2.goto(buildUrl("/"));
  
  // API call mixed with UI operations
  const callId = await createCall({ number: "4352005133" });
  await inputDigits(callId, "2");
  
  // More manual UI operations...
  await page2.click('[data-cy="supervisor-view-nav"]');
  // ... lots of manual element interactions
  
  await dropCall(callId);
});
```

### After: POM with Separated Concerns

```typescript
// Migrated: Clean separation of concerns
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { WebPhoneLoginPage } from '../../pom-migration/pages/auth/webphone-login-page';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';

test.describe('UC Inbound Call Flows', () => {
  test('direct call to agent with skill selection', async ({ page, browser }) => {
    // Arrange: Set up clients and pages
    const callClient = createCallManagementClient();
    
    // Agent setup
    const agentLoginPage = await LoginPage.create(page);
    const agentDashboard = await agentLoginPage.loginAsAgent({
      username: process.env.UC_AGENT_20_EXT_120!,
      password: process.env.UC_AGENT_20_EXT_120_PASSWORD!
    });
    
    // WebPhone setup  
    const webPhonePage = await WebPhoneLoginPage.create(browser);
    await webPhonePage.loginAgent({
      username: process.env.UC_AGENT_20_EXT_120_WEBPHONE_USERNAME!,
      password: process.env.UC_AGENT_20_EXT_120_PASSWORD!
    });
    
    // Supervisor setup
    const supervisorContext = await browser.newContext({ 
      timezoneId: 'America/Denver' 
    });
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDash = await supervisorLoginPage.loginAsSupervisor();
    
    // Set agent ready for calls
    await agentDashboard.setStatus('Ready');
    await agentDashboard.enableSkill('2');
    
    // Act: Create and route call through API
    const callId = await callClient.createCall({ number: '4352005133' });
    await callClient.inputDigits(callId, '2'); // Select skill 2
    
    // Monitor call through supervisor view
    const supervisorView = await supervisorDash.navigateToSupervisorView();
    await supervisorView.filterByAgent('UC Agent 20');
    
    // Verify call arrival at agent
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    // Verify supervisor can see active call
    await supervisorView.expectAgentOnCall('UC Agent 20');
    
    // Assert: Call completed successfully  
    await callClient.dropCall(callId);
    await agentDashboard.expectCallEnded();
    await supervisorView.expectAgentReady('UC Agent 20');
  });
});
```

## Key Improvements in Migration

### 1. **Separation of Concerns**
- **UI Operations**: Handled by page objects
- **API Operations**: Handled by API clients  
- **Test Logic**: Clean and focused on business scenarios

### 2. **Type Safety and IntelliSense**
```typescript
// TypeScript catches errors at compile time
const dashboard = await loginPage.loginAsSupervisor();
dashboard.navigateToReports(); // ✅ Method exists and is typed
dashboard.navigateToWrongPage(); // ❌ Compile error - method doesn't exist
```

### 3. **Reusable Components**
```typescript
// Reusable across all tests
const callClient = createCallManagementClient();
await callClient.createCall(); // Same API, better error handling
```

### 4. **Better Error Context**
```typescript
// POM provides contextual errors
try {
  await agentDashboard.answerCall();
} catch (error) {
  // Error: "Failed to answer call: Call offer not visible after 30s timeout"
  // Instead of: "Locator not found: [data-cy='answer-call-button']"
}
```

### 5. **Simplified Test Maintenance**
- UI changes only require page object updates
- API changes only require client updates  
- Tests remain stable and readable

## Migration Checklist

When migrating a test, ensure:

- [ ] **Entry points**: Use LoginPage.create() or similar
- [ ] **Navigation**: Use page.navigateToX() methods
- [ ] **API calls**: Move to appropriate API clients
- [ ] **Assertions**: Use page object verification methods
- [ ] **Error handling**: Leverage page object error context
- [ ] **Type safety**: All variables are properly typed
- [ ] **Reusability**: Common operations use shared methods

## Performance Comparison

### Before Migration
- **Test execution**: Variable, depends on manual waits
- **Maintenance**: High - UI changes break many tests
- **Debugging**: Difficult - generic error messages
- **Reusability**: Low - lots of duplication

### After Migration  
- **Test execution**: Consistent, optimized waits
- **Maintenance**: Low - changes isolated to page objects
- **Debugging**: Easy - contextual error messages
- **Reusability**: High - shared page objects and clients

---

This demonstrates the significant improvements in maintainability, reliability, and developer experience achieved through the POM migration.

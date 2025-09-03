# POM Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the Page Object Model migration. Use this as a reference during development and code reviews.

## Quick Start

### 1. Setting Up a New Test with POM

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom-migration/pages/auth/login-page';
import { DEFAULT_CREDENTIALS } from '../pom-migration/shared/constants/app-constants';

test('supervisor can access user management', async ({ page }) => {
  // Entry point - only use constructor for entry pages
  const loginPage = await LoginPage.create(page);
  
  // Navigation-based page creation
  const supervisorDash = await loginPage.loginAsSupervisor();
  const userMgmtPage = await supervisorDash.navigateToUserManagement();
  
  // Page-specific assertions
  await userMgmtPage.verifyAgentLicensingVisible();
});
```

### 2. Creating a New Page Object

```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

export class YourNewPage extends BasePage {
  // Define selectors as private readonly properties
  private readonly mainTitle = this.getByDataCy('page-title');
  private readonly submitButton = this.getByRole('button', { name: 'Submit' });
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  // Verification method (always include)
  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.mainTitle);
    await this.expectText(this.mainTitle, 'Expected Title');
  }

  // Navigation methods return new page instances
  async navigateToNextPage(): Promise<NextPage> {
    await this.clickElement(this.submitButton);
    
    const nextPage = new NextPage(this.page, this.baseUrl);
    await nextPage.verifyPageLoaded();
    
    return nextPage;
  }

  // Action methods for page-specific operations
  async performAction(data: ActionData): Promise<void> {
    // Implementation
  }

  // Getter methods for retrieving data
  async getData(): Promise<PageData> {
    // Implementation
  }
}
```

## Page Object Patterns

### Entry Point Pattern
Only these pages should have public constructors:
- `LoginPage` - Main application entry
- `PortalLoginPage` - Portal entry  
- External test pages (blog, webphone)
- Test utility pages

```typescript
// ✅ Good - Entry point
const loginPage = await LoginPage.create(page);
const dashboard = await loginPage.loginAsSupervisor();

// ❌ Avoid - Direct construction for internal pages  
const dashboard = new SupervisorDashboardPage(page); // Only for entry points
```

### Navigation Pattern
Pages are created through navigation methods:

```typescript
// ✅ Navigation-based creation
const reportsPage = await dashboard.navigateToReports();
const configPage = await reportsPage.openReportConfiguration(reportId);

// ✅ Chain navigation  
const finalPage = await loginPage
  .loginAsSupervisor()
  .then(dash => dash.navigateToReports())
  .then(reports => reports.openScheduledReports());
```

### Selector Strategy
Use this priority order for selectors:

1. **Data-cy attributes** (preferred): `this.getByDataCy('element-id')`
2. **Role-based selectors**: `this.getByRole('button', { name: 'Submit' })`
3. **Text-based selectors**: `this.getByText('Specific Text')`
4. **CSS selectors** (last resort): `this.locator('.css-class')`

```typescript
// ✅ Preferred - Data attributes
private readonly loginButton = this.getByDataCy('consolidated-login-login-button');

// ✅ Good - Semantic selectors  
private readonly submitButton = this.getByRole('button', { name: 'Submit' });

// ⚠️ Use sparingly - Text selectors
private readonly welcomeText = this.getByText('Welcome to Xima');

// ❌ Avoid when possible - CSS selectors
private readonly element = this.locator('.complex-css-selector > div:nth-child(2)');
```

## API Client Patterns

### Creating an API Client

```typescript
import { ApiResponse } from '../../shared/types/core';

export class YourApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('API_KEY environment variable required');
    }
  }

  async performOperation(data: OperationData): Promise<ApiResponse<ResultType>> {
    try {
      const response = await this.makeRequest('/endpoint', {
        method: 'POST',
        body: data,
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return {
        success: true,
        data: response,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: error.message
        },
        timestamp: new Date()
      };
    }
  }

  private async makeRequest(endpoint: string, options: RequestOptions): Promise<any> {
    // Implementation with error handling, retries, timeouts
  }
}

// Factory function
export function createYourApiClient(): YourApiClient {
  return new YourApiClient();
}
```

### Using API Clients in Page Objects

```typescript
export class YourPage extends BasePage {
  private readonly apiClient = createYourApiClient();

  async performBackgroundOperation(): Promise<void> {
    const result = await this.apiClient.performOperation(data);
    
    if (!result.success) {
      throw new Error(`API operation failed: ${result.error?.message}`);
    }
    
    // Use result data in UI interactions
    await this.handleApiResult(result.data);
  }
}
```

## TypeScript Patterns

### Interface Organization

```typescript
// Shared interfaces (in /shared/types/)
export interface User {
  id: string;
  name: string;
  type: UserType;
}

// Page-specific interfaces (inline)
export class ReportsPage extends BasePage {
  async generateReport(config: ReportConfig): Promise<ReportResult> {
    // Implementation
  }
}

// Local interfaces for this page only
interface ReportConfig {
  name: string;
  parameters: Record<string, any>;
}

interface ReportResult {
  id: string;
  downloadUrl: string;
}
```

### Error Handling

```typescript
export class CustomPageError extends Error {
  constructor(
    message: string,
    public readonly pageUrl: string,
    public readonly elementSelector?: string
  ) {
    super(message);
    this.name = 'CustomPageError';
  }
}

export class YourPage extends BasePage {
  async performAction(): Promise<void> {
    try {
      await this.clickElement(this.actionButton);
    } catch (error) {
      throw new CustomPageError(
        `Failed to perform action: ${error.message}`,
        this.getCurrentUrl(),
        'action-button'
      );
    }
  }
}
```

## Testing Patterns

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
  });

  test('should perform basic operation', async ({ page }) => {
    // Arrange
    const loginPage = await LoginPage.create(page);
    const dashboard = await loginPage.loginAsSupervisor();
    
    // Act
    const result = await dashboard.performOperation();
    
    // Assert
    expect(result).toBeDefined();
    await dashboard.verifyOperationSuccess();
  });

  test('should handle error scenario', async ({ page }) => {
    // Test error handling
  });
});
```

### Data-Driven Tests

```typescript
const testCases = [
  { userType: 'supervisor', expectedFeatures: ['reports', 'user-mgmt'] },
  { userType: 'agent', expectedFeatures: ['channels', 'active-media'] }
];

testCases.forEach(({ userType, expectedFeatures }) => {
  test(`${userType} should see correct features`, async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const dashboard = await loginPage.loginAs(userType);
    
    const availableFeatures = await dashboard.getAvailableFeatures();
    expect(availableFeatures).toEqual(expect.arrayContaining(expectedFeatures));
  });
});
```

## Migration Steps

### Step 1: Identify Test to Migrate
1. Choose a complete test file (not individual functions)
2. Map out the user journey and page transitions
3. Identify required page objects and API clients

### Step 2: Create Page Objects
1. Start with entry points (login pages)
2. Create dashboard/landing pages
3. Add feature-specific pages
4. Implement navigation methods

### Step 3: Create API Clients
1. Group related API operations
2. Add error handling and retries
3. Include request/response typing
4. Add factory functions

### Step 4: Migrate Tests
1. Update imports to use POM
2. Replace direct browser calls with page methods
3. Use navigation pattern for page transitions
4. Add proper error handling

### Step 5: Validation
1. Run migrated tests to ensure functionality
2. Check TypeScript compilation
3. Verify error handling scenarios
4. Performance comparison with original tests

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Direct browser manipulation in tests
await page.click('#login-button');
await page.fill('[data-cy="username"]', 'user');

// Direct page construction for internal pages
const reportsPage = new ReportsPage(page);

// Mixing page logic with API calls in tests
const response = await fetch('/api/users');
await page.click('.user-button');
```

### ✅ Do This Instead
```typescript
// Use page object methods
await loginPage.clickLoginButton();
await loginPage.fillUsername('user');

// Navigation-based page creation
const reportsPage = await dashboard.navigateToReports();

// Separate concerns - use API clients in page objects
const userPage = await dashboard.navigateToUsers();
await userPage.refreshUserList(); // This handles the API call internally
```

## Code Review Checklist

- [ ] Page objects extend BasePage
- [ ] Entry point pattern followed correctly
- [ ] Navigation methods return typed page instances
- [ ] Selectors use data-cy attributes when possible
- [ ] All async methods have proper error handling
- [ ] API clients include timeout and retry logic
- [ ] TypeScript interfaces are appropriately scoped
- [ ] Tests use page object methods, not direct browser calls
- [ ] Verification methods included for each page
- [ ] Factory functions provided for API clients

## Performance Considerations

### Lazy Loading
```typescript
export class DashboardPage extends BasePage {
  private _userList?: UserListComponent;
  
  get userList(): UserListComponent {
    if (!this._userList) {
      this._userList = new UserListComponent(this.page);
    }
    return this._userList;
  }
}
```

### Parallel Operations
```typescript
async loadDashboardData(): Promise<void> {
  // Run independent operations in parallel
  await Promise.all([
    this.loadUserCount(),
    this.loadActiveCallsCount(),
    this.loadRecentReports()
  ]);
}
```

## Debugging Tips

1. **Use descriptive error messages** with context
2. **Take screenshots** on failures using `this.takeScreenshot()`
3. **Log navigation steps** for complex flows
4. **Use waitFor methods** to handle timing issues
5. **Implement retry logic** for flaky operations

---

**Next**: Start implementing your first page objects using these patterns!

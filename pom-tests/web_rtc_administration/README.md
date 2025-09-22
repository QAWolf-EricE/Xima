# WebRTC Administration Tests

This directory contains automated tests for WebRTC administration functionality using the Page Object Model (POM) pattern. These tests have been migrated 1:1 from the original JavaScript tests in `tests/web_rtc_administration/` to TypeScript with improved structure and maintainability.

## Overview

The WebRTC administration tests verify administrative functions for managing WebRTC agents including agent creation, licensing, password management, and user lifecycle operations. These tests focus on supervisor-level operations for WebRTC agent management.

## Test Files

### Agent Management
- **`web-rtc-agent-creation.spec.ts`** - Complete WebRTC agent creation workflow with email verification (migrated from `web_rtc_agent_creation.spec.js`)
- **`web-rtc-reset-password-via-license-management.spec.ts`** - Password reset functionality through supervisor interface (migrated from `web_rtc_reset_password_via_license_management.spec.js`)

## Key Features Tested

### Agent Creation Workflow
- **Complete Lifecycle**: Agent creation from supervisor interface through email verification to first login
- **Email Verification**: Automated email inbox monitoring and welcome message verification
- **Password Setup**: Secure password generation and initial password setup workflow
- **License Assignment**: CCAAS_VOICE license assignment and verification
- **Login Verification**: Agent authentication with newly created credentials
- **Cleanup Process**: Automatic agent deletion and cleanup after testing

### Password Reset Management
- **Supervisor Initiated**: Password reset triggered from user management interface
- **Email Workflow**: Reset password email generation and content verification  
- **New Password Setup**: Complete password reset and confirmation process
- **Login Verification**: Authentication with new credentials after reset
- **Existing Agent Testing**: Works with pre-existing WebRTC agents in the system

### License Management
- **CCAAS_VOICE Licensing**: Voice license assignment and verification for WebRTC agents
- **License State Management**: Checking and modifying license assignments
- **Save Operations**: Multiple save operations to ensure license persistence

## Page Objects Used

### Core Administration Pages
- **`UserManagementPage`** - Agent creation, editing, deletion, and license management
- **`LoginPage`** - Authentication for supervisors and newly created agents

### External Dependencies
- **Email Integration**: Real email inbox monitoring for verification workflows
- **Password Generation**: Secure password generation with complexity requirements

## Test Environment

### Supervisor Credentials
```bash
SUPERVISOR_USERNAME=your_supervisor_username
SUPERVISOR_PASSWORD=your_supervisor_password
```

### Email Configuration
- Tests use real email inboxes for verification workflows
- Agent creation test generates new unique email addresses
- Password reset test uses specific test email: `xima+webrtcresetpass@qawolf.email`

### Test Data
- **Agent Names**: "Agent Creationer" for creation test, "WebRTC ResetPassword" for reset test  
- **Extensions**: "337" for new agent creation, "555" for existing reset password agent
- **Passwords**: Generated using faker library with complexity requirements (12+ chars, mixed case, numbers, symbols)

## Running Tests

### Individual Test Files
```bash
# Run agent creation test
npx playwright test pom-tests/web_rtc_administration/web-rtc-agent-creation.spec.ts

# Run password reset test  
npx playwright test pom-tests/web_rtc_administration/web-rtc-reset-password-via-license-management.spec.ts

# Run all WebRTC administration tests
npx playwright test pom-tests/web_rtc_administration/
```

### Test Configuration
```bash
# Run with slower execution for email timing
npx playwright test pom-tests/web_rtc_administration/ --headed --slowMo=1000

# Run sequentially for email dependency management
npx playwright test pom-tests/web_rtc_administration/ --workers=1
```

## Common Test Patterns

### Agent Creation with Email Verification
```typescript
// Setup email inbox
const { emailAddress: email, waitForMessage } = await getInbox({ new: true });

// Create agent through UI
await userMgmtPage.createAgent({
  name: agentName,
  email: email,
  extension: "337",
  assignVoiceLicense: true
});

// Wait for welcome email
const message = await waitForMessage({ after: creationTime, timeout: 240000 });

// Verify email content
expect(message.text.includes("Your account has been successfully created")).toBe(true);
```

### Password Reset Workflow
```typescript
// Initiate password reset from supervisor interface
await page.click('mat-row:has-text(" WebRTC ResetPassword(555) ") [data-mat-icon-name="more-v1"]');
await page.click('[mat-menu-item]:has-text("Edit")');
await page.click('[data-unit="reset-password"]');

// Handle reset email
const message = await waitForMessage({ after });
expect(message.text).toContain("A request has been made to reset your account's password");

// Navigate to reset URL and set new password
await passwordPage.goto(message.urls[0]);
await passwordPage.fill("#psw", newPassword);
await passwordPage.fill("#confirm-password", newPassword);
await passwordPage.click(".set-password-btn");
```

### License Assignment
```typescript
// Create agent with voice license
await userMgmtPage.createAgent({
  name: agentName,
  email: email,
  extension: extension,
  assignVoiceLicense: true
});

// Verify license was assigned
const licenseCheckbox = page.locator('[data-cy="user-license-management-license-selection-CCAAS_VOICE"] input');
await expect(licenseCheckbox).toBeChecked();
```

## Test Dependencies

### Email Service Integration
- Tests require access to a real email service for inbox monitoring
- Email addresses are generated dynamically for agent creation
- Password reset uses a specific test email address
- Email timeout is set to 4 minutes for message arrival

### Existing Test Data
- Password reset test depends on existing "WebRTC ResetPassword(555)" agent
- If agent doesn't exist, test includes fallback verification
- Agent creation test cleans up after itself

### Browser Context Management
- Tests use multiple browser contexts for email workflow
- Password pages open in separate contexts to simulate email link clicks
- Proper context cleanup after test completion

## Debugging

### Common Issues
1. **Email Timeout** - Verify email service connectivity and increase timeout if needed
2. **Agent Already Exists** - Agent creation includes automatic cleanup of existing agents
3. **License Assignment Delays** - Multiple save operations ensure license persistence
4. **Password Complexity** - Generated passwords meet all system requirements

### Debug Configuration
```typescript
// Enable additional logging for email workflows
console.log('Email address:', email);
console.log('Message URLs:', message.urls);

// Increase timeouts for email operations
const message = await waitForMessage({ after, timeout: 300000 }); // 5 minutes
```

### Email Debugging
```typescript
// Log email content for debugging
console.log('Email text:', message.text);
console.log('Email URLs:', message.urls);
console.log('Email received at:', new Date());
```

## Migration Notes

These tests have been migrated 1:1 from the original JavaScript implementation with the following improvements:

### Enhanced Reliability
- **Email Handling**: More robust email waiting and content verification
- **Error Recovery**: Better error handling for agent existence checking and cleanup
- **Context Management**: Improved browser context handling for multi-page workflows
- **Timeout Management**: Appropriate timeouts for email-dependent operations

### Improved Maintainability
- **Page Objects**: Reusable components for user management operations
- **Type Safety**: Full TypeScript implementation with proper error handling
- **Consistent Patterns**: Standardized agent creation and password management workflows
- **Better Logging**: Enhanced debugging output for troubleshooting

### Original Test Mapping
- `web_rtc_agent_creation.spec.js` → `web-rtc-agent-creation.spec.ts`
- `web_rtc_reset_password_via_license_management.spec.js` → `web-rtc-reset-password-via-license-management.spec.ts`

## Environment Setup

### Required Environment Variables
```bash
# Supervisor credentials for administrative access
SUPERVISOR_USERNAME=your_supervisor_username  
SUPERVISOR_PASSWORD=your_supervisor_password

# Application URL
DEFAULT_URL=https://your-contact-center.com
```

### Email Service Configuration
- Tests use QAWolf's email service for inbox management
- No additional email service configuration required
- Email addresses are generated automatically

### Test Data Prerequisites
- Supervisor account with user management permissions
- Access to agent licensing functionality
- For password reset: existing "WebRTC ResetPassword(555)" agent (optional)

## Contributing

When adding new WebRTC administration tests:

1. Use existing `UserManagementPage` page object for consistency
2. Follow established email verification patterns
3. Include proper agent cleanup procedures  
4. Test both positive and negative scenarios
5. Add appropriate error handling for email-dependent operations
6. Verify license assignment functionality
7. Test password complexity requirements

## Support

For issues with WebRTC administration testing:

1. Verify supervisor account permissions for user management
2. Check email service connectivity and timeout settings
3. Ensure proper license assignment capabilities
4. Test password complexity requirements
5. Verify agent existence for password reset scenarios
6. Check browser context handling for multi-page workflows

The tests maintain full compatibility with existing infrastructure while providing improved reliability, debugging, and maintainability through the POM pattern implementation.

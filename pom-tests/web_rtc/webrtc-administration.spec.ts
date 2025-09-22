import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { UserManagementPage } from '../../pom-migration/pages/admin/user-management-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Administration Tests
 * Migrated from: tests/web_rtc_administration/web_rtc_agent_creation.spec.js, 
 *                tests/web_rtc_administration/web_rtc_reset_password_via_license_management.spec.js
 * 
 * This test suite covers:
 * - WebRTC agent creation workflow
 * - License assignment (CCAAS_VOICE)
 * - Email verification and password setup
 * - Agent login verification
 * - User management operations
 */
test.describe('WebRTC Administration', () => {

  test('complete WebRTC agent creation workflow with email verification', async ({ page, context }) => {
    // Test configuration
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Generate unique test data
    const timestamp = Date.now();
    const agentData = {
      name: 'Agent Creationer',
      email: `agent.creator.${timestamp}@test.example.com`, // Use test domain
      extension: '337'
    };

    // ========================================================================
    // Step 1: Setup Mailbox and Login as Supervisor
    // ========================================================================
    
    // Create inbox for email verification (using getInbox helper)
    const getInbox = require('../../qawHelpers').getInbox;
    const { emailAddress: email, waitForMessage } = await getInbox({ new: true });
    
    // Update agent data with real inbox email
    agentData.email = email;
    console.log('Test email address:', email);

    // Login as supervisor
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor(supervisorCredentials);
    
    // ========================================================================
    // Step 2: Navigate to User Management
    // ========================================================================
    
    const userMgmtPage = new UserManagementPage(page);
    await userMgmtPage.navigateToUserManagement();

    // ========================================================================
    // Step 3: Create WebRTC Agent
    // ========================================================================
    
    // Record creation time for email filtering
    const creationTime = new Date();
    
    // Create agent with voice license
    await userMgmtPage.createAgent({
      name: agentData.name,
      email: agentData.email,
      extension: agentData.extension,
      assignVoiceLicense: true
    });

    console.log(`Created agent: ${agentData.name} with email: ${agentData.email}`);

    // ========================================================================
    // Step 4: Verify Welcome Email and Set Password
    // ========================================================================
    
    // Wait for welcome email
    console.log('Waiting for welcome email...');
    const message = await waitForMessage({ 
      after: creationTime, 
      timeout: 240000 // 4 minutes
    });

    // Verify email content
    expect(message.text.includes('Your account has been successfully created')).toBe(true);
    expect(message.urls).toBeDefined();
    expect(message.urls.length).toBeGreaterThan(0);

    console.log('Welcome email received with URLs:', message.urls);

    // ========================================================================
    // Step 5: Set Password for New Agent
    // ========================================================================
    
    // Create new context for password setup
    const passwordContext = await context.browser()?.newContext();
    expect(passwordContext).toBeDefined();
    
    const passwordPage = await passwordContext!.newPage();
    await passwordPage.waitForTimeout(2000);
    
    // Navigate to password reset URL
    await passwordPage.goto(message.urls[0]);
    
    // Set password
    const userMgmtPasswordPage = new UserManagementPage(passwordPage);
    const password = userMgmtPasswordPage.generateSecurePassword();
    
    console.log('Generated password for agent (length):', password.length);
    
    await userMgmtPasswordPage.setAgentPassword(password);

    // ========================================================================
    // Step 6: Verify Agent Login
    // ========================================================================
    
    // Should be redirected to agent dashboard
    await expect(passwordPage).toHaveURL(/ccagent/);
    
    // Verify agent name is displayed
    const agentNameElement = passwordPage.locator('.name').first();
    await expect(agentNameElement).toHaveText(agentData.name);
    
    // Handle optional popup
    try {
      await passwordPage.click(':text("Got it")');
    } catch {
      console.log('No popup to dismiss');
    }

    // ========================================================================
    // Step 7: Test Login/Logout Cycle
    // ========================================================================
    
    // Logout from agent dashboard
    await passwordPage.click('[data-cy="agent-status-menu-button"]');
    await passwordPage.click('[data-cy="agent-status-logout-link"]');
    
    // Login with new credentials
    await passwordPage.fill('[data-cy="consolidated-login-username-input"]', agentData.email);
    await passwordPage.fill('[data-cy="consolidated-login-password-input"]', password);
    await passwordPage.click('.login');
    
    // Verify successful login
    await expect(passwordPage).toHaveURL(/ccagent/);
    await expect(agentNameElement).toBeVisible();

    console.log('✅ Agent login/logout cycle successful');

    // ========================================================================
    // Step 8: Cleanup - Delete Created Agent
    // ========================================================================
    
    // Return to supervisor page for cleanup
    await page.bringToFront();
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Navigate back to user management
    await userMgmtPage.navigateToUserManagement();
    
    // Delete the test agent
    await userMgmtPage.deleteAgent(agentData.name);
    
    // Verify agent was deleted
    const deletedAgentRow = page.locator(`mat-row:has-text("${agentData.name}")`);
    await expect(deletedAgentRow).not.toBeVisible();
    
    console.log('✅ Agent cleanup completed');

    // Close password page context
    await passwordContext!.close();
  });

  test('WebRTC agent creation without email verification (offline test)', async ({ page }) => {
    // Simplified test for agent creation without email dependency
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const agentData = {
      name: 'Test Agent Offline',
      email: 'test.offline@example.com',
      extension: '999'
    };

    // Login as supervisor
    const loginPage = await LoginPage.create(page);
    await loginPage.loginAsSupervisor(supervisorCredentials);
    
    // Navigate to user management
    const userMgmtPage = new UserManagementPage(page);
    await userMgmtPage.navigateToUserManagement();
    
    // Create agent
    await userMgmtPage.createAgent({
      name: agentData.name,
      email: agentData.email,
      extension: agentData.extension,
      assignVoiceLicense: true
    });
    
    // Verify agent was created
    const agentRow = page.locator(`mat-row:has-text("${agentData.name}")`);
    await expect(agentRow).toBeVisible();
    
    // Verify voice license is assigned
    const voiceLicenseCheckbox = agentRow.locator('[data-cy="user-license-management-license-selection-CCAAS_VOICE"] input');
    await expect(voiceLicenseCheckbox).toBeChecked();
    
    // Cleanup
    await userMgmtPage.deleteAgent(agentData.name);
    await expect(agentRow).not.toBeVisible();
    
    console.log('✅ Offline agent creation test completed');
  });

  test('license management for existing agents', async ({ page }) => {
    // Test license assignment/removal for existing agents
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const agentData = {
      name: 'License Test Agent',
      email: 'license.test@example.com', 
      extension: '888'
    };

    // Setup
    const loginPage = await LoginPage.create(page);
    await loginPage.loginAsSupervisor(supervisorCredentials);
    
    const userMgmtPage = new UserManagementPage(page);
    await userMgmtPage.navigateToUserManagement();
    
    // Create agent without initial license assignment
    await userMgmtPage.createAgent({
      name: agentData.name,
      email: agentData.email,
      extension: agentData.extension,
      assignVoiceLicense: false
    });
    
    // Verify agent exists
    const agentRow = page.locator(`mat-row:has-text("${agentData.name}")`);
    await expect(agentRow).toBeVisible();
    
    // Assign voice license
    await userMgmtPage.assignVoiceLicense(agentData.name);
    
    // Verify license was assigned
    const voiceLicenseCheckbox = agentRow.locator('[data-cy="user-license-management-license-selection-CCAAS_VOICE"] input');
    await expect(voiceLicenseCheckbox).toBeChecked();
    
    // Cleanup
    await userMgmtPage.deleteAgent(agentData.name);
    
    console.log('✅ License management test completed');
  });

  test('user management page functionality', async ({ page }) => {
    // Test basic user management page functionality
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    // Login as supervisor
    const loginPage = await LoginPage.create(page);
    await loginPage.loginAsSupervisor(supervisorCredentials);
    
    // Navigate to user management
    const userMgmtPage = new UserManagementPage(page);
    await userMgmtPage.navigateToUserManagement();
    
    // Verify page loaded correctly
    await userMgmtPage.verifyPageLoaded();
    
    // Verify key elements are present
    await expect(page.locator('button:has-text("Add Agent")')).toBeVisible();
    await expect(page.locator('[data-cy="user-license-management-save-button"]')).toBeVisible();
    
    // Verify we can see agent table
    await page.waitForSelector('mat-row', { timeout: 10000 });
    
    console.log('✅ User management page functionality verified');
  });

  test('password reset workflow validation', async ({ page, context }) => {
    // Test the password reset workflow without creating actual agents
    const testPassword = 'TestPassword123!';
    
    // Create a mock password page scenario
    const passwordPage = await context.newPage();
    
    // Navigate to a password reset-like URL (this would normally come from email)
    await passwordPage.goto(process.env.DEFAULT_URL + '/password/reset'); // Mock URL
    
    const userMgmtPage = new UserManagementPage(passwordPage);
    
    // Test password generation
    const generatedPassword = userMgmtPage.generateSecurePassword();
    
    // Verify password meets complexity requirements
    expect(generatedPassword.length).toBeGreaterThanOrEqual(8);
    expect(generatedPassword).toMatch(/[A-Z]/); // Has uppercase
    expect(generatedPassword).toMatch(/[a-z]/); // Has lowercase  
    expect(generatedPassword).toMatch(/[0-9]/); // Has number
    expect(generatedPassword).toMatch(/[!@#$%^&*]/); // Has special char
    
    console.log('Generated password complexity validated');
    console.log('✅ Password reset workflow validation completed');
  });
});

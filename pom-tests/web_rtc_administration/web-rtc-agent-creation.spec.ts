import { test, expect } from '@playwright/test';
import { UserManagementPage } from '../../pom-migration/pages/admin/user-management-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Agent Creation Test
 * Migrated from: tests/web_rtc_administration/web_rtc_agent_creation.spec.js
 * 
 * This test covers:
 * - Complete WebRTC agent creation workflow
 * - Email verification and welcome message
 * - Password setup for new agent
 * - Agent login verification
 * - CCAAS_VOICE license assignment
 * - Agent cleanup and deletion
 */
test.describe('WebRTC Agent Creation', () => {

  test('web_rtc_agent_creation', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Create WebRTC Agent (agent creation)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Create a new mailbox and destructure the new email address and its associated message listener function
    const getInbox = require('../../qawHelpers').getInbox;
    const { emailAddress: email, waitForMessage } = await getInbox({ new: true });
    
    // Login as a supervisor
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor(supervisorCredentials);
    
    // Navigate to User Management
    const userMgmtPage = new UserManagementPage(page);
    await userMgmtPage.navigateToUserManagement();
    
    // Assign "Agent Creationer" to agentName for the new agent
    const agentName = "Agent Creationer";
    
    // Delete the user "Agent Creationer" if it already exists in the system
    await userMgmtPage.deleteAgentIfExists(agentName);
    
    // Pause the process for 3 seconds
    await page.waitForTimeout(3000);
    
    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Create a new "Agent Creationer" with email and extension, assign licenses, and verify the creation
    
    // Record timestamp for email filtering
    const after = new Date();
    
    // Create agent using POM
    await userMgmtPage.createAgent({
      name: agentName,
      email: email,
      extension: "337",
      assignVoiceLicense: true
    });
    
    // ================================================================================================
    // Assert:
    // ================================================================================================
    console.log(email);
    // Assert a welcome email is sent to the newly created user and assert link to set password
    
    // Wait for a new message since {after} and assign the message to {message}
    const message = await waitForMessage({ after, timeout: 1000 * 60 * 4 });
    
    // Check if the welcome message includes "Your account has been successfully created"
    expect(message.text.includes("Your account has been successfully created")).toBe(true);
    
    // Create a new page and assign it to {passwordPage}
    const passwordContext = await page.context().browser()?.newContext();
    expect(passwordContext).toBeDefined();
    const passwordPage = await passwordContext!.newPage();
    
    // Pause the process for 2 seconds before continuing
    await passwordPage.waitForTimeout(2000);
    
    // Navigate to the first URL found in the welcome message
    await passwordPage.goto(message.urls[0]);
    console.log(message.urls);
    
    // Check if the currently viewed page is for password reset
    await expect(passwordPage).toHaveURL(/password/);
    
    // Generate a complex password with the help of faker library and assign it to {password}
    const faker = require('faker');
    const password = faker.internet.password(12, false, null, "!1Aa");
    
    // Fill the password input field with the generated {password}
    await passwordPage.fill("#psw", password);
    
    // Fill the password confirmation input field with the same {password}
    await passwordPage.fill("#confirm-password", password);
    
    // Pause the process for 5 seconds before continuing
    await page.waitForTimeout(5000);
    
    // Click the "Set Password" button
    await passwordPage.click(".set-password-btn");
    
    // Click "Back to main page"
    await passwordPage.click('button:has-text("Back to main page")');
    
    // Ensure the user is redirected to the CC agent dashboard after password set
    await expect(passwordPage).toHaveURL(/ccagent/);
    
    // Verify if "Agent Creationer" is visible on the first locator with the class "name"
    await expect(passwordPage.locator(".name").first()).toHaveText(agentName);
    
    // Close any optional pop-up modal
    try {
      await passwordPage.click(':text("Got it")');
    } catch (err) {
      console.log(err);
    }
    
    // Click the agent status button
    await passwordPage.click('[data-cy="agent-status-menu-button"]');
    
    // Click the log out button located in the agent status dropdown
    await passwordPage.click('[data-cy="agent-status-logout-link"]');
    
    // Fill the username input field with {email}
    await passwordPage.fill('[data-cy="consolidated-login-username-input"]', email);
    
    // Fill the password input field with {password}
    await passwordPage.fill('[data-cy="consolidated-login-password-input"]', password);
    
    // Click the "Log In" button
    await passwordPage.click(".login");
    
    // Verify successful login
    await expect(passwordPage).toHaveURL(/ccagent/);
    
    // ================================================================================================
    // Clean up
    // ================================================================================================
    
    // Delete newly created user, "Agent Creationer", and log back in as supervisor
    
    // Bring the login page to the front
    await page.bringToFront();
    
    // Reload the page
    await page.reload();
    
    // Pause the process for 2 seconds
    await page.waitForTimeout(2000);
    
    // Navigate back to user management and delete the agent
    await userMgmtPage.deleteAgent(agentName);
    
    // Verify if the user "Agent Creationer" was successfully deleted
    await expect(page.locator(`mat-row:has-text("${agentName}")`)).not.toBeVisible();
    
    // Close password context
    await passwordContext!.close();
    
    console.log('✅ WebRTC agent creation workflow completed successfully');

    // ================================================================================================
    // Step 2. Set Password (agent creation)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Log in as newly created WebRTC Agent (agent creation)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Delete WebRTC Agent (agent creation)
    // ================================================================================================
    // Note: This step is completed above in the cleanup section
  });
});

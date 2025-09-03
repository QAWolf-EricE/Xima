import { buildUrl, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("test_manager_ui_vs_admin_ui", async () => {
 // Step 1. Confirm Supervisor has access to User Mgmt and TM doesn't
  // REQ login as Supervisor
  const { page: supervisorPage, browser } = await logInSupervisor();
  
  // REQ login as Test Manager
  const context = await browser.newContext();
  const managerPage = await context.newPage();
  await managerPage.goto(buildUrl("/"));
  
  // fill out supervisor log in details
  await managerPage.fill(
    '[data-cy="consolidated-login-username-input"]',
    "ximatest+120@ximasoftware.com"
  );
  await managerPage.fill(
    '[data-cy="consolidated-login-password-input"]',
    "Password123!"
  );
  console.log()
  await managerPage.click('[data-cy="consolidated-login-login-button"]');
  
  // assert logged in
  await expect(managerPage.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
    { timeout: 30000 }
  );
  
  // NOTE: each REQ we are checking that the supervisor page has access
  // As well as the Test manager not having access
  await supervisorPage.bringToFront();
  await supervisorPage.locator(`[data-cy="sidenav-menu-USER_MANAGEMENT"]`).click();
  await expect(
    supervisorPage.locator('[data-cy="sidenav-menu-USER_MANAGEMENT"]')
  ).toBeVisible();
  
  // REQ Assert Test Manager does not have access to Contact Center
  await managerPage.bringToFront();
  await expect(
    managerPage.locator('[data-cy="sidenav-menu-CONTACT_CENTER"]')
  ).not.toBeVisible();
  
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-cy="sidenav-menu-CONTACT_CENTER"]')
  ).toBeVisible();
  
  // REQ Assert Test Manager does not have access to Routing Config
  await managerPage.bringToFront();
  await expect(
    managerPage.locator('[data-cy="sidenav-menu-ROUTING_CONFIGURATION"]')
  ).not.toBeVisible();
  
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-cy="sidenav-menu-ROUTING_CONFIGURATION"]')
  ).toBeVisible();
  
  // REQ Assert Test Manager does not have access to Admin Systems
  await managerPage.bringToFront();
  await expect(
    managerPage.locator('[data-cy="sidenav-menu-ADMIN_SYSTEM"]')
  ).not.toBeVisible();
  
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-cy="sidenav-menu-ADMIN_SYSTEM"]')
  ).toBeVisible();
 // Step 2. Confirm Supervisor has access to Contact Center and TM doesn't
  // Arrange:
  
  // Act:
  
  // Assert:
  // Contact Center tab is not visible
  
  
 // Step 3. Confirm Supervisor has access to Routing Config and TM doesn't
  // Arrange:
  
  // Act:
  
  // Assert:
  // Routing Config tab is not visible
  
  
 // Step 4. Confirm Supervisor has access to Admin Systems and TM doesn't
  // Arrange:
  
  // Act:
  
  // Assert:
  // Admin Systems tab is not visible
  
  
});
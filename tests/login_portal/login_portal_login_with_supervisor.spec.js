import { logInPortal, reportCleanupFailed } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("login_portal_login_with_supervisor", async () => {
 // Step 1. Login Portal - Login with Supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Constants
  const account = "supervisor";
  const supervisorName = "Keith Sup and Agent";
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Log in
  const { page } = await logInPortal({ account });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert the "Reports" tab is visible
  await expect(
    page.locator(`mat-toolbar-row`).getByText(`Reports`),
  ).toBeVisible();
  
  // Assert the "Reports" tab is selected by default (has class of "active")
  await expect(
    page.locator(`mat-toolbar-row`).getByText(`Reports`),
  ).toHaveAttribute("class", /active/);
  
  // Assert the "Cradle to Grave" tab is visible
  await expect(
    page.locator(`mat-toolbar-row`).getByText(`Cradle to Grave`),
  ).toBeVisible();
  
  // Assert the "REPORTS" sidebar icon is visible
  await expect(page.locator(`[data-cy="sidenav-menu-REPORTS"]`)).toBeVisible();
  
  // Assert the "REALTIME_DISPLAYS" sidebar icon is visible
  await expect(
    page.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`),
  ).toBeVisible();
  
  // Assert the "LAUNCHER" sidebar icon is visible
  await expect(page.locator(`[data-cy="sidenav-menu-LAUNCHER"]`)).toBeVisible();
  
  // Assert the "AI_CONFIGURATION" sidebar icon is visible
  await expect(
    page.locator(`[data-cy="sidenav-menu-AI_CONFIGURATION"]`),
  ).toBeVisible();
  
  // Hover over user profile icon
  await page.locator(`xima-user-menu`).hover();
  
  // Assert the supervisor's name is visible
  await expect(page.getByRole("menu").getByText(supervisorName)).toBeVisible();
  
  // Assert the supervisor's email is visible
  await expect(
    page.getByRole("menu").getByText(process.env.PORTAL_SUPERVISOR_EMAIL),
  ).toBeVisible();
  
  // Assert the "Logout" button is visible
  await expect(
    page.getByRole("menu").getByRole(`button`, { name: `Logout` }),
  ).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  try {
    // Log out
    await page.getByRole(`button`, { name: `Logout` }).click();
  
    // Soft assert the company logo loads on the page
    await expect(
      page
        .getByRole(`img`, { name: `company-logo` })
        .or(page.getByRole(`img`, { name: `ccaas logo` })),
    ).toBeVisible();
  } catch (e) {
    await reportCleanupFailed({
      dedupKey: "couldNotLogOutAsSup",
      errorMsg: e.message,
    });
  }
  
});
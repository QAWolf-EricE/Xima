import { logInPortal, reportCleanupFailed } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("login_portal_login_with_agent", async () => {
 // Step 1. Login Portal - Login with Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const account = "agent";
  const agentName = "Keith Agent";
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Log in
  const { page } = await logInPortal({ account });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert the name container to display the agent's name
  await expect(page.locator(`.avatar-name-container`)).toHaveText(agentName);
  
  // Assert the "Channel States" section is visible
  await expect(page.getByText(`Channel States`)).toBeVisible();
  
  // Assert the "Active Media" section is visible
  await expect(page.getByText(`Active Media`)).toBeVisible();
  
  // Click on the kebab menu button
  await page.locator(`[data-cy="agent-status-menu-button"]`).click();
  
  // Assert the "Logout" menu item is visible
  await expect(page.getByRole(`menuitem`, { name: `Logout` })).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  
  try {
    // Log out
    await page.getByRole(`menuitem`, { name: `Logout` }).click();
  
    // Soft assert the company logo loads on the page
    await expect(
      page
        .getByRole(`img`, { name: `company-logo` })
        .or(page.getByRole(`img`, { name: `ccaas logo` })),
    ).toBeVisible();
  } catch (e) {
    await reportCleanupFailed({
      dedupKey: "couldNotLogOutAsAgent",
      errorMsg: e.message,
    });
  }
  
});
import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("launch_client_from_supervisor_dashboard", async () => {
 // Step 1. Launch client from Supervisor dashboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login
  const { page } = await logInSupervisor({
    username: "ximatest+120@ximasoftware.com",
    password: "Password123!",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click Launch Client (pop out menu button in left sidebar)
  await page.locator(`[data-cy="sidenav-menu-LAUNCHER"]`).hover();
  
  //* See notes
  await page.getByRole(`button`, { name: `Desktop Client` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the "Desktop Client Not Detected" modal is not visible
  try {
    await expect(
      page.locator(`xima-dialog-body:has-text("Desktop Client Not Detected")`),
    ).toBeVisible({timeout: 5000});
    throw new Error(
      "Workflow failed. Please manually revalidate and report as bug if necessary",
    );
  } catch {
    await expect(
      page.locator(`xima-dialog-body:has-text("Desktop Client Not Detected")`),
    ).not.toBeVisible();
  }
  
});
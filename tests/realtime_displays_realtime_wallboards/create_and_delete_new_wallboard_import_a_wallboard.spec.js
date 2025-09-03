import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_and_delete_new_wallboard_import_a_wallboard", async () => {
 // Step 1. Import a wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const wallboardName = "Imported - CC Agent";
  const file = "/home/wolf/team-storage/CC-Agent-exported-wallboard.json"; // or `fr.txt` or `zh.txt`
  
  // Login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to realtime wallboards
  await expect(
    page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]'),
  ).toBeEnabled();
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  await page.getByRole(`button`, { name: `Realtime Wallboards` }).click();
  
  // Soft assert on realtime wallboards page
  await expect(page.getByRole(`button`, { name: `New Wallboard` })).toBeVisible();
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first(),
  ).toBeVisible();
  
  // Cleanup wallboards
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // click "New Wallboard" button
  await page.getByRole(`button`, { name: `New Wallboard` }).click();
  
  // Select file to upload
  page.once("filechooser", (chooser) => {
    chooser.setFiles(file).catch(console.error);
  });
  
  // Import wallboard
  await page.getByRole(`button`, { name: `Import a Wallboard` }).click();
  
  // Click Continue
  await page.getByRole(`button`, { name: `Continue` }).click();
  
  // Click Kebab menu in wallboard header
  await page.locator('.wallboard-header [aria-haspopup="menu"]').click();
  
  // Click Go to Preview
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert wallboard is visible
  await expect(page.locator("#wallboardContent")).toBeVisible();
  await expect(page.getByRole(`button`, { name: `Full Screen` })).toBeVisible();
  
  // Assert wallboard heading has the correct title
  await expect(page.locator(`.wallboard-header h3`)).toHaveText(wallboardName);
  
 // Step 2. Delete Imported wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Click back button
  await page.locator('[data-cy="realtime-wallboard-preview-back-btn"]').click();
  await expect(
    page.locator(`[data-cy="realtime-wallboards-item-title"]`),
  ).toHaveText(wallboardName);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click kebab menu
  await page
    .locator(
      '[data-cy="realtime-wallboards-item"]:has-text("Imported - CC Agent") [data-cy="realtime-wallboards-item-menu-button"]',
    )
    .click();
  
  // Click Delete
  await page.locator('[data-cy="realtime-wallboards-item-delete"]').click();
  
  // Click Ok
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert imported wallboard is deleted
  await expect(
    page.locator(
      '[data-cy="realtime-wallboards-item"]:has-text("Imported - CC Agent")',
    ),
  ).not.toBeVisible();
  
});
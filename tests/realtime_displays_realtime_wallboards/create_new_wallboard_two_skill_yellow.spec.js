import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_two_skill_yellow", async () => {
 // Step 1. Create Two Skill Yellow wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const wallboardName = "Create Two Skill Yellow Wallboard";
  
  // Log in as a supervisor and retrieve the page object
  const { page } = await logInSupervisor({ slowMo: 500 });
  
  // Assert that the "Reports" text is visible on the page
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Hover over the "REALTIME_DISPLAYS" menu item
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  
  // Click on the "Realtime Wallboards" text to navigate to that page
  await page.getByRole(`button`, { name: `Realtime Wallboards` }).click();
  
  // Assert that the "New Wallboard" button is visible
  await expect(page.getByRole(`button`, { name: `New Wallboard` })).toBeVisible();
  
  // Assert that the first card element is visible
  await expect(
    page.locator(`[data-cy="realtime-wallboards-item"]`).first(),
  ).toBeVisible({ timeout: 60 * 1000 });
  
  // Cleanup wallboards
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Create a new two-skill yellow wallboard and configure the template.
  // Click on the "New Wallboard" button to initiate the creation process
  await page.getByRole(`button`, { name: `New Wallboard` }).click({ delay: 150 });
  
  // Select the "Two Skills Yellow" Wallboard Template
  await page
    .locator(`.card:has-text("Two Skills Yellow")`)
    .scrollIntoViewIfNeeded();
  await page.locator(`.card:has-text("Two Skills Yellow")`).click();
  
  // Retrieve the configuration modal object by the text "Template Configuration"
  const configModal = page.locator(
    `.xima-dialog-header:text("Template Configuration")`,
  );
  
  // Wait until the configuration modal is loaded
  await configModal.waitFor();
  
  // Fill in the title of the wallboard with {wallboardName}
  await page.locator('[formcontrolname="title"]').fill(wallboardName);
  
  // Click on the first "edit" icon
  await page.locator('[data-mat-icon-name="edit"] >> nth=0').click();
  
  // Select the "All" checkbox
  await page.getByLabel(`All`).check();
  
  // Click "Apply" to confirm
  await page.getByRole(`button`, { name: `Apply` }).click({ delay: 150 });
  
  // Click on the second "edit" icon
  await page.locator('[data-mat-icon-name="edit"] >> nth=1').click();
  
  // Select the "All" checkbox
  await page.getByLabel(`All`).check();
  
  // Click "Apply" to confirm
  await page.getByRole(`button`, { name: `Apply` }).click({ delay: 150 });
  
  // Click on the third "edit" icon
  await page.locator('[data-mat-icon-name="edit"] >> nth=2').click();
  
  // Select the "All" checkbox
  await page.getByLabel(`All`).check();
  
  // Click "Apply" to confirm
  await page.getByRole(`button`, { name: `Apply` }).click({ delay: 150 });
  
  // Soft assert all fields have groups selected
  await expect(
    page.locator(`[data-cy="criteria-parameter-preview"]:text-is("0 Selected")`),
  ).toHaveCount(0, {timeout: 20000})
  
  // Click on the "Continue" button to proceed
  await page.getByRole(`button`, { name: `Continue` }).click({ delay: 150 });
  
  // Preview the created wallboard, validate its content, save the wallboard, and then delete it
  // Click kebab menu in header
  await page.locator(`mat-toolbar .mat-mdc-menu-trigger`).click();
  
  // Click "Go to preview" to view the wallboard
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that "Skill 1" text is visible in the preview
  await expect(
    page.locator('.text-line-section-text:has-text("Skill 1")'),
  ).toBeVisible();
  
  // Assert that "Skill 2" text is visible in the preview
  await expect(
    page.locator('.text-line-section-text:has-text("Skill 2")'),
  ).toBeVisible();
  
  // Assert that "Total Calls in Queue:" text is visible in the preview
  await expect(
    page.locator('.text-line-section-text:has-text("Total Calls in Queue:")'),
  ).toBeVisible();
  
  // Assert that "SHINE" text is visible in the preview
  await expect(
    page.locator('.text-line-section-text:has-text("SHINE")'),
  ).toBeVisible();
  
  // Click on the visible image to open the menu
  await page.waitForTimeout(100);
  await page.locator(`.wallboard-header .mat-mdc-menu-trigger`).click();
  
  // Click "Edit Wallboard" to edit the wallboard
  await page
    .getByRole(`menuitem`, { name: `Edit Wallboard` })
    .click({ delay: 150 });
  
  // Click "Save and Exit" to save the wallboard
  await page.getByRole(`button`, { name: `Save and Exit` }).waitFor();
  await page.getByRole(`button`, { name: `Save and Exit` }).click();
  
  // Input the {wallboardName} into the "Type to Search" field
  await page.locator('[placeholder="Type to Search"]').fill(wallboardName);
  
  // Press "Enter" to submit the search query
  await page.keyboard.press("Enter");
  
  // Assert wallboard is visible
  await expect(
    page.locator(`.wallboard-card:has-text("${wallboardName}")`),
  ).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  // Cleanup wallboards
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
});
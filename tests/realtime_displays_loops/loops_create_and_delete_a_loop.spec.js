import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("loops_create_and_delete_a_loop", async () => {
 // Step 1. View Loops (create a loop)
  
 // Step 2. Create a loop
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const prefix = "QA Loop";
  const newLoopName = `${prefix} ${Date.now().toString().slice(-4)}`;
  
  // Log in as a supervisor to the page
  const { page } = await logInSupervisor({ slowMo: 1500 });
  
  // Soft assert that the page title is "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Click on the "REALTIME_DISPLAYS" side menu option
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').click();
  
  // Click the "Loops" tab
  await page.getByRole(`tab`, { name: `Loops` }).click();
  
  // Soft assert the "Create a Loop" button is visible
  await expect(page.getByRole(`button`, { name: `Create a Loop` })).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  
  // Remove any previously created loops
  await expect(async () => {
    try {
      // Assert there are no loops with a name matching {prefix}
      await expect(
        page.getByRole(`cell`, { name: prefix }).first(),
      ).not.toBeVisible({ timeout: 5 * 1000 });
    } catch (e) {
      // If there are matching loops, delete them
  
      // Click the first loop's kebab icon
      await page
        .locator(`[role="row"]:has-text("${prefix}") .loop-list-more-icon`)
        .first()
        .click();
  
      // Click the "Delete" menuitem
      await page.getByRole(`menuitem`, { name: `Delete` }).click();
  
      // Assert there are no loops with a name matching {prefix}
      await expect(
        page.getByRole(`cell`, { name: prefix }).first(),
      ).not.toBeVisible({ timeout: 5 * 1000 });
    }
  }).toPass({ timeout: 60 * 1000 }); // Run for 1 minute at maximum
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  /** Create a new loop with multiple wallboards */
  
  // Click the "Create a Loop" button
  await page.getByRole(`button`, { name: `Create a Loop` }).click();
  
  // Soft assert the "Create Loop" modal opens
  await expect(page.locator(`xima-dialog:has-text("Create Loop")`)).toBeVisible({
    timeout: 60 * 1000,
  });
  
  try {
    // Click "Add New Wallboard to Loop"
    await page.getByText(`Add New Wallboard to Loop`).click();
  
    // Click on the "Wallboards" select field
    await page
      .locator(`[formcontrolname="wallboardId"]`)
      .click({ timeout: 10 * 1000 });
  } catch {
    // Close the modal
    await page.locator(`[data-unit="close"]`).click();
  
    // Try again
  
    // Click the "Create a Loop" button
    await page.getByRole(`button`, { name: `Create a Loop` }).click();
  
    // Click "Add New Wallboard to Loop"
    await page.getByText(`Add New Wallboard to Loop`).click();
  
    // Click on the "Wallboards" select field
    await page
      .locator(`[formcontrolname="wallboardId"]`)
      .click({ timeout: 10 * 1000 });
  }
  
  // Choose any "CC Agent" option from the dropdown
  await page.getByRole(`option`, { name: `CC Agent` }).first().click();
  
  // Click on the duration field
  await page.locator(`[formcontrolname="durationSeconds"]`).click();
  
  // Click the "30 seconds" option from the dropdown
  await page.getByRole(`option`, { name: `30 seconds` }).click();
  
  // Click into the "Loop Name"
  await page.locator(`[formcontrolname="name"]`).click();
  
  // Type the unique loop name into the field with a delay of 300ms between keystrokes
  await page.keyboard.type(newLoopName, { delay: 300 });
  
  // Click "Add New Wallboard to Loop"
  await page.getByText(`Add New Wallboard to Loop`).click();
  
  // Click on the newest (last) "Wallboards" select field
  await page.locator(`[formcontrolname="wallboardId"]`).last().click();
  
  // Choose any "Two Skills" option from the dropdown
  await page.getByRole(`option`, { name: `Two Skills` }).first().click();
  
  // Click on the newest (last) duration field
  await page.locator(`[formcontrolname="durationSeconds"]`).last().click();
  
  // Set the display duration to the first available time
  await page.locator(`[role="listbox"] mat-option`).first().click();
  
  // Click "Add New Wallboard to Loop"
  await page.getByText(`Add New Wallboard to Loop`).click();
  
  // Click on the newest (last) "Wallboards" select field
  await page.locator(`[formcontrolname="wallboardId"]`).last().click();
  
  // Choose any "SLA" option from the dropdown
  await page.getByRole(`option`, { name: `SLA` }).first().click();
  
  // Click on the newest (last) duration field
  await page.locator(`[formcontrolname="durationSeconds"]`).last().click();
  
  // Set the display duration to the last available time
  await page.locator(`[role="listbox"] mat-option`).last().click();
  
  // Soft assert the selected "CC Agent" wallboard is visible
  await expect(page.getByText(`CC Agent`)).toBeVisible();
  
  // Soft assert the selected "Two Skills" wallboard is visible
  await expect(page.getByText(`Two Skills`)).toBeVisible();
  
  // Soft assert the selected "SLA" wallboard is visible
  await expect(page.getByText(`SLA`)).toBeVisible();
  
  // Click the "Apply" button
  await page.getByRole(`button`, { name: `Apply` }).click();
  
  // Click on the newly created loop's kebab icon
  await page
    .locator(`[role="row"]:has-text("${newLoopName}") .loop-list-more-icon`)
    .first()
    .click();
  
  // Click the "Open" menuitem
  await page.getByRole(`menuitem`, { name: `Open` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Check "Calls in Queue: Skill 1" is visible
  await expect(page.getByText("Calls in Queue: Skill 1")).toBeVisible({
    timeout: 60 * 1000,
  });
  
  // Check "Total ACW Today" is visible
  await expect(page.getByText("Total ACW Today")).toBeVisible({
    timeout: 60 * 1000,
  });
  
  // Check "Active Calls 1" is hidden
  await expect(page.getByText("Active Calls 1")).toBeHidden({
    timeout: 60 * 1000,
  });
  
  // Check "Test 2" is hidden
  await expect(page.getByText("Test 2")).toBeHidden({ timeout: 60 * 1000 });
  
  // Check "Calls in Queue: Skill 1" is now hidden after its duration has expired
  await expect(page.getByText("Calls in Queue: Skill 1")).toBeHidden({
    timeout: 60 * 1000,
  });
  
  // Check "Total ACW Today" is no longer visible after its duration has expired
  await expect(page.getByText("Total ACW Today")).not.toBeVisible({
    timeout: 60 * 1000,
  });
  
  // Check "Active Calls 1" is still hidden
  await expect(page.getByText("Active Calls 1")).toBeHidden({
    timeout: 60 * 1000,
  });
  
  // Check "Test 2" is still hidden
  await expect(page.getByText("Test 2")).toBeHidden({ timeout: 60 * 1000 });
  
 // Step 3. Delete a loop
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Click the close button.
  await page.click('[role="img"]');
  
  // Click on the "loop-list-more-icon" of the newly created loop.
  await page.click(`.loop-list-more-icon:right-of(:text('${newLoopName}'))`);
  
  // Click "Delete".
  await page.click(':text("Delete")');
  
  // Check that the loop name is hidden.
  await expect(page.locator(`text=${newLoopName}`)).toBeHidden({
    timeout: 60 * 1000,
  });
  
});
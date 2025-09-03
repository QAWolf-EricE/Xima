import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_calls_and_web_chats_2", async () => {
 // Step 1. Create Calls and WebChats 2 wallboard
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();
  const templateTitle = "Create new wallboard - Calls and WebChats 2";
  
  // REQ71 Navigate to Real Time Wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  
  // Clean up to check for the wall if it exists already
  await page.fill('[placeholder="Type to Search"]', templateTitle);
  await page.keyboard.press("Enter");
  while (await page.locator(`text=${templateTitle}`).count()) {
    // await page.click(
    //   `[data-cy="realtime-wallboards-item-menu-button"]:near(:text('Test 1'))`
    // );
    await page.click(
      `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${templateTitle}")) >> nth=0`
    );
    await page.click('[data-cy="realtime-wallboards-item-delete"]');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');
    await page.waitForTimeout(5000);
  }
  await cleanUpWallBoardsNotStrict(page, "Calls and WebChats 2");
  
  // REQ72 Click new Wallboard
  await page.click(':text("New Wallboard")');
  
  // REQ94 Click Calls and WebChats 2 wallboard option
  await page.click(
    'app-wallboard-select-template-tiles-item:has(p:text-is("Calls and WebChats 2"))'
  );
  
  // REQ93 Able to fill 'template configuration' modal
  const configModal = page.getByText("Template Configuration");
  await configModal.waitFor();
  
  await page.fill('[formcontrolname="title"]', templateTitle);
  await page.click(':text("Continue")');
  
  // REQ82 Able to preview wallboard
  await page.click('[data-mat-icon-name="more-v1"]');
  await page.click(':text("Go to Preview")');
  await expect(page).toHaveURL(/\/web\/wallboard-preview/);
  await expect(page.locator(".wallboard-header h3")).toHaveText(templateTitle);
  
  // REQ83 Able to Save wallboard
  await page.click('[data-mat-icon-name="more-v1"]');
  await page.click(':text("Edit Wallboard")');
  await page.click(':text("Save and Exit")');
  
  // REQ84 Delete Wallboard
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has(:text("${templateTitle}"))`
    )
  ).toBeVisible();
  await expect(async () => {
    await page.click(
      `[data-cy="realtime-wallboards-item"]:has(:text("${templateTitle}")) mat-icon`
    );
    await page.click(':text("Delete")');
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await expect(
      page.locator(
        `[data-cy="realtime-wallboards-item"]:has(:text("${templateTitle}"))`
      )
    ).not.toBeVisible();
  }).toPass({ timeout: 1000 * 120 });
  
  await cleanUpWallBoardsNotStrict(page, templateTitle);
 // Step 2. Preview Calls and WebChats 2 wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Delete Calls and WebChats 2 wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
});
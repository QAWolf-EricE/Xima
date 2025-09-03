import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_callbacks", async () => {
 // Step 1. Create Callbacks wallboard
  
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to realtime wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  await expect(page.locator("text=New Wallboard")).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first()
  ).toBeVisible();
  
  // clean test if needed
  await page.waitForTimeout(15000);
  let count = await page.locator("text=QA Wallboard").count();
  while (count) {
    await page.click(
      `[class="wallboard-footer"]:has-text("QA Wallboard") [data-cy="realtime-wallboards-item-menu-button"]`
    );
    await page.click('[data-cy="realtime-wallboards-item-delete"]');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');
    await page.waitForTimeout(5000);
    count = await page.locator("text=QA Wallboard").count();
  }
  
  await cleanUpWallBoardsNotStrict(page, "QA Wallboard");
  await cleanUpWallBoardsNotStrict(page, "Callbacks");
  
  // create new  Callback type wallboard
  await page.click(':text("New Wallboard")');
  await page.click(':text("Callbacks")');
  
  // fill out template configuration
  
  // name wallboard
  await expect(page.locator("text=Template Configuration")).toBeVisible({
    timeout: 60000,
  });
  const wallboardName = "QA Wallboard " + Date.now().toString().slice(-4);
  await page.click(".form-field");
  await page.fill('[aria-required="true"]', wallboardName);
  
  // assign params
  await page.click('[data-cy="xima-preview-input-edit-button"]');
  await page.waitForTimeout(1000);
  await page
    .locator(`[data-cy="checkbox-tree-property-select-all"] input`)
    .evaluate((node) => node.click());
  await page.click('[data-cy="checkbox-tree-dialog-apply-button"]');
  await page.waitForTimeout(1000);
  await page.click(
    '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
  );
  
  /* *********************************************************************
    // Maintained during investigation to dynamically choose an agent
  ********************************************************************* */
  
  const agent = await page.innerText(
    '[data-cy="xima-list-select-option"][role="option"] >> nth=3'
  );
  
  await page.click(`[data-cy="xima-list-select-option"] :text("${agent}")`);
  await page.click('[data-cy="agents-roles-dialog-apply-button"]');
  await page.waitForTimeout(1000);
  
  await page.click(':text("Continue")');
  
  // preview wallboard
  await page.click('[data-mat-icon-name="more-v1"]');
  await page.locator(':text("Go to Preview")').click({ timeout: 4 * 60 * 1000 });
  
  // assert wallboard widgets
  
  // assert skill values widget
  await expect(page.locator("text=Skill Values")).toBeVisible({
    timeout: 1000 * 60,
  });
  await expect(page.locator("text=Calls Presented Today")).toBeVisible();
  await expect(page.locator("text=Callbacks Reserved")).toBeVisible();
  await expect(page.locator("text=Max Queue Duration")).toBeVisible();
  await expect(page.locator("text=Callbacks Snoozed Today")).toBeVisible();
  
  // assert total queued calls widget
  await expect(page.locator("text=Total Queued Calls")).toBeVisible();
  await expect(page.locator(".app-gauge-widget")).toBeVisible();
  
  // assert agent widget
  await expect(page.locator("text=Agent").first()).toBeVisible();
  await expect(page.locator(`text=${agent}`)).toBeVisible();
  await expect(page.locator("text=Talking Time Now")).toBeVisible();
  await expect(page.locator("text=Ring Time Now")).toBeVisible();
  await expect(page.locator("text=Agent State")).toBeVisible();
  await expect(page.locator("text=Channel")).toBeVisible();
  await expect(page.locator("text=# Logged In")).toBeVisible();
  
  // back to wallboard dashboard
  await page.locator('[data-cy="realtime-wallboard-preview-back-btn"]').click();
  
  // Ensure page loads with a visible wallboard
  try {
    await page
      .locator("app-realtime-wallboards-item")
      .first()
      .waitFor({ timeout: 4000 });
  } catch {
    await page.reload();
    await page.locator("app-realtime-wallboards-item").first().waitFor();
  }
  
  await expect(async () => {
    await expect(page.locator(`text=${wallboardName}`)).toHaveCount(2);
  }).toPass({ timeout: 1000 * 120 });
  
  // delete wallboard
  
  // search wallboard to ensure we don't delete wrong board
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  
  // NOTE: selector works even if search doesn't
  await page.click(
    `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text('${wallboardName}'))`
  );
  await page.click('[data-cy="realtime-wallboards-item-delete"]');
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  await expect(page.locator("mat-card")).toBeHidden();
  await page.reload(); // ensure deletion presists
  await expect(page.locator("text=New Wallboard")).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(page.locator(`text=${wallboardName}`)).toHaveCount(0);
  
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
 // Step 2. Preview callbacks wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Delete callbacks wallboard
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
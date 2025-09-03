import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("loops_favorite_unfavorite_loop", async () => {
 // Step 1. Favorite a loop
  // used to create loops
  // const createLoop = async (nameOfLoop) => {
  //   // click create loop and fill in name
  //   await page.click(':text("Create a Loop")');
  //   await page.fill('input:below(:text("Loop Name"))', nameOfLoop);
  
  //   // fill in wallboard
  //   await page.waitForTimeout(2000);
  //   await expect(async () => {
  //     await page.click(':text("Add New Wallboard to Loop")');
  //     await page.click('[role="combobox"] >> nth=0');
  //   }).toPass({ timeout: 1000 * 120 });
  //   await page.waitForTimeout(2000);
  //   await page.keyboard.press("Enter");
  //   await page.click('[role="combobox"] >> nth=1');
  //   await page.click(':text-is("1 minute")');
  
  //   // click apply
  //   await page.click(':text("Apply")');
  // };
  
  // // If we need to get the current XIMA version
  // console.log(process.env.XIMA_VERSION);
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  /**
   * This WF was in the middle of the audit, but was blocked by this bug:
   * https://app.qawolf.com/xima/bug-reports/451a34e6-844c-4ce7-9dad-57156eba6a33
   *
   * When this bug is closed, please ping @Zaviar Brown in slack
   */
  
  throw "Blocked";
  
  // Constants
  const prefix = "Fav/Unfav loop test";
  const newLoopName = `${prefix} ${Date.now().toString().slice(-4)}`;
  
  // Log in as a supervisor to the page
  const { page } = await logInSupervisor({ slowMo: 500 });
  
  // open hamburger menu
  await page.click('[data-cy="sidenav-menu-toggle-expand"]');
  
  // click realtime displays
  await page.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  // close hamburger menu
  await page.click('[data-cy="sidenav-menu-toggle-collapse"]');
  
  // go to loops tab
  await page.click(':text-is("Loops")');
  await page.waitForTimeout(5000);
  
  // delete all loops
  var loops = page.locator(`mat-row:has-text("${prefix}") >> .mat-menu-trigger`);
  while (await loops.count()) {
    await page.click(`mat-row:has-text("${prefix}") >> .mat-menu-trigger`);
    await page.click(':text-is("Delete")');
    await page.waitForTimeout(3000);
  }
  
  // assert all loops deleted
  await expect(page.locator(`mat-row:has-text("${prefix}")`)).not.toBeVisible();
  
  // create first dedicated loop
  // await page.waitForTimeout(3000);
  // await createLoop("Favorite/Unfavorite loop test1");
  
  // favorite the 1st loop
  // await page.click(`mat-row:has-text("Favorite/Unfavorite loop test1") mat-icon.star`);
  await page.click(
    `mat-row:has-text("Cross-group Forward Account") mat-icon.star`,
  );
  await page.waitForTimeout(1000);
  
  // // create second dedicated loop
  // await page.waitForTimeout(3000);
  // await createLoop("Favorite/Unfavorite loop test2");
  
  // assert star, loops created and the are in correct order
  await expect(
    page.locator(
      // `mat-row:has-text("Favorite/Unfavorite loop test1") mat-icon.star-pinned`
      `mat-row:has-text("Cross-group Forward Account") mat-icon.star-pinned`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(
      // `:text("Favorite/Unfavorite loop test1"):above(:text("Favorite/Unfavorite loop test2"))`
      `:text("Cross-group Forward Account"):above(:text("Sausages program Car"))`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(
      // `:text("Favorite/Unfavorite loop test2"):below(:text("Favorite/Unfavorite loop test1"))`
      `:text("Sausages program Car"):below(:text("Cross-group Forward Account"))`,
    ),
  ).toBeVisible({ timeout: 30000 });
  
  // unfavorite the 1st loop
  await page.click(
    // `mat-row:has-text("Favorite/Unfavorite loop test1") mat-icon.star-pinned`
    `mat-row:has-text("Cross-group Forward Account") mat-icon.star-pinned`,
  );
  await page.waitForTimeout(1000);
  
  // favorite the 2nd loop
  // await page.click(`mat-row:has-text("Favorite/Unfavorite loop test2") mat-icon.star`);
  await page.click(`mat-row:has-text("Sausages program Car") mat-icon.star`);
  await page.waitForTimeout(1000);
  
  // assert stars and new order
  await expect(
    page.locator(
      // `mat-row:has-text("Favorite/Unfavorite loop test1") mat-icon.star-pinned`
      `mat-row:has-text("Cross-group Forward Account") mat-icon.star-pinned`,
    ),
  ).not.toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(
      // `mat-row:has-text("Favorite/Unfavorite loop test2") mat-icon.star-pinned`
      `mat-row:has-text("Sausages program Car") mat-icon.star-pinned`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(
      // `:text("Favorite/Unfavorite loop test1"):below(:text("Favorite/Unfavorite loop test2"))`
      `:text("Cross-group Forward Account"):below(:text("Sausages program Car"))`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(
      // `:text("Favorite/Unfavorite loop test2"):above(:text("Favorite/Unfavorite loop test1"))`
      `:text("Sausages program Car"):above(:text("Cross-group Forward Account"))`,
    ),
  ).toBeVisible({ timeout: 30000 });
  
  // Unfavorite all loops
  let activeStars = await page.locator(".star-pinned").count();
  for (let i = 0; i < activeStars; i++) {
    await page.locator(`.star-pinned >> nth=${i}`).click();
    await page.waitForTimeout(2000);
  }
  
  // delete all loops
  // var loops = page.locator(
  //   `mat-row:has-text("Favorite/Unfavorite loop test") >> .mat-menu-trigger`
  // );
  // while (await loops.count()) {
  //   await page.click(
  //     `mat-row:has-text("Favorite/Unfavorite loop test") >> .mat-menu-trigger`
  //   );
  //   await page.click(':text-is("Delete")');
  //   await page.waitForTimeout(3000);
  // }
  
  // // assert all loops deleted
  // await expect(
  //   page.locator(`mat-row:has-text("Favorite/Unfavorite loop test")`)
  // ).not.toBeVisible({ timeout: 30000 });
  
 // Step 2. Unfavorite a loop
  // Description:
});
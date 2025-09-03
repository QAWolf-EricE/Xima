import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_favorite_a_report", async () => {
 // Step 1. Favorite a report
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // unfavorite agent call summary if already favorited
  await page.waitForTimeout(5000);
  await page.click(':text("Reports")');
  
  await page
    .click(`[data-cy="reports-list-report-favorite-button"]`, {
      timeout: 5000,
    })
    .catch((e) => console.error(e));
  
  // grab top list item title
  await page.mouse.click(0, 0);
  var topItem = await page.innerText('[data-cy="reports-list-report-name"]');
  console.log(topItem);
  await expect(
    page.locator('[data-cy="reports-list-report-name"]').first()
  ).not.toHaveText("Agent Call Summary");
  
  await page.waitForTimeout(3000);
  
  // hover over report
  await page.hover(
    '[data-cy="reports-list-report-name"]:has-text("Agent Call Summary")'
  );
  await page.waitForTimeout(1000);
  
  // click favorite button
  await page.click('[data-cy="reports-list-report-favorite-button"]', { force: true });
  
  // assert star is visible
  await page.mouse.click(0, 0);
  
  let newTopItem = ""
  
  try {
    await expect(
      page.locator('[data-cy="reports-list-report-favorite-button"]:visible')
    ).toBeVisible();
  
    await expect(
      page.locator('[data-cy="reports-list-report-name"]').first()
    ).toHaveText("Agent Call Summary");
  
    // assert report is top of the list
    let newTopItem = await page.innerText('[data-cy="reports-list-report-name"]');
    console.log(newTopItem);
  } catch (err) { 
    console.log(err)
  }
  
  // try again 
  try {
    await expect(
      page.locator('[data-cy="reports-list-report-name"]').first()
    ).toHaveText("Agent Call Summary");
  } catch {
    // if it isn't, most likely means it is not favorited, very flakey
    // hover over report
    await page.hover(
      '[data-cy="reports-list-report-name"]:has-text("Agent Call Summary")'
    );
    await page.waitForTimeout(1000);
  
    // click favorite button
    await page.click('[data-cy="reports-list-report-favorite-button"]', { force: true });
  
    // assert star is visible
    await page.mouse.click(0, 0);
    await expect(
      page.locator('[data-cy="reports-list-report-favorite-button"]:visible')
    ).toBeVisible();
  
    await expect(
      page.locator('[data-cy="reports-list-report-name"]').first()
    ).toHaveText("Agent Call Summary");
  
    // assert report is top of the list
    let newTopItem = await page.innerText('[data-cy="reports-list-report-name"]');
    console.log(newTopItem);
  }
  
  // assert top items are different
  expect(topItem).not.toBe(newTopItem);
  
  // unfavorite report
  await page.click('[data-cy="reports-list-report-favorite-button"]');
  
  // assert star is hidden
  // await page.mouse.click(0, 0);
  await page.click(':text("Reports")');
  await expect(
    page.locator('[data-cy="reports-list-report-favorite-button"]:visible')
  ).toBeHidden();
  
  // assert old top item is the top item again
  await expect(
    page.locator('[data-cy="reports-list-report-name"]').first()
  ).toHaveText(topItem);
});
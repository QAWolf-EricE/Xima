import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_toggle_reports_view", async () => {
 // Step 1. View Reports in List View
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Log in using the supervisor login, returning a {page} reference
  const { page } = await logInSupervisor();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Verify that the text on {page} is currently set to "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Verify that the reports list table is visible
  await expect(page.locator('[data-cy="reports-list-table"]')).toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert list view is toggled
  await expect(
    page.locator(`mat-button-toggle[value="LIST"] [aria-checked="true"]`),
  ).toBeVisible();
  
  // Assert tile view is not toggled
  await expect(
    page.locator(`mat-button-toggle[value="TILES"] [aria-checked="false"]`),
  ).toBeVisible();
  
  // Assert the page is in list view
  await expect(
    page.locator(`mat-row:has([data-cy="reports-list-report-name"])`).first(),
  ).toBeVisible();
  
 // Step 2. View Reports in Tile View
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Save the number of rows
  const rows = await page
    .locator(`mat-row:has([data-cy="reports-list-report-name"])`)
    .count();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click on the 'cards' icon to switch to cards view
  await page.locator('[data-mat-icon-name="cards"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert tile view is toggled
  await expect(
    page.locator(`mat-button-toggle[value="TILES"] [aria-checked="true"]`),
  ).toBeVisible();
  
  // Assert list view is not toggled
  await expect(
    page.locator(`mat-button-toggle[value="LIST"] [aria-checked="false"]`),
  ).toBeVisible();
  
  // Assert that the first card is visible in the cards view
  await expect(page.locator(".app-reports-tiles-item").first()).toBeVisible();
  
  // Assert that the reports list table is now hidden
  await expect(page.locator('[data-cy="reports-list-table"]')).not.toBeVisible();
  
  // Count the total number of cards in the reports cards view and assign it to {cards}
  const cards = await page.locator(".app-reports-tiles-item").count();
  
  // Assert that the number of rows in list view ({rows}) is equal to the number of cards in cards view ({cards})
  expect(rows).toBe(cards);
  
});
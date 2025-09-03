import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_navigation_from_hovering_sidebar", async () => {
 // Step 1. Navigate to My Reports from Sidebar
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // REQ132 Click My reports from sidebar
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page.click(':text("My Reports")');
  const currentURL = page.url();
  expect(currentURL.split(".com")[1]).toEqual("/web/reports/all");
  
});
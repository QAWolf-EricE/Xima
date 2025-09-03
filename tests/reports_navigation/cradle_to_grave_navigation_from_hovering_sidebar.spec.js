import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("cradle_to_grave_navigation_from_hovering_sidebar", async () => {
 // Step 1. Navigate to C2G from Sidebar
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();
  
  // REQ133 Click Cradle to Grave from sidebar
  await page.hover('[data-mat-icon-name="reports"]');
  await page.click('button:has-text("Cradle to grave")');
  
  // assert on cradle to grave page
  await page.click('button:has-text("Apply")');
  
  await expect(page).toHaveURL(/cradle-to-grave/);
  await expect(page.locator(".toolbar-title")).toHaveText("Cradle to Grave");
  
});
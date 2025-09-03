import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("remove_add_a_sip_extension", async () => {
 // Step 1. Remove SIP Extension
  //--------------------------------
  // Arrange:
  //--------------------------------
  // log in as administrator
  const { page: adminPage } = await logInSupervisor();
  
  // hover over gear icon and click SIP Extensions
  await adminPage.locator(`[data-cy="sidenav-menu-ADMIN_SYSTEM"]`).hover();
  await adminPage.locator(`:text("SIP Extensions")`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // verify that status for both extensions are "Registered"
  await expect(adminPage.locator('tr:has-text("111")')).toContainText('Registered');
  await expect(adminPage.locator('tr:has-text("101")')).toContainText('Registered');
  
  // remove extension 111
  await adminPage.locator('tr:has-text("111") button').nth(0).click();
  await adminPage.getByRole(`menuitem`, { name: `Delete` }).click();
  await adminPage.locator(`[data-cy="confirmation-dialog-okay-button"]`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert that the extenison is no longer visible
  await expect(adminPage.locator('tr:has-text("111")')).not.toBeVisible();
  
 // Step 2. Add SIP Extension
  //--------------------------------
  // Arrange:
  //--------------------------------
  // click Done
  await adminPage.locator('button:has-text("Done")').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // hover over gear icon and click SIP Extensions
  await adminPage.locator(`[data-cy="sidenav-menu-ADMIN_SYSTEM"]`).hover();
  await adminPage.locator(`:text("SIP Extensions")`).click();
  
  // click + button in inbound extensions tab
  await adminPage.locator('xima-header-add:has-text("Inbound Extensions") button').click();
  
  // fill out extension info
  await adminPage.locator('mat-label:has-text("SIP Extension") + div input').fill("111");
  await adminPage.locator('mat-label:has-text("SIP Password") + div input').fill("uY2uVA0v");
  
  // click Save and wait for 2 minutes
  await adminPage.locator('button:has(:text-is("Save"))').click();
  await adminPage.locator(`[data-cy="confirmation-dialog-okay-button"]`).click();
  await adminPage.waitForTimeout(2 * 60 * 1000);
  
  // click Refresh button
  await adminPage.locator('button:has-text("Refresh")').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert that the SIP handsets are now Registered
  await expect(adminPage.locator('tr:has-text("111")')).toContainText('Registered');
  await expect(adminPage.locator('tr:has-text("101")')).toContainText('Registered');
  
});
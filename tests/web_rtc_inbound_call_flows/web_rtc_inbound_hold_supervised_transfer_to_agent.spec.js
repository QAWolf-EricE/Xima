import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_hold_supervised_transfer_to_agent", async () => {
 // Step 1. Answer call as WebRTC agent and put call on hold
  //--------------------------------
  // Arrange:
  //--------------------------------
  // REQ03 Login as WebRTC Agent InboundCallHoldFlow
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_38_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  // REQ03 Login as WebRTC Agent InboundCallHoldFlow2
  const { page: page2, browser: browser2 } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_39_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  
  // toggle Skill 49
  await page.bringToFront()
  await toggleSkill(page, "49");
  
  // REQ134 Toggle Agent1 status to Ready
  await page.bringToFront();
  await toggleStatusOn(page)
  
  // REQ134 Toggle Agent 2 status to Ready
  await page2.bringToFront();
  await toggleSkill(page2, "49");
  await toggleStatusOn(page2)
  
  // Bring user 1 page to front
  await page.bringToFront();
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({ number: "4352551622" });
  console.log(callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [9]);
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('span:has-text("Answer Call")', { timeout: 2 * 60 * 1000 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Put call on hold
  await page.waitForTimeout(3000);
  await page.click('[data-cy="hold-btn"]');
  
  // Take off of hold
  await page.waitForTimeout(1000);
  await page.click('[data-cy="hold-btn"]');
  
  // Transfer to other logged in agent
  await page.waitForTimeout(1000);
  await page.click('[data-cy="transfer-btn"]');
  
  // Click "Agent" icon
  await page.click('[data-mat-icon-name="agent"]');
  
  // Transfer call to Agent 2
  await page.waitForTimeout(1000);
  await page.click(
    '[aria-haspopup="menu"] div:has-text("WebRTC Agent 39")'
  );
  
  // Click "Assisted Transfer"
  await page.waitForTimeout(1000);
  await page.click('[role="menuitem"]:has-text("Assisted Transfer")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that "Assisted Transfer Attempt" is visible on Agent 2's page
  await page2.bringToFront();
  await expect(
    page2.locator('xima-dialog-header:has-text("Assisted Transfer Attempt")')
  ).toBeVisible();
  
  // Answer the call
  await page.waitForTimeout(3000);
  await page2.click('span:text-is("Answer Call")');
  
  // Assert that Agent 1 sees "Complete Transfer"
  await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();
  
  // Click "Complete Transfer" on agent 1's page
  await page.waitForTimeout(3000);
  await page.click('span:text-is("Complete Transfer")');
  
  // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
  await expect(
    page2.locator('span:text-is("Assisted Transfer Pending")')
  ).toBeHidden();
  await expect(page2.locator('span:text-is("Call Active")')).toBeVisible();
  
  // end call
  await page2.locator(`[data-cy="end-call-btn"]`).click();
  
  // Assert "Call Ended" is visible on agent 1 page
  await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();
  
  // close pages to not get access to any future calls
  await page.close();
  await page2.close();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // create new context and log in as Supervisor
  const context = await browser.newContext();
  const page3 = await context.newPage();
  await page3.goto(buildUrl("/"));
  await page3.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME
  );
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD
  );
  await page3.click('[data-cy="consolidated-login-login-button"]');
  
  //--------------------------------
  // Act:
  //--------------------------------
  // go to c2g
  await page3.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page3.click(':text("Cradle to Grave")');
  
  // filter date
  await page3.click('[aria-label="Open calendar"]');
  const currWeek = page3.locator("tr:has(.mat-calendar-body-today)");
  await currWeek.locator("td >> nth=1").click();
  await currWeek.locator("td >> nth=-2").click();
  await page3.mouse.click(0, 0);
  await page3.waitForTimeout(1000);
  await page3.click('button:has-text("Apply")');
  
  // include filter to have unique agent to avoid collisions
  await page3.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
  try {
    await page3
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  } catch {
    await page3.locator(`xima-header-add`).getByRole(`button`).click();
    await page3.locator(`[data-cy="xima-criteria-selector-search-input"]`).fill(`Agent`);
    await page3.getByText(`Agent`, { exact: true }).click();
    await page3
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  }
  await page3.waitForTimeout(1000);
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("WebRTC Agent 38");
  await page3.waitForTimeout(1000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(3000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  // Sort by latest
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(2000);
  
  // Expand latest Outbound call report
  await page3.locator(
    'mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0'
  ).click();
  
  // Close sub rows
  const openSubRows = page3.locator(`[data-cy="cradle-to-grave-table-row-details-collapse-row-button"]`);
  while (await openSubRows.count()) {
    await openSubRows.first().click();
    await page3.waitForTimeout(1000);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // The call flow should look like this:
  // - Queue
  // -- Queue Audio
  // -- Queue Offer
  // - Talking
  // - Hold
  // - Talking
  // - Transfer Hold
  // -- Ringing
  // -- Talking
  // - Transfer
  // - Talking
  // - Receiving Drop
  
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue")`)).toBeVisible();
  await page3.locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"] >> nth=0`).click();
  await page3.waitForTimeout(2000);
  await page3.locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"] >> nth=0`).click();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue Audio")`)).toBeVisible();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue Offer")`)).toBeVisible();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")`)).toHaveCount(4);
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Transfer Hold")`)).toBeVisible();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")`)).toBeVisible();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text-is("Transfer")`)).toBeVisible();
  await expect(page3.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Receiving Drop")`)).toBeVisible();
  
 // Step 2. View Call in C2G ( inbound call )
  
});
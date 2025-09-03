import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleOnAllSkills, toggleSkill, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_hold_supervised_transfer_to_did", async () => {
 // Step 1. Put call on hold, transfer via DID
  //--------------------------------
  // Arrange:
  //--------------------------------
  // REQ03 Login as WebRTC Agent InboundCallHoldFlow
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_36_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // REQ03 Login as WebRTC Agent InboundCallHoldFlow2
  const { page: page2, browser: browser2 } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_37_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  
  // toggle Skill 48
  await page.bringToFront();
  await toggleSkill(page, "48");
  
  // REQ134 Toggle Agent1 status to Ready
  await page.bringToFront();
  await toggleStatusOn(page);
  
  // REQ134 Toggle Agent 2 status to Ready
  await page2.bringToFront();
  await toggleOnAllSkills(page2);
  await toggleStatusOn(page2);
  
  // Bring user 1 page to front
  await page.bringToFront();
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({ number: "4352551622" });
  console.log(callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [8]);
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('button:has-text("Answer Call")', { timeout: 2 * 60 * 1000 });
  
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
  
  // Dial "ext<agentExtension>"
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  await page.locator(`[data-cy="dialpad-number"]:has-text("1")`).click();
  await page.locator(`[data-cy="dialpad-number"]:has-text("3D E F")`).click();
  await page.click('[data-cy="call-button"]');
  
  // Click "Assisted Transfer"
  await page.waitForTimeout(1000);
  await page.click('[role="menuitem"]:has-text("Assisted Transfer")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that "Assisted Transfer Attempt" is visible on Agent 2's page
  await page2.bringToFront();
  await expect(
    page2.locator('xima-dialog-header:has-text("Assisted Transfer Attempt")'),
  ).toBeVisible();
  
  // Answer the call
  await page.waitForTimeout(3000);
  await page2.click('span:has-text("Answer Call")');
  
  // Assert that Agent 1 sees "Complete Transfer"
  await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();
  
  // Click "Complete Transfer" on agent 1's page
  await page.click('span:text-is("Complete Transfer")');
  
  // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
  await expect(
    page2.locator('span:text-is("Assisted Transfer Pending")'),
  ).toBeHidden();
  await expect(page2.locator('span:text-is("Call Active")')).toBeVisible();
  
  // end call
  await page2.locator(`[data-cy="end-call-btn"]`).click();
  
  // Assert "Call Ended" is visible on agent 1 page
  await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();
  
  // Toggle status off for both agents
  await toggleStatusOff(page);
  await toggleStatusOff(page2);
  
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
    process.env.SUPERVISOR_USERNAME,
  );
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
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
  await page3.waitForTimeout(2000);
  await page3.locator(`[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 36")`).click();
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(3000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  await page3.waitForTimeout(3000);
  
  // expand last oubound call report
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(2000);
  await page3.click(
    `mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0`,
  );
  
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
  try {
    await expect(
      page3.locator(
        `[data-cy="cradle-to-grave-table-cell-event-name"] :text-is("Queue")`,
      ),
    ).toBeVisible();
  } catch {
    await page3
      .locator(`[data-cy="cradle-to-grave-table-expand-row-button"] >> nth=0`)
      .click();
    await expect(
      page3.locator(
        `[data-cy="cradle-to-grave-table-cell-event-name"] :text-is("Queue")`,
      ),
    ).toBeVisible();
  }
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-row-details-expand-row-button"] >> nth=0`,
    )
    .click();
  await page3.waitForTimeout(2000);
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-row-details-expand-row-button"] >> nth=0`,
    )
    .click();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue Audio")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue Offer")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")`,
    ),
  ).toHaveCount(4);
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Transfer Hold")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text-is("Transfer")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Receiving Drop")`,
    ),
  ).toBeVisible();
  
 // Step 2. View Call in C2G
  
});
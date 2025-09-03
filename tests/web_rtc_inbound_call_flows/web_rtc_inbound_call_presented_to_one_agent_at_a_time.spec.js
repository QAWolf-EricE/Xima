import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_call_presented_to_one_agent_at_a_time", async () => {
 // Step 1. Login as WebRTC Agent 11 & 12 in separate contexts
  //--------------------------------
  // Arrange:
  //--------------------------------
  // REQ03 Login as WebRTC Agent 30
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_30_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  // toggle agent 30 skills on
  await page.bringToFront()
  await toggleSkill(page, "46");
  
  // create new context and log in as WebRTC Agent 31
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_31_EMAIL
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // toggle agent 31 skills on
  await toggleSkill(page2, "46");
  
  // REQ134 Toggle Agent status to Ready
  await toggleStatusOn(page2);
  await page.bringToFront();
  await toggleStatusOn(page);
  
  // create new context and log in as Supervisor
  const context2 = await browser.newContext({ timezoneId: "America/Denver" });
  const page3 = await context2.newPage();
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
  // REQ135 Simulate an incoming call
  await page.bringToFront();
  let callId = await createCall({
    number: "4352551622"
  });
  console.log("CALL ID: " + callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [6]);
  
  // REQ204 Call presented to one agent at a time
  await expect(
    page.locator('[data-cy="alert-incoming-call-content"]')
  ).toBeVisible({ timeout: 65 * 1000 });
  
  // switch to agent 31 and assert call modal is not shown
  await page2.bringToFront();
  await expect(
    page2.locator('[data-cy="alert-incoming-call-skill"]')
  ).not.toBeVisible();
  
  // backto agent 30
  await page.bringToFront();
  
  // REQ205 WebRTC Assert incoming CallerID
  await expect(
    page.locator('[data-cy="alert-incoming-call-content"]')
  ).toBeVisible({ timeout: 10 * 1000 });
  
  const callerId = await page.innerText(
    '[data-cy="alert-incoming-call-content"]'
  );
  
  // answer the call
  await page.click('[data-cy="alert-incoming-call-accept"]');
  
  console.log(callerId.slice(0, 11));
  
  // REQ206 WebRTC Call details match CallerID
  await expect(
    page.locator(
      '[data-cy="details-sidebar-details-CUSTOMER_CALL_EXTERNAL_PARTY_NUMBER"]'
    )
  ).toHaveText(callerId.slice(0, 11));
  
  // REQ207 WebRTC Add notes to a call
  await page.click('[role="tab"]#mat-tab-label-0-1');
  const notes = faker.lorem.words();
  await page.fill('[data-cy="details-sidebar-note-textarea"]', notes);
  await page.click('[data-cy="details-sidebar-note-post-anchor"]');
  
  // assert posted notes
  await expect(page.locator(".note")).toContainText(notes);
  
  // REQ208 WebRTC Add account codes to a call
  await page.click('[role="tab"]#mat-tab-label-0-2');
  await page.click('[data-cy="details-sidebar-select-code"]');
  await page.click(':text("Test Code")');
  await page.click('[data-cy="details-sidebar-post-code"]');
  
  // REQ197 WebRTC Agent can hang up a call from the UI
  await page.click('[data-cy="end-call-btn"]');
  
  // REQ213 WebRTC ACW timer is visible
  // await expect(
  //   page.locator('[data-cy="alert-after-call-work-title"]')
  // ).toHaveText("After Call Work");
  
  // REQ209 WebRTC Post call 'Finish' button is visible
  await page.click('[data-cy="finish-btn"]');
  
  // REQ146 Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.hover('[data-mat-icon-name="reports"]');
  await page3.click(':text("Cradle to Grave")');
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(`.mat-calendar-body-cell :text-is("1")`);
  await page.waitForTimeout(500);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(1000);
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
  await page3.fill(
    '[data-cy="xima-list-select-search-input"]',
    "WebRTC Agent 30"
  );
  await page3.waitForTimeout(2000);
  await page3.click('[data-cy="xima-list-select-option"]');
  await page3.waitForTimeout(1000);
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  await page3.waitForTimeout(1000);
  await page3.click('button:has-text("Apply")');
  await page3.waitForTimeout(2000);
  
  // expand recent call report for agent 30
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(2000);
  const callRow = page3.locator(
    'mat-row:has([data-cy="cradle-to-grave-table-cell-RECEIVING_PARTY"] :text("Agent 30"))'
  );
  await callRow.locator(' [data-mat-icon-name="chevron-closed"]').first().click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText("Talking");
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText("Drop");
  
  // open notes and assert
  await callRow
    .locator('[data-cy="cradle-to-grave-table-note-button"]')
    .first()
    .click();
  
  console.log("NOTES: ", notes);
  await expect(page3.locator('[data-cy="c2g-note-content"]')).toHaveText(notes);
  
 // Step 2. Confirm call presented to one agent at a time
  // Description:
 // Step 3. Add Notes to Call (call presented to one agent...)
  // Description:
 // Step 4. Add account codes to a call (call presented to one agent...)
  // Description:
 // Step 5. View ACW timer (call presented to one agent...)
  // Description:
 // Step 6. View Call in C2G (call presented to one agent...)
  // Description:
});
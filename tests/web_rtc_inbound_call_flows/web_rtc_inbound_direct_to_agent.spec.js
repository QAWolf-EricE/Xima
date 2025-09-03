import { buildUrl, createWebRTCCall, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_direct_to_agent", async () => {
 // Step 1. Login as Agent 202 & supervisor (incoming call direct to agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as Agent 202 aka agent 1 with specific browser permissions
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_1_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  //!! create a new context
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  
  //!! create a new page
  const page2 = await context.newPage();
  
  //!! navigate to the default URL
  await page2.goto(buildUrl("/"));
  
  //!! fill the username input with supervisor username
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! fill the password input with supervisor password
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! click the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! engage in a call, checking status and details, then hang up
  
  //!! bring the agent's page to the front
  await page.bringToFront();
  
  // toggle skill
  await toggleSkill(page, "50");
  
  //!! toggle Agent status to Ready
  await toggleStatusOn(page);
  
  //!! simulate an incoming call directly to agent
  let callId = await createWebRTCCall();
  
  //!! log the call ID
  console.log("CALL ID: " + callId);
  
  //!! answer the incoming call
  await page.click('[data-cy="alert-incoming-call-accept"]', {
    force: true,
    delay: 500,
    timeout: 120000
  });
  
  //!! check whether the call status shows "Call Active"
  await expect(page.locator("text=Call Active")).toBeVisible();
  
  //!! check whether the Caller Id, External Party Number, Wait Time and Call Direction details are visible
  await expect(page.locator("text=Caller Id")).toBeVisible();
  await expect(page.locator("text=External Party Number")).toBeVisible();
  await expect(page.locator("text=Wait Time")).toBeVisible();
  await expect(page.locator("text=Call Direction")).toBeVisible();
  
  //!! end the call
  await page.click('[data-cy="end-call-btn"]', { force: true, delay: 500 });
  
  //!! click the finish button
  await page.click('[data-cy="finish-btn"]', { force: true, delay: 500 });
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! log back in as an admin user and validate the call report
  
  //!! bring the supervisor's page to the front
  await page2.bringToFront();
  
  // //!! hover over the reports launcher
  // await page2.hover('.mat-list-item:has([data-mat-icon-name="reports"])');
  
  //!! click Cradle to Grave from the dropdown menu
  await page2.click(':text("Cradle to Grave")');
  
  //!! open the UI to change Channels to phone
  await page2
    .locator(
      `[data-cy="configure-report-preview-parameter-MEDIA_SELECTION"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  
  //!! toggle the Calls checkbox
  await page.waitForTimeout(1000);
  await page2
    .locator(`[data-cy="checkbox-tree-property-option"] :text("Calls")`)
    .click();
  
  //!! apply the selection
  await page.waitForTimeout(1000);
  await page2.locator(`[data-cy="checkbox-tree-dialog-apply-button"]`).click();
  await page.waitForTimeout(1000);
  
  //!! add the agent filter for Xima Agent 2
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2.locator(`[data-cy="xima-criteria-selector-search-input"]`).fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  }
  
  //!! input "Xima Agent 2" into the agent filter search field
  await page.waitForTimeout(1000);
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 1");
  
  //!! toggle the checkbox for "Xima Agent 2"
  await page.waitForTimeout(1000);
  await page2
    .locator(
      `[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 1("):visible`,
    )
    .click();
  
  //!! apply the selection
  await page.waitForTimeout(1000);
  await page2.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  await page.waitForTimeout(1000);
  
  // date filter
  await page2
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await page2.click(`.mat-calendar-body-cell :text-is("1")`);
  await page2.locator(`[aria-current="date"]`).click();
  await page.waitForTimeout(1000);
  
  //!! click Apply to enforce all filters
  // Click 'Apply' to apply all filters
  await page2
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  //!! try navigating to the page with the latest inbound call report
  const nextButton = page.locator('a[aria-label="Next page"]');
  try {
    while (nextButton) {
      await page2.click('[aria-label="Next page"]', { timeout: 10000 });
      await page.waitForTimeout(1500);
    }
  } catch {
    await page.waitForTimeout(100);
  }
  
  //!! sort the calls by start time
  await page2.waitForTimeout(2000);
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.waitForTimeout(2000);
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.waitForTimeout(2000);
  
  try {
    //!! expand the last inbound call report
    await page2
      .locator(`[data-cy="cradle-to-grave-table-expand-row-button"] >> nth=0`)
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err)
  }
  
  //!! check whether the call report details show "Ringing"
  await expect(
    page2.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Ringing", { timeout: 4000 });
  
  //!! check whether the call report details show "Talking"
  await expect(
    page2.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Talking");
  
  //!! check whether the call report details show "Drop"
  await expect(
    page2.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Drop");
  
 // Step 2. Simulate an incoming call direct to agent (incoming call direct to agent)
  // Description:
 // Step 3. Answer Call (incoming call direct to agent)
  // Description:
 // Step 4. View Call in C2G (incoming call direct to agent)
  // Description:
});
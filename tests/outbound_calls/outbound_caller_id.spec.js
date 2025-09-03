import { logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("outbound_caller_id", async () => {
 // Step 1. Agent - CCAC Experience
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as a WebRTC user assigned to skill 34. (WebRTC Agent 7)
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_7_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Login as Supervisor
  const { browser: browser2, context } = await launch();
  
  // Ready Agent, toggle on Skill 34
  await toggleSkill(page, "34");
  await toggleStatusOn(page);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Select the Caller ID 4352003655 from the dropdown menu.
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  await page.locator(`:text("New Call")`).click();
  await page.locator(`:text("Confirm")`).click();
  await page.locator(`.caller-id-select-menu-button`).click();
  await page.locator(`:text("QA Wolf4352003655")`).click();
  
  // Make an outbound call.
  const phoneNumber = `2406522131`;
  await page
    .locator(`[data-cy="dialpad-text"] #phoneNumberInput`)
    .fill(phoneNumber);
  await page.locator(`[data-cy="call-button"]`).click();
  await page
    .locator(`[data-cy="alert-select-skills-skill-button-Skill 34"]`)
    .click();
  
  const phone = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  
  // Get list of recent calls
  const listOfCustomerCalls = await phone.calls.list({
    to: "+12406522131", // Ensure we're only checking calls to our Twilio number
    limit: 10, // Adjusted limit to ensure we capture the call
  });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Verify that the call displays the Caller ID 4352003655.
  const callFromExpectedCallerID = listOfCustomerCalls.find(
    (call) => call.from === "+14352003655",
  );
  expect(callFromExpectedCallerID).toBeTruthy();
  
  // Assert call Active
  await expect(page.locator(`:text("Outbound Call")`)).toBeVisible();
  await expect(page.locator(`:text("Call Active")`)).toBeVisible();
  
  // Assert call to Twilio number
  await expect(
    page.locator(`xima-call .subtitle:has-text("${phoneNumber}")`),
  ).toBeVisible();
  
  // Assert Call Ended
  await expect(page.locator(`:text("Outbound Call Ended")`)).toBeVisible();
  
  // Cleanup - Finish call and close page
  await page.locator(`[data-cy="finish-btn"]`).click();
  await page
    .locator(
      `[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]`,
    )
    .click();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  const page2 = await context.newPage();
  await page2.goto(process.env.DEFAULT_URL);
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Navigate to C2G
  await expect(async () => {
    await page2
      .locator(`[data-cy="sidenav-menu-REPORTS"]`)
      .hover({ force: true, delay: 500 });
    await page2
      .getByRole(`button`, { name: `Cradle to Grave` })
      .click({ timeout: 3500 });
  }).toPass({ timeout: 10 * 1000 });
  
  // Filter agent
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 7`);
  await page2.waitForTimeout(1000);
  await page2.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  await page2.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // Date filter
  await page2
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await page2.click(`.mat-calendar-body-cell :text-is("1")`);
  await page2.locator(`[aria-current="date"]`).click();
  await page2.waitForTimeout(1000);
  await page2
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  // Sort the calls by start time
  await page2.waitForTimeout(2000);
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.waitForTimeout(2000);
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.waitForTimeout(2000);
  
  // Expand the last inbound call report
  try {
    await page2
      .locator(`[data-cy="cradle-to-grave-table-expand-row-button"] >> nth=0`)
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert dialing, ringing, talking, receiving drop
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Dialing")`,
    ),
  ).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")`,
    ),
  ).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Drop")`,
    ),
  ).toBeVisible();
  
  // Assert outbound call, calling party and receving party, skill 34
  await expect(
    page2.locator(`[data-cy="cradle-to-grave-table-cell-INFO"] >> nth=0`),
  ).toContainText(`Outbound`);
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-CALLING_PARTY"] >> nth=0`,
    ),
  ).toHaveText(`WebRTC Agent 7(209)`);
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-RECEIVING_PARTY"] >> nth=0`,
    ),
  ).toHaveText(`12406522131`);
  await expect(
    page2.locator(`[data-cy="cradle-to-grave-table-cell-GROUP"] >> nth=0`),
  ).toHaveText(`Skill 34`);
  
 // Step 2. Call event is visible on C2G
  
});
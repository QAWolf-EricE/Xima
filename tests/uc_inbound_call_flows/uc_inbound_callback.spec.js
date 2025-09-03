import { logInAgent, logInSupervisor, logUCAgentIntoUCWebphone, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_inbound_callback", async () => {
 // Step 1. Caller selects the Callback Option, enters a phone number and confirms a phone number
  //--------------------------------
  // Arrange:
  //--------------------------------
  // login as stephanie agent, ready agent, toggle on skill 71
  const { page: ucAgentPage, browser } = await logInAgent({
    email: process.env.UC_AGENT_19_EXT_119,
    password: process.env.UC_AGENT_19_EXT_119_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // log into supervisor
  const { page, browser: browser2 } = await logInSupervisor();
  
  // log agent into webphone
  await ucAgentPage.bringToFront();
  const { ucWebPhonePage } = await logUCAgentIntoUCWebphone(
    browser,
    process.env.UC_AGENT_19_EXT_119_WEBPHONE_USERNAME,
  );
  
  await ucAgentPage.bringToFront();
  await ucAgentPage.waitForTimeout(5000);
  await toggleStatusOn(ucAgentPage);
  await toggleSkillsOn(ucAgentPage, "71");
  
  // navigate to supervisor view
  await page.bringToFront();
  await page.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  await page.locator(`:text("Supervisor View")`).click();
  
  // view calls in queue for skill 71
  await page.locator(`[data-cy="settings-menu-button"]`).click();
  await page.locator(`[data-cy="settings-menu-views-calls-queue"]`).click();
  await page.waitForTimeout(3000);
  await page.locator(`.queued-calls-dropdown`).click();
  await page.locator(`:text-is("Skill 71") >> nth=-1`).click();
  
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, // TWILIO_ACCOUNT_SID
    process.env.TWILIO_AUTH_TOKEN, // TWILIO_AUTH_TOKEN
  );

  const call = await client.calls.create({
    url: "http://demo.twilio.com/docs/voice.xml",
    to: "+14352001586",
    from: `+12406502927`,
  });
  
  await expect
    .poll(
      async () => {
        console.log("Polling for Call Status...");
        const response = await client.calls(call.sid).fetch();
        return response.status;
      },
      {
        message: "Make sure call is complete before moving on",
        intervals: [1_000, 2_000, 10_000],
        timeout: 60 * 2000,
      },
    )
    .toBe("in-progress");
  
  console.log(call);
  
  // dial 1 for skill 71
  await client.calls(call.sid).update({
    twiml: '<Response><Play digits="1"></Play><Pause length="55"/></Response>',
  });
  
  // accept call in
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator('button:has(+ p:text-is("ANSWER"))').click();
  
  // assert call shows up in queue
  await page.bringToFront();
  await expect(page.locator(`:text-is("In Queue (1)")`)).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("2406502927")`),
  ).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("SILVER SPG MD")`),
  ).toBeVisible();
  
  // assert incoming call modal on uc agent page
  await ucAgentPage.bringToFront();
  await expect(
    ucAgentPage.locator(`[data-cy="alert-incoming-call-title-selector"]`),
  ).toBeVisible();
  await expect(
    ucAgentPage.locator(
      `[data-cy="alert-incoming-call-calling-number"]:has-text("2406502927")`,
    ),
  ).toBeVisible();
  
  // end call
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator('[data-testid="CallEndIcon"]').click();
  // await ucAgentPage
  //   .locator(
  //     `[data-cy="alert-incoming-call-content"] [data-cy="alert-incoming-call-reject"]`,
  //   )
  //   .click();
  
  // second call
  await page.bringToFront();
  const newCall = await client.calls.create({
    url: "http://demo.twilio.com/docs/voice.xml",
    to: "+14352001586",
    from: "+15807014029",
  });
  
  await expect
    .poll(
      async () => {
        console.log("Polling for New Call Status...");
        const response = await client.calls(newCall.sid).fetch();
        return response.status;
      },
      {
        message: "Make sure new call is complete before moving on",
        intervals: [1_000, 2_000, 10_000],
        timeout: 60 * 2000,
      },
    )
    .toBe("in-progress");
  
  console.log(newCall);
  
  // Dial 1 for skill 71 on the new call
  await client.calls(newCall.sid).update({
    twiml: '<Response><Play digits="1"></Play><Pause length="40"/></Response>',
  });
  
  // wait for call to show up on queue
  await expect(page.locator(`:text-is("In Queue (1)")`)).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("5807014029")`),
  ).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("ENID OK")`),
  ).toBeVisible();
  
  // wait for first caller call to end (can speed this up by ending call)
  await page.waitForTimeout(10000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // dial 1 for callback
  await client.calls(newCall.sid).update({
    twiml: '<Response><Play digits="1"></Play><Pause length="10"/></Response>',
  });
  
  await page.waitForTimeout(5000);
  
  // dial 1 for callback
  await client.calls(newCall.sid).update({
    twiml: '<Response><Play digits="1"></Play><Pause length="10"/></Response>',
  });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // assert incoming call on uc agent page
  await ucAgentPage.bringToFront();
  await expect(
    ucAgentPage.locator(`[data-cy="alert-incoming-call-title-selector"]`),
  ).toBeVisible();
  await expect(
    ucAgentPage.locator(
      `[data-cy="alert-incoming-call-calling-number"]:text("2406502927")`,
    ),
  ).toBeVisible();
  
  // wait for callback to show up on queue
  await page.bringToFront();
  await expect(page.locator(`:text-is("In Queue (2)")`)).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("2406502927")`),
  ).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("SILVER SPG MD")`),
  ).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("5807014029")`),
  ).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("ENID OK")`),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // miss calls
  // await ucAgentPage
  //   .locator(
  //     `[data-cy="alert-incoming-call-content"] [data-cy="alert-incoming-call-reject"]`,
  //   )
  //   .click();
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator('[aria-label="reject"]').click();
  
  // focus ucAgentPage
  await ucAgentPage.bringToFront();
  await ucAgentPage.waitForTimeout(5000);
  await ucAgentPage
    .locator(
      `[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]`,
    )
    .click();
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator('[aria-label="reject"]').click();
  await ucAgentPage.bringToFront();
  await ucAgentPage.waitForTimeout(5000);
  // await ucAgentPage
  //   .locator(
  //     `[data-cy="alert-incoming-call-content"] [data-cy="alert-incoming-call-reject"]`,
  //   )
  //   .click();
  await ucAgentPage
    .locator(
      `[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]`,
    )
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // callback shows up on queue
  await page.bringToFront();
  await expect(
    page.locator(`#accordion-body-0:has-text("1 15807014029 Callback")`),
  ).toBeVisible();
  
  // call automatically hangs up
  await expect(page.locator(`:text-is("In Queue (1)")`)).toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("2406502927")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("SILVER SPG MD")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("1 15807014029 Callback")`),
  ).toBeVisible();
  
  // second caller in callback call
  await expect(page.locator(`:text("1 15807014029 Callback")`)).toBeVisible();
  
  // assert incoming call on uc agent with skill 71
  await ucAgentPage.bringToFront();
  await expect(
    ucAgentPage.locator(`[data-cy="alert-incoming-call-title-selector"]`),
  ).toBeVisible();
  await expect(
    ucAgentPage.locator(
      `[data-cy="alert-incoming-call-calling-number"]:has-text("5807014029")`,
    ),
  ).toBeVisible();
  await expect(
    ucAgentPage.locator(
      `[data-cy="alert-incoming-call-content"]:has-text("Skill 71")`,
    ),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // answer call
  await ucAgentPage.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  // assert call active
  await expect(ucAgentPage.locator(`:text("Call Active")`)).toBeVisible();
  await expect(ucAgentPage.locator(`xima-call .subtitle`)).toBeVisible(); //5807014029
  
  // end call
  await ucAgentPage.locator(`[data-cy="end-call-btn"]`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert call ended
  await expect(ucAgentPage.locator(`:text("Callback Call Ended")`)).toBeVisible();
  await expect(
    ucAgentPage.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  
  // both callers cleared from queue
  await page.bringToFront();
  await expect(page.locator(`:text-is("In Queue (0)")`)).toBeVisible({
    timeout: 2 * 60000,
  });
  await expect(
    page.locator(`#accordion-body-0:has-text("2406502927")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("SILVER SPG MD")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("5807014029")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`#accordion-body-0:has-text("ENID OK")`),
  ).not.toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! click the navigation button to access C2G
  await page.locator(`[data-cy="sidenav-menu-REPORTS"]`).click();
  
  //!! click the C2G tab
  await page.locator(`[data-cy="reports-c2g-component-tab-ctog"]`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // filter date
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  
  // first date of month to today
  await page.locator(`[aria-pressed="false"]:has-text("1") >> nth=0`).click();
  await page.locator(`[aria-current="date"]`).click();
  
  // select skill 71
  await page
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await page.locator(`[data-cy="checkbox-tree-property-select-all"]`).click();
  await page.locator(`[data-cy="checkbox-tree-property-select-all"]`).click();
  await page
    .locator(`[data-cy="checkbox-tree-property-option"]:has-text("Skill 71")`)
    .click();
  
  // apply
  await page.locator(`[data-cy="checkbox-tree-dialog-apply-button"]`).click();
  
  // filter agent -> stephanie agent
  await page.waitForTimeout(1000);
  await page
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await page.waitForTimeout(1000);
  await page
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Stephanie`);
  await page.waitForTimeout(1000);
  await page
    .locator(`[data-cy="xima-list-select-option-container"] div >> nth=0`)
    .click();
  
  // apply
  await page.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // apply
  await page
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  //!! click the "Start Timestamp" header to sort the results by Start Time
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  //!! click the first expand button to show the details of the most recent call
  await page
    .locator(`[data-cy="cradle-to-grave-table-expand-row-button"]`)
    .first()
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert first call is callback
  await expect(
    page.locator(`[data-cy="cradle-to-grave-table-cell-INFO"] >> nth=0`),
  ).toContainText(`Callback`);
  
  //!! expect the text "Ringing" in the event name cell to be visible
  await page
    .locator(`[data-cy="cradle-to-grave-table-expand-row-button"] >>nth=0`)
    .click();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Callback Attempt")`,
    ),
  ).toBeVisible();
  await page
    .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
    .first()
    .click();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Prompt")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Accepted")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Audio")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Offer")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Calling Drop")`,
    ),
  ).toBeVisible();
  
 // Step 2. Caller receives a callback and accepts
  
 // Step 3. Agent State - Queue Offer, then Talking, then Drop
  
 // Step 4. Call exists in C2G
  
});
import { buildUrl, getOutBoundNumber, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_simple_outbound_call_with_mute_and_hold", async () => {
 // Step 1. Login as WebRTC Agent 3 & Supervisor (agent initialize outbound...)
  //--------------------------------
  // Arrange:
  //--------------------------------
  //! Log in as WebRTC Agent 65 and Supervisor
  
  //!! Log in as WebRTC Agent 65 with specific browser arguments and permissions
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_65_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  //!! Toggle on skills for agent 3
  await page.bringToFront();
  await page.waitForTimeout(1000);
  await toggleSkillsOn(page, "8");
  
  //!! Click the agent status toggle button
  await page.waitForTimeout(1000);
  await toggleStatusOn(page);
  
  //!! Create a new browser context for Supervisor
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  
  //!! Open a new page under the created context
  const page2 = await context.newPage();
  
  //!! Navigate to the base url in the new page
  await page2.goto(buildUrl("/"));
  
  //!! Fill the username input with {SUPERVISOR_USERNAME}
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  
    //!! Fill the password input with {SUPERVISOR_PASSWORD}
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! Click the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! click the REALTIME_DISPLAYS menu
  await page2.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click 'Supervisor View' text item
  await page2.click(':text("Supervisor View")');
  
  //!! click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    await page2.locator(`[data-cy="supervisor-view-filter-title"]`).click();
    await page2.locator('[placeholder="Select type"]').click();
    await page2
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 1000 * 120 });
  
  //!! click the edit button for the first report preview parameter
  await page2.waitForTimeout(1000);
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // first select all agents
  // click checkbox
  let checkboxLocator = page2.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  let isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // then unselect all agents
  checkboxLocator = page2.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is checked, click it to uncheck
  if (isChecked) {
    await checkboxLocator.click();
  }
  
  // Fill agent we will call
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 65`);
  
  // click checkbox
  checkboxLocator = page2.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // Click apply
  await page2.waitForTimeout(1000);
  await page2.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // CLick apply
  await page2.waitForTimeout(1000);
  await page2.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Test interaction between WebRTC Agent 3's actions and visibility in the Supervisor view
  
  //!! Bring forth the agent's page
  await page.bringToFront();
  
  // get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  // make outbound call
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  await page.locator(`:text("New Call")`).click();
  await page.locator(`:text-is("Confirm")`).click();
  
  // type in outbound call
  await page
    .locator(`[data-cy="dialpad-text"] #phoneNumberInput`)
    .fill(`${outboundNumberToCall}`);
  
  // call outbound number
  await page.locator(`[data-cy="call-button"]`).click();
  
  // select correct skill
  await page.locator(`:text-is("Skill 8"):visible >> nth=-1`).click();
  
  //!! Bring forth the Supervisor's page
  await page2.bringToFront();
  
  //!! Check that the agent's status is "Talking"
  await expect(
    page2.locator('app-agent-status:has-text("WebRTC Agent 65") >> nth=0'),
  ).toContainText("Talking");
  
  //!! Bring forth the agent's page again and click the 'mute-btn' to mute and unmute the call
  await page.bringToFront();
  await page.click('[data-cy="mute-btn"]');
  await expect(page.locator('.actions [data-cy="mute-btn"]')).toBeVisible();
  await page.click('[data-cy="mute-btn"]');
  
  //!! Pause the call by clicking the 'hold-btn'
  await page.click('[data-cy="hold-btn"]');
  
  //!! Bring forth the Supervisor's page and check that the agent's status is "Hold"
  await page2.bringToFront();
  await expect(
    page2.locator('app-agent-status:has-text("WebRTC Agent 65") >> nth=0'),
  ).toContainText("Hold");
  
  //!! Reset filters: Click 'Escape', edit filters and click to select all agents, wait for a short duration and apply filter changes
  await page2.keyboard.press("Escape");
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page2.locator(`[data-cy="xima-list-select-select-all"]`).click();
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //!! Bring forth the agent's page and end the call by clicking the 'end-call-btn'
  await page.bringToFront();
  await page.click('[data-cy="end-call-btn"]');
  
  //!! Assert the 'After Call Work' alert visibility
  // await expect(
  //   page.locator('[data-cy="alert-after-call-work-title"]')
  // ).toHaveText("After Call Work");
  
  //!! Assert the 'finish-btn' visibility and click on it
  await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
  await page.click('[data-cy="finish-btn"]');
  
  //!! Switch the agent's status off by clicking the toggle button
  await page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    //!! Check that VOICE is inactive
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //! Log back in as Admin user and check call correctness
  //!! Bring forth the Supervisor's page
  await page2.bringToFront();
  
  //!! Navigate to Cradle to Grave report by expanding 'reports' and clicking on Cradle to Grave
  await page2.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await page2.locator(`:text("Cradle to Grave")`).click();
  
  //!! Open calendar and select today
  await page2.click('[aria-label="Open calendar"]');
  await page2.click(`.mat-calendar-body-cell :text-is("1")`);
  await page2.click(".mat-calendar-body-today");
  await page.waitForTimeout(1000);
  
  //!! Apply the date filter changes
  await page2.click('button:has-text("Apply")');
  await page2.waitForTimeout(5000);
  
  //!! Sort report by "START TIME" twice and wait for a short duration to ensure sorting is completed
  // expand last outbound call report
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await expect(page2.locator(`.mdc-linear-progress__bar-inner`)).toHaveCount(0);
  await page2.waitForTimeout(5000);
  
  //!! Open the details of the last outbound call in the report
  await page2.click(
    'mat-row:has-text("Call") :has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
  ); // if there are no results it might be because you have to change the date filter to one day behind - timezone issues.
  
  //!! Expect to see "Dialing", "Ringing", "Talking", "Hold" and "Drop" in the call details
  // await expect(page2.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Dialing")`)).toBeVisible();
  // await expect(page2.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")`)).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Hold")`,
    ),
  ).toBeVisible();
  await expect(
    page2.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Drop")`,
    ),
  ).toBeVisible();
  
 // Step 2. Simulate an outbound call through WebRTC UI (agent initialize outbound...)
  // Description:
 // Step 3. View Talking Agent as Supervisor (agent initialize outbound...)
  // Description:
 // Step 4. WebRTC Agent can mute a call (agent initialize outbound...)
  // Description:
 // Step 5. WebRTC Agent can put a call on hold (agent initialize outbound...)
  // Description:
 // Step 6. View Agent on Hold as Supervisor (agent initialize outbound...)
  // Description:
 // Step 7. View ACW timer (agent initialize outbound...)
  // Description:
 // Step 8. End Call (agent initialize outbound...)
  // Description:
 // Step 9. View Call in C2G (agent initialize outbound...)
  // Description:
});
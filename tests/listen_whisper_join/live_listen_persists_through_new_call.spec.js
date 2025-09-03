import { createCall, inputDigits, logInStaggeringSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("live_listen_persists_through_new_call", async () => {
 // Step 1. Enable Live Listen: Live Listen Persists through new call
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as a Staggering Supervisor and set permissions: microphone and camera
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInStaggeringSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  //! Load functions and objects from {shared}, and log in to the WebRTC agent with the given credentials and permissions.
  //!! log in to the WebRTC agent with given credentials and permissions, destructuring the returned objects to {browser}, {context}, and {page}
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_22_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  await page.waitForTimeout(3000);
  const emailCounter = await page
    .locator('.media-tile:not(:has-text("Test"))')
    .count();
  for (let i = 0; i < emailCounter; i++) {
    // click into active media that does not say Test
    await page.locator('.media-tile:not(:has-text("Test"))').first().click();
  
    // Click I Am Done
    try {
      await page
        .getByRole(`button`, { name: `I Am Done` })
        .click({ timeout: 5000 });
    } catch {
      console.log("No, I am done counter.");
    }
  
    try {
      // click close to cleanup call
      await page.getByRole(`button`, { name: `Close` }).click();
    } catch {
      // clean up email
      await page.locator(".mark-as-complete-container").click();
    }
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Select 'Supervisor View' and 'Agent' Type, add all agents, apply changes and initiate call monitoring on agent's 'WebRTC Agent 47'
  
  //!! click on 'REALTIME_DISPLAYS' in the side navigation menu
  await supervisorPage.bringToFront();
  await supervisorPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click 'Supervisor View' text item
  await supervisorPage.click(':text("Supervisor View")');
  
  //!! click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    await supervisorPage
      .locator(
        `[data-cy="supervisor-view-filter-title"] #mat-button-toggle-5-button`,
      )
      .click();
    await supervisorPage.locator('[placeholder="Select type"]').click();
    await supervisorPage
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 1000 * 120 });
  
  //!! click the edit button for the first report preview parameter
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // unselect all agents
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .check();
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .uncheck();
  
  // Fill agent we will call
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 22`);
  
  // click checkbox
  await supervisorPage.locator(`[data-cy="xima-list-select-select-all"]`).click();
  
  // Click apply
  await supervisorPage.waitForTimeout(2000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  
  // CLick apply
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  //!! click on the more menu of the agent "WebRTC Agent 22"
  await supervisorPage.click(
    'app-agent-status-container:has-text("WebRTC Agent 22") [data-cy="agent-tile-more-menu"]',
  );
  
  //!! click on the "Live Listen" option from the agent's more menu
  await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
  
  await expect(async () => {
    try {
      await expect(supervisorPage.locator(".LISTEN")).toBeVisible({
        timeout: 4000,
      });
    } catch {
      try {
        await supervisorPage.click(".confirm-replace", { timeout: 4000 });
      } catch {
        await supervisorPage.click(
          'app-agent-status-container:has-text("WebRTC Agent 22") [data-cy="agent-tile-more-menu"]',
        );
        await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
        await supervisorPage.click(".confirm-replace");
      }
    }
  }).toPass({ timeout: 120000 });
  
  //!! click the 'LISTEN' icon
  await supervisorPage.click(".LISTEN");
  
  //!! wait briefly for changes to take effect
  await supervisorPage.waitForTimeout(2000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that call monitoring is active with 'Whisper' and 'Join' options visible and save {supervisorPage}, {supervisorContext} and {supervisorBrowser}
  
  //!! expect that the text 'Call Monitoring Active:' is visible
  await expect(
    supervisorPage.locator("text=Call Monitoring Active:"),
  ).toBeVisible();
  
  //!! expect that the 'WHISPER' option is visible
  await expect(supervisorPage.locator(".WHISPER")).toBeVisible();
  
  //!! expect that the 'JOIN' option is visible
  await expect(supervisorPage.locator(".JOIN")).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Set the agent to 'READY' status, deactivate the VOICE and CHAT channels if they're active, set them to 'INACTIVE' if they're not. Create a call and then accept an incoming call.
  
  //!! click the toggle for call acceptance
  await page.bringToFront();
  await toggleSkill(page, 37);
  
  await toggleStatusOn(page);
  
  //!! assert that the CHAT channel is active
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! create a call, storing the call ID in {callId}
  let callId = await createCall({ number: "4352551621" });
  
  //!! log the call ID via {console.log}
  console.log("CALL ID: " + callId);
  
  //!! send input digits corresponding to {callId}
  await inputDigits(callId, [7]);
  
  //!! click to accept the incoming call option with forced click and a given delay and timeout
  await page.click('[data-cy="alert-incoming-call-accept"]', {
    force: true,
    delay: 500,
    timeout: 4 * 60 * 1000,
  });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Check if the agent status for 'WebRTC Agent 47' is 'Talking', and the 'WHISPER' and 'JOIN' functions are enabled. Store the current {page}, {context}, and {browser}.
  
  //!! bring the supervisor's page to the front
  await supervisorPage.bringToFront();
  
  //!! assert that the agent status for "WebRTC Agent 22" displays "Talking"
  await expect(
    supervisorPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 22") section :text("Talking")',
    ),
  ).toBeVisible();
  
  //!! check if the WHISPER function is enabled
  await expect(supervisorPage.locator(".WHISPER")).toBeEnabled();
  
  //!! check if the JOIN function is enabled
  await expect(supervisorPage.locator(".JOIN")).toBeEnabled();
  //! ----
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! End a call and finish after call work
  
  //!! Bring the current page to the front
  await page.bringToFront();
  
  //!! Click the end call button
  await page.click('[data-cy="end-call-btn"]');
  
  try {
    //!! Click the alert after call work done in the active media tiles container
    await page
      .locator(
        `[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]`,
      )
      .click({ timeout: 10000 });
  } catch (err) {
    console.log(err);
  }
  
  //!! Click the finish button
  await page.locator(`[data-cy="finish-btn"]`).click();
  
  //!! Bring the supervisor page to the front
  await supervisorPage.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify readiness of the agent and disablement of the whisper and join functions
  
  //!! Expect the text "WebRTC Agent 22" with status "Ready" to be visible in the agent status container on the supervisor page
  await expect(
    supervisorPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 22") section :text("Ready")',
    ),
  ).toBeVisible();
  
  //!! Expect the "whisper" function to be disabled on the supervisor page
  await expect(supervisorPage.locator(".WHISPER")).toBeDisabled();
  
  //!! Expect the "join" function to be disabled on the supervisor page
  await expect(supervisorPage.locator(".JOIN")).toBeDisabled();
  
  //! ----
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Set up a new live listen call path and enter call id as input digits.
  
  //!! bring the page to the front
  await page.bringToFront();
  
  //!! call the createCall function and assign the result to {callId}
  callId = await createCall({ number: "4352551621" });
  
  //!! log the {callId} to the console
  console.log("CALL ID: " + callId);
  
  //!! call the inputDigits function with {callId} and input [7]
  await inputDigits(callId, [7]);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! perform a series of actions on supervisorPage including accepting an incoming call, checking agents' status, stopping call monitoring, applying filters, and displaying specific call details.
  
  //!! expect the locator with 'alert-incoming-call-tag' to contain the text "Skill3" with a timeout of 60000 milliseconds
  await expect(page.locator('[data-cy="alert-incoming-call-tag"]')).toContainText(
    "Skill 37",
    { timeout: 60000 },
  );
  
  //!! click on the locator 'alert-incoming-call-accept' with force and a delay of 500 milliseconds
  await page.click('[data-cy="alert-incoming-call-accept"]', {
    force: true,
    delay: 500,
  });
  
  //!! bring the supervisorPage to the front
  await supervisorPage.bringToFront();
  
  //!! expect the supervisorPage locator containing the text "Talking" for "WebRTC Agent 22" to be visible
  await expect(
    supervisorPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 22") section :text("Talking")',
    ),
  ).toBeVisible();
  
  //!! expect the supervisorPage locator ".WHISPER" to be enabled
  await expect(supervisorPage.locator(".WHISPER")).toBeEnabled();
  
  //!! expect the supervisorPage locator ".JOIN" to be enabled
  await expect(supervisorPage.locator(".JOIN")).toBeEnabled();
  
  //!! click the text "End Call Monitoring" on the supervisorPage
  await supervisorPage.click(':text("End Call Monitoring")');
  
  //!! click on the supervisorPage locator with 'supervisor-view-filter-title'
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-title"]')
    .click();
  
  //!! click on the first supervisorPage locator under 'configure-report-preview-parameter-container'
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! click the checkbox input under the label "Select All Agents" on the supervisorPage
  await supervisorPage
    .locator('[type="checkbox"]:near(:text("Select All Agents"))>>nth=0')
    .evaluate((node) => node.click());
  
  //!! wait for 2 seconds
  await supervisorPage.waitForTimeout(2000);
  
  //!! click on the button with the text " Apply " on the supervisorPage
  await supervisorPage.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2 seconds
  await supervisorPage.waitForTimeout(2000);
  
  //!! click the 'supervisor-view-filter-apply-button' on the supervisorPage
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-apply-button"]')
    .click();
  
 // Step 2. Create a live listen call (Live Listen Persists thru new call)
  
 // Step 3. End a live listen call
  
 // Step 4. Create a new live listen call
  
});
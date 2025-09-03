import { createCall, inputDigits, logInStaggeringSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("whisper_turns_to_listen_on_call_change", async () => {
 // Step 1. Create a Call and Enable Whisper (Whisper turns to Listen on call change)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as a Supervisor "Manager 3   " (https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1684183581323679)
  const { page: supervisorPage } = await logInStaggeringSupervisor({
    username: process.env.MANAGER_2_USERNAME,
    password: process.env.MANAGERS_1_TO_4_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Login as the Listened WebRTC Agent
  const { page } = await logInWebRTCAgent(process.env.WEBRTCAGENT_32_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Login with a second agent with correct skill
  const { page: page2 } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_33_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // Enable Live Listen as the Supervisor
  await supervisorPage.bringToFront();
  await supervisorPage
    .locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]')
    .click(); //click the REALTIME_DISPLAYS menu
  
  // click 'Supervisor View' text item
  await supervisorPage.getByRole(`tab`, { name: `Supervisor View` }).click();
  
  // click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    await supervisorPage
      .locator(`[data-cy="supervisor-view-filter-title"]`)
      .click();
    await supervisorPage.locator('[placeholder="Select type"]').click();
    await supervisorPage
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 1000 * 120 });
  
  // click the edit button for the first report preview parameter
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // first select all agents
  // click checkbox
  let checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  let isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // then unselect all agents
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is checked, click it to uncheck
  if (isChecked) {
    await checkboxLocator.click();
  }
  
  // Fill agent we will call
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 32(`);
  
  // click checkbox
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // Fill agent we will call
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 33(`);
  
  // click checkbox
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // Click apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  
  // CLick apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  
  // wait for changes to settle
  await supervisorPage.waitForTimeout(1000);
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  // click on the more menu of the agent "WebRTC Agent 32"
  await supervisorPage
    .locator(
      'app-agent-status-container:has-text("WebRTC Agent 32") [data-cy="agent-tile-more-menu"]',
    )
    .click();
  
  // click on the "Live Listen" option from the agent's more menu
  await supervisorPage.locator('[data-cy="agent-more-menu-live-listen"]').click();
  
  await expect(async () => {
    try {
      await expect(supervisorPage.locator(".LISTEN")).toBeVisible();
    } catch {
      try {
        await supervisorPage.locator(".confirm-replace").click();
      } catch {
        await supervisorPage
          .locator(
            'app-agent-status-container:has-text("WebRTC Agent 32") [data-cy="agent-tile-more-menu"]',
          )
          .click();
        await supervisorPage
          .locator('[data-cy="agent-more-menu-live-listen"]')
          .click();
        await supervisorPage.locator(".confirm-replace").click();
      }
    }
  }).toPass({ timeout: 120000 });
  
  // click the 'LISTEN' icon
  await supervisorPage.locator(".LISTEN").click();
  
  // wait briefly for changes to take effect
  await supervisorPage.waitForTimeout(2000);
  
  // toggle skill 47
  await page.bringToFront();
  await page.waitForTimeout(1000);
  await toggleSkill(page, 47);
  
  // Toggle Agent status to Ready
  await page.waitForTimeout(1500);
  await toggleStatusOn(page);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Simulate a call for this agent
  let callId = await createCall({
    number: "4352551622",
  });
  console.log("CALL ID: " + callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [7]);
  
  // WebRTC Agent able to answer incoming call on UI
  await page.locator('button:has-text("Answer Call")').click({
    timeout: 3 * 60 * 1000,
  });
  
  // On supervisor page, click Whisper icon
  await supervisorPage.bringToFront();
  await supervisorPage.locator(".WHISPER").click();
  
  // On agent page, click "Ok" on confirmation modal that Supervisor is on the call
  await page.bringToFront();
  await page.locator(':text("Ok")').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // On agent page, Supervisor name is under Active Media with "Whispering"
  await expect(
    page.locator(':text("Whispering"):below(:text("Manager 2"))'),
  ).toBeVisible();
  
  // On supervisor page, the call monitoring tool remains open with "Whisper" still selected
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).toBeVisible();
  
 // Step 2. End Call (Whisper turns to Listen on call change)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Bring Agent page to the front
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Hang up phone Icon
  await page.locator('[data-cy="end-call-btn"]').click();
  await supervisorPage.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert changes to listen
  await expect(
    supervisorPage.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  
 // Step 3. Create a new Call (Whisper turns to LIsten on call change)
  //--------------------------------
  // Arrange:
  //--------------------------------
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Simulate another call for this agent
  try {
    await page.locator('[data-cy="alert-after-call-work-done"]').click();
    await page.locator('[data-cy="finish-btn"]').click();
  } catch (err) {
    console.log(err);
  }
  
  await expect(async () => {
    let callId = await createCall({
      number: "4352551622",
    });
  
    console.log("CALL ID: " + callId);
  
    await inputDigits(callId, [7]);
  
    await expect(
      page.locator('[data-cy="alert-incoming-call-calling-number"]'),
    ).toBeVisible();
  
    await page.waitForTimeout(1000);
  
    await page.locator('[data-cy="alert-incoming-call-calling-number"]').click();
  }).toPass({ timeout: 1000 * 240 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // On supervisor page, supervisor gets set to a 'listen' state
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).not.toBeVisible();
  
 // Step 4. Change Call (Whisper turns to Listen on call change)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Toggle skill 47
  await page2.bringToFront();
  await page2.waitForTimeout(2000);
  await toggleSkill(page2, "47");
  
  // Toggle Agent status to Ready
  await page.waitForTimeout(2000);
  await toggleStatusOn(page2);
  
  // Bring First Agent Page to the Front
  await page.bringToFront();
  try {
    await page.locator(':text("Ok")').click({ timeout: 10000 });
  } catch (err) {
    console.log(err);
  }
  
  // click accept call
  await page.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Transfer icon
  await page.locator('[data-cy="transfer-btn"]').click();
  
  // Click the Single Agent Icon on Transfer Call modal
  await page.locator('[role="tab"]:has([data-mat-icon-name="agent"])').click();
  
  // Select Agent to Transfer call to
  await page.getByText(`WebRTC Agent 33`).click();
  
  // Click the 'Blind Transfer' option
  await page.locator(':text("Blind Transfer")').click();
  
  // Answer Call as second agent
  await page2.bringToFront();
  await page2.locator('button:has-text("Answer Call")').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Supervisor gets put in listen mode after call change
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).not.toBeVisible();
  
  // end the call
  await supervisorPage.locator(':text("End Call Monitoring")').click();
  
  // end Agent 33 call
  await page2.bringToFront();
  await page2.locator('[data-cy="end-call-btn"]').click();
  await page2.locator('[data-cy="finish-btn"]').click();
  
  // Close pages
  await page.close();
  await page2.close();
  await supervisorPage.close();
  
});
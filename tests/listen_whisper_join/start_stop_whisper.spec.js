import { createCall, inputDigits, logInSupervisor, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("start_stop_whisper", async () => {
 // Step 1. Start Whisper
  //--------------------------------
  // Arrange:
  //--------------------------------
  const username = "Manager 2";
  const pass = "Password07272023!";
  const phone_nubmer = "4352551622";
  const skillId = 45;
  const inputDigit = 5;
  
  // Login as a Supervisor "Manager 1" (https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1684183581323679)
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInSupervisor({
    username: username,
    password: pass,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Login as the Listened WebRTC Agent
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_29_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Assert Logged in Successfully
  await supervisorPage.bringToFront();
  await expect(supervisorPage.locator(':text("M2")')).toBeVisible();
  
  // Click the 'Realtime Displays' sidebar option
  await supervisorPage
    .locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]')
    .click();
  
  // Click the 'Supervisor View' option
  await supervisorPage.locator("#mat-tab-link-3").click();
  
  // set the filter to show the correct agent ( in this case WebRTC Agent 29 )
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-title"]`)
    .click();
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
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
    .fill(`WebRTC Agent 29`);
  
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
  await supervisorPage.waitForTimeout(2000);
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  // Assert agents are visible
  await expect(
    supervisorPage.locator('.agent-status-fullname:has-text("WebRTC Agent 29")'),
  ).toBeVisible({ timeout: 5000 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Click the kebab menu button on an Agent
  await supervisorPage
    .locator(
      'app-agent-status-container:has-text("WebRTC Agent 29") [data-cy="agent-tile-more-menu"]',
    )
    .click();
  
  // Click the 'Call Monitoring' option
  await supervisorPage.waitForTimeout(3000);
  await expect(
    supervisorPage.locator('[data-cy="agent-more-menu-live-listen"]'),
  ).toBeVisible();
  await supervisorPage.waitForTimeout(3000);
  await supervisorPage
    .locator('[data-cy="agent-more-menu-live-listen"]')
    .click({ delay: 500 });
  try {
    await supervisorPage.locator(`.confirm-replace`).click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  try {
    await expect(
      supervisorPage.locator("span:text-is('Call Monitoring Active:')"),
    ).toBeVisible({ timeout: 4000 });
  } catch {
    await supervisorPage
      .locator(
        'app-agent-status-container:has-text("WebRTC Agent 29") [data-cy="agent-tile-more-menu"]',
      )
      .click();
    await supervisorPage.waitForTimeout(3000);
    await expect(
      supervisorPage.locator('[data-cy="agent-more-menu-live-listen"]'),
    ).toBeVisible();
    await supervisorPage.waitForTimeout(3000);
    await supervisorPage
      .locator('[data-cy="agent-more-menu-live-listen"]')
      .click({ delay: 500 });
    try {
      await supervisorPage.locator(`.confirm-replace`).click();
    } catch (err) {
      console.log(err);
    }
  }
  
  // Click the "Listen" headphones icon
  try {
    await supervisorPage.locator(".LISTEN").click({ timeout: 5000 });
  } catch {
    await expect(
      supervisorPage.locator(':text("Replace Supervisor")'),
    ).toBeVisible();
    await supervisorPage.locator(".confirm-replace").click();
    await supervisorPage.locator(".LISTEN").click();
  }
  // Assert Able to Live Listen to the call, and have the whisper and Join options
  await expect(
    supervisorPage.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  await expect(supervisorPage.locator(".WHISPER")).toBeVisible();
  await expect(supervisorPage.locator(".JOIN")).toBeVisible();
  
  // Toggle skill to 45
  await page.bringToFront();
  await toggleSkillsOn(page, skillId);
  
  // Toggle Agent status to Ready
  await toggleStatusOn(page);
  
  // Simulate a call for this agent
  let callId = await createCall({
    number: phone_nubmer,
  });
  
  // Click the 'Answer Call' button
  await inputDigits(callId, [inputDigit]);
  await page.locator('[data-cy="alert-incoming-call-accept"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // On supervisor page, click Whisper icon
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).not.toBeVisible();
  await supervisorPage.locator(".WHISPER").click();
  // assert the "Whisper" button highlights
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).toBeVisible();
  // assert the microphone icon becomes selectable
  await expect(supervisorPage.locator(".mute")).not.toHaveAttribute(
    "disabled",
    "true",
  );
  
  // assert the microphone icon is muted by default
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic-muted"]'),
  ).toBeVisible();
  // On agent page,
  await page.bringToFront();
  // assert the agent receives a pop up notification that the supervisor is whispering
  await expect(
    page.locator('h2:text("Supervisor Whisper Active"):visible>>nth=0'),
  ).toBeVisible();
  // click "Ok" on confirmation modal that Supervisor is on the call
  await page.locator('button:has-text("Ok"):visible>>nth=-1').click();
  
  // Assert:
  // Assert on agent page, Supervisor name is under Active Media with "Whispering"
  await expect(
    page.locator('[data-cy="active-media-tile"] :text("Manager 2")'),
  ).toBeVisible();
  await expect(
    page.locator('[data-cy="active-media-tile"] :text("Whispering")'),
  ).toBeVisible();
  
 // Step 2. Stop Whisper
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Assert on supervisor page, the supervisor can toggle the mute microphone on and off
  await supervisorPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Unmute microphone and assert
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic-muted"]')
  ).toBeVisible();
  await supervisorPage.locator('.mute').click();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic"]')
  ).toBeVisible();
  
  // mute microphone and assert
  await supervisorPage.locator('.mute').click();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic-muted"]')
  ).toBeVisible();
  
  // Act:
  // On supervisor page, click/disable the "Whisper" icon
  await supervisorPage.locator(".WHISPER").click();
  await expect(supervisorPage.locator('[data-mat-icon-name="whisper-selected"]')).not.toBeVisible()
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // On supervisor page, mute button returns to a grayed out/disabled state
  await expect(supervisorPage.locator('.mute')).toHaveAttribute('disabled', 'true')
  await supervisorPage.locator(':text("End Call Monitoring")').click();
  
  // On agent page, "Whispering" active media card disappears from agent's CCAC
  await page.bringToFront();
  await expect(page.locator('[data-cy="active-media-tile"] :text("Manager 2")')).not.toBeVisible();
  await expect(page.locator('[data-cy="active-media-tile"] :text("Whispering")')).not.toBeVisible();
  
  // End call and Toggle RTC Agent to DND, logout
  try {
    await page.locator('[data-cy="end-call-btn"]').click({ timeout: 5000 });
    await page.getByRole(`button`, { name: `I Am Done` }).click();
  } catch  { 
    console.log("Call already ended");
  }
  try {
    await page.getByRole(`button`, { name: `Close` }).click({ timeout: 10 * 1000 });
  } catch (err) { 
    console.log("No call to cleanup");
  }
  
  await page.locator(`app-channel-states`).getByRole(`button`).first().click();
  await page.getByRole(`menuitem`, { name: `Break` }).click();
  await page.locator(`app-channel-states`).getByRole(`button`).first().click({force: true, delay: 500});
  await page.getByRole(`menuitem`, { name: `Logout` }).click();
});
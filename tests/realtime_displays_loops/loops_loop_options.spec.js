import { createCall, inputDigits, logInSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("loops_loop_options", async () => {
 // Step 1. Edit Loop
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  /**
   * This WF was in the middle of the audit, but was blocked by this bug:
   * https://app.qawolf.com/xima/bug-reports/451a34e6-844c-4ce7-9dad-57156eba6a33
   *
   * When this bug is closed, please ping @Zaviar Brown in slack
   */
  
  // throw "Blocked";
  
  // login
  const { page, context, browser } = await logInSupervisor({ slowMo: 2000 });
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Login as an Agent with skills being tracked by wallboard
  const {
    browser: browser2,
    context: context2,
    page: page2,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_4_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // navigate to loops
  await page.bringToFront();
  await page.waitForTimeout(3000);
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Loops")');
  
  // assert on loops page
  await expect(page).toHaveURL(/loops/);
  await expect(page.locator('button:has-text("Create a Loop")')).toBeVisible();
  
  // cleanup
  const loop = await page.locator(':text("Loop options")').count();
  for (let i = 0; i < loop; i++) {
    await page.click(`.cdk-row:has-text("Loop options") button >> nth=1`);
    await page.click('button:has-text("Delete")');
    await expect(
      page.locator(`.cdk-row:has-text("Loop options")`),
    ).not.toBeVisible();
  }
  
  // create a new loop
  await page.waitForTimeout(5000);
  let loopName = `Loop options ${process.env.QAWOLF_RUN_ID || Date.now()}`;
  await page.click('button:has-text("Create a Loop")');
  await page.fill("input", loopName);
  await page.waitForTimeout(5000);
  await page.click(".add-new-wallboard");
  
  // If the test fails here, the test may be moving too fast
  await page.waitForTimeout(5000);
  await page.click('[formcontrolname="wallboardId"]');
  await page.click(':text("Testing Loop Options")');
  await page.click('[formcontrolname="durationSeconds"]');
  await page.click(':text("1 minute")');
  await page.click('button:has-text("Apply")');
  
  // assert loop was created
  await expect(page.locator(`.cdk-row:has-text("${loopName}")`)).toBeVisible();
  
  // click edit loop
  await page.click(`.cdk-row:has-text("${loopName}") button >> nth=1`);
  
  // change loop name
  loopName = "Updated " + loopName;
  await page.click('button:has-text("Edit")');
  await page.fill("input", loopName);
  await page.click('button:has-text("Apply")');
  
  // click open loop
  await page.click(`.cdk-row:has-text("${loopName}") button >> nth=1`);
  await page.click('button:has-text("Open")');
  
  // assert loop opens
  await expect(page.locator(`h3:has-text("${loopName}")`)).toBeVisible();
  await expect(page.locator('button:has-text("Full Screen")')).toBeVisible();
  
  // click generate external view link
  await page.click(".feather-arrow-left");
  await page.click(`.cdk-row:has-text("${loopName}") button >> nth=1`);
  await page.click('button:has-text("Generate External View Link")');
  
  // assert link leads to valid page
  const url = await page.locator("textarea").inputValue();
  const viewPage = await context.newPage();
  await viewPage.goto(url);
  await expect(viewPage.locator(`h3:has-text("${loopName}")`)).toBeVisible();
  await expect(viewPage.locator('button:has-text("Full Screen")')).toBeVisible();
  
  // toggle on Skill 32
  await page2.bringToFront();
  await toggleSkill(page2, "32");
  
  // mark agent as ready
  await toggleStatusOn(page2);
  
  // Act:
  // Create a call for the agent
  await page.waitForTimeout(10000);
  let callId = await createCall({
    number: "4352551621",
  });
  console.log("CALL ID: " + callId);
  await inputDigits(callId, [2]);
  
  // assert received call for SKill 32
  await expect(
    page2.locator('[data-cy="alert-incoming-call-content"]:has-text("Skill 32")'),
  ).toBeVisible({ timeout: 60000 });
  
  // assert 1 in Queue for Skill 32
  await viewPage.bringToFront();
  await expect(viewPage.locator("gridster-item:nth-of-type(19)")).toHaveText(
    "Calls in Queue: Skill 32 0  5,000 1",
  );
  
  // Click the 'Answer Call' button
  await page2.bringToFront();
  await page2.click('[data-cy="alert-incoming-call-accept"]', {
    force: true,
    delay: 500,
  });
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="end-call-btn"]').click();
  await page2.locator('[data-cy="finish-btn"]').click();
  
  // Assert:
  // Realtime Metrics within external linked wallboard update correctly
  await viewPage.bringToFront();
  await expect(viewPage.locator("gridster-item:nth-of-type(19)")).toHaveText(
    "Calls in Queue: Skill 32 0  5,000 0",
  );
  await viewPage.waitForTimeout(2000);
  
  // click delete
  await page.bringToFront();
  await page.click(".feather-x");
  await page.click(`.cdk-row:has-text("${loopName}") button >> nth=1`);
  await page.click('button:has-text("Delete")');
  
  // assert loop was deleted
  await expect(
    page.locator(`.cdk-row:has-text("${loopName}")`),
  ).not.toBeVisible();
  
 // Step 2. Generate External View Link for Loop
  // Description:
 // Step 3. View Updated Wallboard on Edit
  // Arrange:
  // Login as an Agent with skills being tracked by wallboard
  
  // Act:
  // Create a call for the agent
  
  // Answer call 
  
  // Assert: 
  // Realtime Metrics within external linked wallboard update correctly 
  
});
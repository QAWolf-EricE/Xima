import { buildUrl, getOutBoundNumber, logInWebRTCAgent, recordingMode } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("recording_disabled_recording", async () => {
 // Step 1. Take call with "Disabled Recording" setting
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as agent 70 "WebRTC" with special browser arguments and permissions
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_70_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  // Create a new browsing context in preparation for the supervisor
  const context = await browser.newContext();
  
  // Create a new page, {page2}, in the new browsing context
  const page2 = await context.newPage();
  
  // Navigate to the base url on {page2}
  await page2.goto(buildUrl("/"));
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Fill the username field with the supervisor's username
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME
  );
  
  // Fill the password field with the supervisor's password
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD
  );
  
  // Click on the Login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // Disable the recording for agent 70
  await recordingMode(page2, "Disabled", "WebRTC Agent 70");
  
  // Bring the agent's page to the front
  await page.bringToFront();
  
  // Click on the status toggle to make the agent ready
  if (!(await page.locator('[data-cy="channel-state-label"]:has-text("Ready")').isVisible())) {
    await page.locator('[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])').click();
    await page.getByRole(`menuitem`, { name: `Ready` }).click();
  }
  
  // Bring the agent's page to the front again
  await page.bringToFront();
  
  // Click on the "active media" button to start the call
  await page.locator('[data-cy="active-media-menu-button"]').click();
  
  // Click on the "New Call" button
  await page.locator(`[role="menu"] :text-is("New Call")`).click();
  
  // Click on the "Confirm" button
  await page.click('button:has-text("Confirm")');
  
  // Click on the phone number input field
  await page.click("#phoneNumberInput");
  
  // get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber()
  
  // Type the phone number 
  await page.keyboard.type(`${outboundNumberToCall}`);
  
  // Click on the call button
  await page.click('[data-cy="call-button"]');
  
  // Read and save the call number in {callNumber}
  const callNumber = await page.innerText('xima-dialog .title >> nth = 0');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the call recording is not active 
  await expect(page.locator(':text("Call Recording: ACTIVE")')).not.toBeVisible();
  
  // Assert that the recording toggle is not visible
  await expect(
    page.locator('mat-icon[mattooltip="Toggle Recording"]')
  ).not.toBeVisible();
  
  
 // Step 2. Confirm no recording for 'disabled recording' call as supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Bring the supervisor's page to the front to check the recording
  await page2.bringToFront();
  
  // Wait for 10 seconds 
  await page2.waitForTimeout(10 * 1000);
  
  // Click on the "reports" icon
  await page2.click('[data-mat-icon-name="reports"]');
  
  // Click on the "Cradle to Grave" report
  await page2.click(':text("Cradle to Grave")');
  
  // Click on the edit button for the "Agent" field in "Cradle to Grave"
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
  
  // Fill the search input with "Disabled"
  await page2.fill('[formcontrolname="searchInput"]', "Disabled");
  
  // Click on the select option that contains the text "WebRTC Agent 70"
  await page2.click('[data-cy="xima-list-select-option-container"]:has-text("WebRTC Agent 70")');
  
  // Click on the "Apply" button
  await page2.click('[class*="overlay"] button:has-text("Apply")');
  
  // Click on the "Apply" button to confirm the filter
  await page2.click('button:has-text("Apply")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that there is no recording next to the current call
  await expect(
    page2.locator(
      `mat-row:has-text("${callNumber}") mat-icon:has-text("play_circle_outline")`
    )
  ).not.toBeVisible();
  
  // Bring the agent's page to the front to end the call
  await page.bringToFront();
  
  // Close popup if needed
  try {
    await page.getByRole("button", { name: "Close" }).click({ timeout: 5 * 1000 });
  } catch { console.log("No popup present.") }
  
  // Click on the "End Call" button with duration delay
  await page.click('[data-cy="end-call-btn"]', { force: true, delay: 500 });
  
  // Click on the "Finish" button with duration delay
  await page.click('[data-cy="finish-btn"]', { force: true, delay: 500 });
  
});
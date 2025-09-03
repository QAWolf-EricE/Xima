import { buildUrl, logUCAgentIntoUCWebphone, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_inbound_direct_to_agent", async () => {
 // Step 1. Login as UC Agent & Supervisor (inbound call presented, no skills)
  //--------------------------------
  // Arrange:
  //-------------------------------
  //! Login as Xima Agent and setup web phone
  //!! launch a browser with specific configurations, destructuring the result to {context} and {browser}
  const { context, browser } = await launch({
    email: process.env.UC_AGENT_20_EXT_120,
    password: process.env.UC_AGENT_20_EXT_120_PASSWORD,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
    permissions: ["camera", "clipboard-read", "clipboard-write", "microphone"],
  });
  
  //!! create a new page, destructuring the result to {page}
  const page = await context.newPage();
  
  //!! navigate to the application main page using {buildUrl}
  await page.goto(buildUrl("/"));
  
  //!! fill the agent username input field with the value of environment variable UC_AGENT_20_EXT_120
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.UC_AGENT_20_EXT_120,
  );
  
  //!! fill the agent password input field with the value of environment variable UC_AGENT_20_EXT_120_PASSWORD
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.UC_AGENT_20_EXT_120_PASSWORD,
  );
  
  //!! perform login by clicking the login button
  await page.click('[data-cy="consolidated-login-login-button"]');
  
  //!! hover over the "Launch" side navigation menu
  await page.waitForTimeout(5000);
  await page.locator(`[data-cy="sidenav-menu-LAUNCHER"]`).hover();
  
  await page.waitForTimeout(5000);
  //!! wait for a popup event to occur and open the "Agent Client" in a new tab
  
  const [agentPage] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole(`button`, { name: `Agent Client` }).click(),
  ]);
  
  await agentPage.waitForLoadState();
  
  //!! wait for the Agent Client page to load
  await agentPage.waitForLoadState("domcontentloaded");
  
  //!! bring the Agent Client page to the front
  await agentPage.bringToFront();
  
  //!! set the web phone URL to {webPhoneURL}
  const webPhoneURL = `https://voice.ximasoftware.com/webphone`;
  
  //!! create a new web phone page, destructuring the result to {webPhonePage}
  const { ucWebPhonePage: webPhonePage } = await logUCAgentIntoUCWebphone(
    context,
    process.env.UC_AGENT_20_EXT_120_WEBPHONE_USERNAME,
    { webphonePassword: process.env.UC_AGENT_20_EXT_120_PASSWORD },
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Login as Supervisor, toggle Agent status to Ready
  
  //!! create a new browser context, destructuring the result to {context}
  const context2 = await browser.newContext({ timezoneId: "America/Denver" });
  
  //!! create a new page, destructuring the result to {page2}
  const page2 = await context2.newPage();
  
  //!! navigate to the application main page in the new page using {buildUrl}
  await page2.goto(buildUrl("/"));
  
  //!! fill the supervisor username input field with the value of environment variable SUPERVISOR_USERNAME
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! fill the supervisor password input field with the value of environment variable SUPERVISOR_PASSWORD
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! perform login with the Supervisor account by clicking the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! bring the Agent Client page to the front
  await agentPage.bringToFront();
  
  //!! toggle the Agent status to Ready
  await agentPage
    .locator(
      `[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])`,
    )
    .click({ force: true });
  await agentPage.getByRole(`menuitem`, { name: `Ready` }).click();
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify Agent Status, Check VOICE and CHAT icons color, Save all pages to {shared}
  
  //!! check if the agent status is "Ready"
  await expect(agentPage.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  await toggleStatusOn(agentPage);
  
  //!! check if the VOICE icon color is "rgb(49, 180, 164)"
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 200000 });
  
  //!! check if the CHAT icon color is "rgb(49, 180, 164)"
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 200000 });
  
  //! ----
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Simulate an incoming call and log Call ID
  
  //!! Send a POST request to "https://livecallgeneration.ximasoftware.com/rest/calls/create" to simulate an incoming call direct to agent
  let response = await axios.post(
    "https://livecallgeneration.ximasoftware.com/rest/calls/create",
    {
      number: "4352003973",
      count: "1",
      timeout: "120",
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        "xima-token": process.env.XIMA_TOKEN,
      },
    },
  );
  
  //!! Extract and store the Call ID from the response data
  let callId = response.data.callIds[0];
  
  //!! Log the Call ID
  console.log("CALL ID: " + callId);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Answer the incoming call and navigate back to the dashboard
  
  //!! Bring the WebPhone page to the front
  await webPhonePage.bringToFront();
  
  //!! Click on the answer button
  try {
    await webPhonePage.locator(`button:has(+ p:text-is("ANSWER"))`).click();
  } catch {
    //!! Send a POST request to "https://livecallgeneration.ximasoftware.com/rest/calls/create" to simulate an incoming call direct to agent
    let response = await axios.post(
      "https://livecallgeneration.ximasoftware.com/rest/calls/create",
      {
        number: "4352003973",
        count: "1",
        timeout: "120",
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          "xima-token": process.env.XIMA_TOKEN,
        },
      },
    );
  
    //!! Extract and store the Call ID from the response data
    let callId = response.data.callIds[0];
  
    //!! Log the Call ID
    console.log("CALL ID: " + callId);
    await webPhonePage.locator(`button:has(+ p:text-is("ANSWER"))`).click();
  }
  
  //!! Bring the agent dashboard to the front
  await agentPage.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that the call is active
  
  //!! Expect the "Call Active" text to be visible on the agent dashboard
  await expect(
    agentPage.locator(`xima-call span:has-text("Call Active")`),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Load shared pages and navigate to web phone page
  
  //!! Bring the web phone page to the front
  await webPhonePage.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! End the call from web phone page, and set agent to "Break" status
  
  //!! Click the "Hang Up" button on the web phone page
  await webPhonePage.locator(`[data-testid="CallEndIcon"]:visible`).click();
  
  //!! Bring the dashboard page (agentPage) to the front
  await agentPage.bringToFront();
  
  await agentPage.locator(`[data-cy="finish-btn"]`).click();
  
  await expect(async () => {
    //!! Click the "Unready Agent" button
    await agentPage
      .locator(
        `[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])`,
      )
      .click({ force: true });
  
    //!! Select "Break" for the "Do Not Disturb" reason
    await agentPage.getByRole(`menuitem`, { name: `Break` }).click();
  }).toPass({
    timeout: 120 * 1000,
  });
  
  //!! Click the "Submit" button for "Do Not Disturb"
  // await agentPage.locator(`[data-cy="alert-dnd-submit-button"]`).click();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that call ended and agent is not ready for either voice or chat
  
  //!! Expect the text "Inbound Call Ended" to be visible, signifying the call has ended
  // await expect(agentPage.locator("text=Inbound Call Ended")).toBeVisible();
  
  //!! Click the "Finish" button
  // await agentPage.locator(`[data-cy="finish-btn"]`).click();
  
  //!! Expect the voice channel status icon not to be green, indicating the agent is not ready for voice
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Expect the chat channel status icon not to be green, indicating the agent is not ready for chat
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  //! ----
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Set up the "Admin" user and filter to "UC Agent" in "Cradle to Grave" for "Xima Agent 20"
  
  //!! bring Admin user to the front
  await page2.bringToFront();
  
  //!! hover over the list item that has the "reports" icon
  await page2.hover('[data-cy="sidenav-menu-REPORTS"]');
  
  //!! click the menu item with text "Cradle to Grave"
  await page2.click(':text-is("Cradle to Grave")');
  
  //!! click the edit button in the "configure-report-preview-parameter-PBX_USERS" input field
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
  
  //!! fill the list-select search input with "Xima Agent 20"
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 20`);
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! click the pseudo-checkbox in the option container
  await page2
    .locator(`[data-cy="xima-list-select-option"] :text("Xima Agent 20(120)")`)
    .click();
  
  //!! click the "Apply" button in the "agents-roles-dialog"
  await page2.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! perform a blank mouse click
  await page2.mouse.click(0, 0);
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! click the "Apply" button
  await page2.click('button:has-text("Apply")');
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Expand last inbound call report
  
  //!! click the header container with the text "START TIME"
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  
  //!! click the header container with the text "START TIME" again
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the 0th element of the chevron-closed icon in an Inbound row
  try {
    await page2
      .locator(
        'mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
      )
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that "Ringing", "Talking" and "Drop" text exist in the open-detail
  
  //!! expect the open detail to contain the text "Ringing"
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Ringing") >> nth=0`),
  ).toBeVisible();
  
  //!! expect the open detail to contain the text "Talking"
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Talking") >> nth=0`),
  ).toBeVisible();
  
  //!! expect the open detail to contain the text "Drop"
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Drop") >> nth=0`),
  ).toBeVisible();
  
 // Step 2. Simulate an incoming call & Answer call (inbound call presented, no skills)
  
 // Step 3. UC Agent can drop a call (inbound call presented, no skills)
  
 // Step 4. View Call in C2G (inbound call presented, no skills)
  
});
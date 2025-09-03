import { buildUrl, createCall, inputDigits, logInAgent, logUCAgentIntoUCWebphone, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_inbound_blind_transfer_to_uc_agent_using_agent_selector", async () => {
 // Step 1. Login as UC Agent & another agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in UC Agent 4 with media stream permissions
  const {
    page: agentPage,
    browser,
    context,
  } = await logInAgent({
    email: process.env.UC_AGENT_4_EXT_104,
    password: process.env.UC_AGENT_4_EXT_104_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Log in UC Agent 5 with media stream permissions
  const { page: secondUCAgentPage, context: secondUCAgentContext } =
    await logInAgent({
      email: process.env.UC_AGENT_5_EXT_105,
      password: process.env.UC_AGENT_5_EXT_105_PASSWORD,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Create a new browser context for the Supervisor and log in
  const supervisorContext = await browser.newContext();
  const supervisorPage = await supervisorContext.newPage();
  await supervisorPage.bringToFront(); // Ensure the Supervisor page is active
  await supervisorPage.goto(buildUrl("/")); // Navigate to the base URL
  
  // Fill in Supervisor credentials and log in
  await supervisorPage.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  await supervisorPage.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  await supervisorPage
    .locator('[data-cy="consolidated-login-login-button"]')
    .click();
  
  // Configure the Supervisor filter and select agents
  await supervisorPage
    .locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]')
    .click(); // Open REALTIME_DISPLAYS menu
  await supervisorPage.getByRole("tab", { name: "Supervisor View" }).click(); // Switch to Supervisor View
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-title"]')
    .click(); // Open filter panel
  await supervisorPage.mouse.click(0, 0); // Unfocus menu
  await supervisorPage.locator('[placeholder="Select type"]').click(); // Open type selection
  await supervisorPage
    .locator(`[id*='mat-option']:has-text("Agent")`)
    .click({ force: true }); // Select the "Agent" option
  
  // Wait until the report preview container is visible before clicking edit
  await supervisorPage
    .locator('[data-cy="configure-report-preview-parameter-container"]')
    .first()
    .waitFor();
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click(); // Click edit button for the first report preview parameter
  
  // Clear any previous agent selections
  await supervisorPage.waitForTimeout(2000);
  let checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"] >> input`,
  );
  await expect(checkboxLocator).toBeVisible();
  if (await checkboxLocator.isChecked()) {
    await checkboxLocator.click(); // Uncheck if already selected
  }
  
  // Select "Xima Agent 4"
  // Fill the search input for Agent 4 and wait for the checkbox to become available
  await supervisorPage
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Xima Agent 4");
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] >> input`)
    .waitFor({ state: "attached" });
  await supervisorPage.waitForTimeout(1500);
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"] >> input`,
  );
  if (!(await checkboxLocator.isChecked())) {
    await checkboxLocator.click(); // Check the box for Agent 4
  }
  
  // Select "Xima Agent 5"
  // Fill the search input for Agent 5 and wait for the checkbox update
  await supervisorPage
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Xima Agent 5");
  await supervisorPage
    .locator('[data-cy="xima-list-select-search-input"]')
    .waitFor({ state: "attached" });
  await supervisorPage.waitForTimeout(1500);
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"] >> input`,
  );
  if (!(await checkboxLocator.isChecked())) {
    await checkboxLocator.click(); // Check the box for Agent 5
  }
  
  // Apply the agent selection and filter settings
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .waitFor();
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .waitFor();
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  // Wait for filter changes to be attached in the DOM
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-title"]')
    .waitFor({ state: "attached" });
  
  // Set both UC agents to 'Ready' status
  
  // For Agent 4:
  await agentPage.bringToFront(); // Activate Agent 4's page
  await toggleSkill(agentPage, "79"); // Toggle skill for Agent 4
  
  //await toggleStatusOn(agentPage);
  
  // Set status to 'Ready'
  await agentPage
    .locator(`app-channel-states`)
    .getByRole(`button`)
    .first()
    .click();
  try {
    await agentPage
      .getByRole(`menuitem`, { name: `Ready` })
      .click({ timeout: 3_000 });
  } catch {
    // Already set to ready
    await agentPage.mouse.click(250, 40); // Click off of menu
  }
  
  // For Agent 5:
  await secondUCAgentPage.bringToFront(); // Activate Agent 5's page
  await toggleSkill(secondUCAgentPage, "61"); // Toggle skill for Agent 5
  //await toggleStatusOn(secondUCAgentPage); // Set status to 'Ready'
  // Set status to 'Ready'
  await secondUCAgentPage
    .locator(`app-channel-states`)
    .getByRole(`button`)
    .first()
    .click();
  try {
    await secondUCAgentPage
      .getByRole(`menuitem`, { name: `Ready` })
      .click({ timeout: 3_000 });
  } catch {
    // Already set to ready
    await secondUCAgentPage.mouse.click(250, 40); // Click off of menu
  }
  
  await supervisorPage.bringToFront();
  await supervisorPage.reload();
  try {
    await expect(
      supervisorPage.locator(
        "app-agent-status-container:has-text('Xima Agent 4 ('):has-text('Ready')",
      ),
    ).toBeVisible({ timeout: 4000 });
    await expect(
      supervisorPage.locator(
        `app-agent-status-container:has-text('Xima Agent 4 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible();
    await expect(
      supervisorPage.locator(
        "app-agent-status-container:has-text('Xima Agent 5 ('):has-text('Ready')",
      ),
    ).toBeVisible();
    await expect(
      supervisorPage.locator(
        `app-agent-status-container:has-text('Xima Agent 5 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible();
  } catch {
    await supervisorPage.reload();
    await expect(
      supervisorPage.locator(
        "app-agent-status-container:has-text('Xima Agent 4 ('):has-text('Ready')",
      ),
    ).toBeVisible();
    await expect(
      supervisorPage.locator(
        `app-agent-status-container:has-text('Xima Agent 4 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible();
    await expect(
      supervisorPage.locator(
        "app-agent-status-container:has-text('Xima Agent 5 ('):has-text('Ready')",
      ),
    ).toBeVisible();
    await expect(
      supervisorPage.locator(
        `app-agent-status-container:has-text('Xima Agent 5 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible();
  }
  
  // Log in to the UC web phone for both agents
  
  // For Agent 4's web phone:
  const { ucWebPhonePage: webPhonePageFirst } = await logUCAgentIntoUCWebphone(
    context,
    process.env.UC_AGENT_4_EXT_104_WEBPHONE_USERNAME,
  );
  await webPhonePageFirst.waitForLoadState("networkidle");
  
  // For Agent 5's web phone:
  const { ucWebPhonePage: webPhonePageSecond } = await logUCAgentIntoUCWebphone(
    secondUCAgentContext,
    process.env.UC_AGENT_5_EXT_105_WEBPHONE_USERNAME,
  );
  await webPhonePageSecond.bringToFront(); // Ensure Agent 5's web phone is active
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Bring Agent 4 page to front
  await webPhonePageFirst.bringToFront();
  
  // Assert Agent 4 is active
  await expect(
    webPhonePageFirst.locator(`[data-testid="ChatBubbleIcon"]`).first(),
  ).toBeVisible();
  
  // Bring Agent 5 page to front
  await webPhonePageSecond.bringToFront();
  
  // Assert Agent 5 is active
  await expect(
    webPhonePageSecond.locator(`[data-testid="ChatBubbleIcon"]`).first(),
  ).toBeVisible();
  
 // Step 2. Simulate an incoming call (UC Agent to another agent)
  //--------------------------------
  // Act:
  //--------------------------------
  await webPhonePageSecond.waitForTimeout(5000);
  
  // Create a call using the given number and log the call ID
  const callId = await createCall({ number: "4352001585" });
  console.log("CALL ID: " + callId);
  
  // Small pause before entering digit 1
  await webPhonePageSecond.waitForTimeout(2000);
  
  // Input digits based on the call ID (simulate pressing digit 3 for skill "61")
  await inputDigits(callId, [1]);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert answer button is visible
  await expect(
    webPhonePageSecond.locator(`[type="button"] [data-testid="CallIcon"]`),
  ).toBeVisible({ timeout: 90_000 });
  
  // Assert ignore button is visible
  await expect(
    webPhonePageSecond.locator(`[type="button"] [data-testid="ClearIcon"]`),
  ).toBeVisible();
  
  // Assert end call button is visible
  await expect(
    webPhonePageSecond.locator(`[type="button"] [data-testid="CallEndIcon"]:visible`),
  ).toBeVisible();
  
 // Step 3. Blind transfer by Agent Name (UC Agent to another agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Answer the call on Agent 5's web phone
  await webPhonePageSecond.locator(`.MuiGrid-item:has-text("answer")`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Initiate a blind transfer by clicking the forward icon
  await webPhonePageSecond.waitForTimeout(3_000);
  await webPhonePageSecond
    .locator(`[data-testid="PhoneForwardedIcon"]`)
    .waitFor();
  await webPhonePageSecond.locator(`[data-testid="PhoneForwardedIcon"]`).click();
  
  // Open the contacts list for transferring the call
  await webPhonePageSecond
    .locator(`:text("Choose from contacts"):visible`)
    .waitFor();
  await webPhonePageSecond
    .locator(`:text("Choose from contacts"):visible`)
    .click();
  
  // Hover over the contacts list section and scroll to reveal Agent 5
  await webPhonePageSecond.locator(`.ListInner`).nth(1).hover();
  await webPhonePageSecond.mouse.wheel(0, 800);
  
  // Select "Xima Agent 4" from the contacts (select the last matching element)
  await webPhonePageSecond.locator(`:text("Xima Agent 4") >> nth=-1`).click();
  
  // Click the "Call" button to initiate the transfer
  await webPhonePageSecond.locator(`[aria-label="Call"]`).waitFor();
  await webPhonePageSecond.locator(`[aria-label="Call"]`).click();
  
  // Confirm the blind transfer by clicking the "Blind transfer" option
  await webPhonePageSecond.locator(`:text("Blind transfer")`).waitFor();
  await webPhonePageSecond.locator(`:text("Blind transfer")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  await webPhonePageFirst.bringToFront();
  // Wait until Agent 4's web phone shows the incoming call transfer indicator
  await expect(
    webPhonePageFirst.locator(`[type="button"] [data-testid="CallIcon"]`),
  ).toBeVisible({ timeout: 60_000 });
  
  // Assert ignore button is visible
  await expect(
    webPhonePageFirst.locator(`[type="button"] [data-testid="ClearIcon"]`),
  ).toBeVisible();
  
  // Assert end call button is visible
  await expect(
    webPhonePageFirst.locator(`[type="button"] [data-testid="CallEndIcon"]`),
  ).toBeVisible();
  
 // Step 4. UC Agent can answer transfer (UC Agent to another agent)
  //--------------------------------
  // Act:
  //--------------------------------
  // Answer the transferred call
  await webPhonePageFirst
    .locator(`[type="button"] [data-testid="CallIcon"]`)
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert 'Hold' button is visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Hold` }),
  ).toBeVisible();
  
  // Assert 'Mute' button is visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Mute` }),
  ).toBeVisible();
  
  // Assert 'Dial pad' button is visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Dial pad` }),
  ).toBeVisible();
  
 // Step 5. Supervisor can view new transferred agent is now talking (UC Agent to another agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Bring the Supervisor page to the front
  await supervisorPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Filter for Xima Agent 4
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-title"]`)
    .waitFor({ state: "attached" });
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-title"]`)
    .first()
    .click();
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .first()
    .click();
  const selectAllCheckbox = supervisorPage.getByRole("checkbox", {
    name: /^Select All Agents/,
  });
  if (await selectAllCheckbox.isChecked()) {
    await selectAllCheckbox.click();
  }
  await supervisorPage
    .getByRole(`textbox`, { name: `Search Agents` })
    .fill(`xima agent 4`);
  
  // Soft assert "Xima Agent 4" is selected
  await expect(async () => {
    await supervisorPage
      .getByRole(`option`, { name: /^Xima Agent 4/ })
      .locator(`div:has([type='checkbox'])`)
      .click();
  
    await expect(
      supervisorPage
        .getByRole(`option`, { name: /^Xima Agent 4/ })
        .locator(`[type='checkbox']`),
    ).toBeChecked({ timeout: 2 * 1000 });
  }).toPass({ timeout: 20 * 1000 });
  
  await supervisorPage.getByRole(`button`, { name: `Apply` }).click();
  await supervisorPage.getByRole(`button`, { name: `Apply` }).click();
  
  // Wait for connection
  await supervisorPage.waitForTimeout(3000);
  await supervisorPage.reload();
  await expect(
    supervisorPage.locator(
      "app-agent-status-container:has-text('Xima Agent 4 (')",
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `app-agent-status-container:has-text('Xima Agent 4 ('):has(xima-loading)`,
    ),
  ).not.toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the call status in the Supervisor view shows "Talking"
  await expect(supervisorPage.locator(`:text("Talking")`).first()).toBeVisible();
  
 // Step 6. UC Agent can hang up a call from the UI (UC Agent to another agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  await webPhonePageFirst.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // End the call on Agent 4's web phone
  await webPhonePageFirst
    .locator(`button [data-testid="CallEndIcon"]`)
    .first()
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert 'Hold' button is not visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Hold` }),
  ).not.toBeVisible();
  
  // Assert 'Mute' button is not visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Mute` }),
  ).not.toBeVisible();
  
  // Assert 'Dial pad' button is not visible
  await expect(
    webPhonePageFirst.getByRole(`button`, { name: `Dial pad` }),
  ).not.toBeVisible();
  
 // Step 7. View Call in C2G (UC Agent to another agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  await supervisorPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Hover over reports button in sidenave
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  
  // Click C2G button
  await supervisorPage.getByRole(`button`, { name: `Cradle to Grave` }).click();
  
  // Click Agent filter button
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .nth(1)
    .click();
  
  // Wait 5 seconds for call to show up
  await supervisorPage.waitForTimeout(5_000);
  
  // Filter for Agent 4
  await supervisorPage
    .getByRole(`textbox`, { name: `Search Agents` })
    .fill(`xima agent 4`);
  await supervisorPage
    .getByRole(`option`, { name: /^Xima Agent 4/ })
    .locator(`div`)
    .first()
    .click();
  await supervisorPage.getByRole(`button`, { name: `Apply` }).click();
  
  // Check curr time
  const currDate = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Denver",
    }),
  );
  const isToday = dateFns.isToday(currDate);
  console.log(isToday);
  
  // If it's still the previous day compared to UTC, update the date range
  if (!isToday) {
    // Open Calendar
    await supervisorPage.getByRole(`button`, { name: `Open calendar` }).click();
  
    // If it's not this month, click previous month
    const isThisMonth = dateFns.isThisMonth(currDate);
    if (!isThisMonth) {
      await supervisorPage
        .getByRole(`button`, { name: `Previous month` })
        .click();
    }
  
    // Click today
    const today = dateFns.format(currDate, "MMMM d,");
    await supervisorPage.getByRole(`button`, { name: today }).click();
    await supervisorPage.waitForTimeout(500);
    await supervisorPage.getByRole(`button`, { name: today }).click();
    await supervisorPage.waitForTimeout(500);
  }
  
  // Click Apply
  await supervisorPage.getByRole(`button`, { name: `Apply` }).click();
  await supervisorPage.waitForTimeout(10 * 1000);
  
  // Sort by Start Time descending
  await supervisorPage.getByRole(`button`, { name: `Start Timestamp` }).click();
  
  // Get start time text from the Supervisor page
  const startTimeText = await supervisorPage
    .locator(`[data-cy="cradle-to-grave-table-cell-START"]`)
    .first()
    .innerText();
  console.log(startTimeText);
  
  // Assume the text contains two lines: one for the date and one for the time, e.g.:
  // "03/31/2025\n12:10:14 PM"
  const [datePart, timePart] = startTimeText
    .split("\n")
    .map((line) => line.trim());
  // Combine the parts into a single date-time string and parse it
  const startDate = new Date(`${datePart} ${timePart}`);
  console.log("Parsed start date:", startDate);
  
  // Get current time
  const now = new Date();
  console.log("Current time:", now);
  
  // Calculate the difference in minutes between now and the start time
  const diffMinutes = (now - startDate) / (60 * 1000);
  console.log("Difference in minutes:", diffMinutes);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the start time was not more than 5 minutes ago (adjust for time zone with +)
  expect(diffMinutes).toBeLessThanOrEqual(5 + 360);
  
});
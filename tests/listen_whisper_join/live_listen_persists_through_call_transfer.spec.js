import { createCall, inputDigits, logInStaggeringSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("live_listen_persists_through_call_transfer", async () => {
 // Step 1. Enable live listen as supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as a staggering supervisor and start monitoring through Supervisor View
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInStaggeringSupervisor({
    username: process.env.MANAGER_1_USERNAME,
    password: process.env.MANAGERS_1_TO_4_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Login as a WebRTCAgent 24 and prepare for a call
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_24_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // Login WebRTC agent 23
  const {
    browser: browser2,
    context: context2,
    page: page2,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_23_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Navigate to the REALTIME_DISPLAYS menu and select Supervisor View
  // -- Click the REALTIME_DISPLAYS menu
  await supervisorPage.bringToFront();
  await supervisorPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  // -- Click 'Supervisor View' text item
  await supervisorPage.click(':text("Supervisor View")');
  
  // Click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    // Click the filter button
    await supervisorPage
      .locator(`[data-cy="supervisor-view-filter-title"]`)
      .click();
    // Click the Selection Mode field
    await supervisorPage.locator('[placeholder="Select type"]').click();
    // Click Agent
    await supervisorPage
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 2 * 60 * 1000 });
  
  // Click the edit button next to the Agents field
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // First select all agents
  // -- Grab locator for the "Select All Agents" checkbox
  let checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // -- Check if the checkbox is checked
  let isChecked = await checkboxLocator.isChecked();
  
  // -- If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // Then unselect all agents
  // -- Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // -- If the checkbox is checked, click it to uncheck
  if (isChecked) {
    await checkboxLocator.click();
  }
  
  // Fill in agent 24 we will call into search bar
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 24`);
  
  // Check if the "Select ALl Filtered Agents" checkbox is checked
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
  
  // Click apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  
  // Wait for connection 
  await supervisorPage.waitForTimeout(3000);
  await supervisorPage.reload();
  await expect(
    supervisorPage
      .locator(
        `app-agent-status-container:has-text("WebRTC Agent 24") [data-cy="agent-tile-more-menu"]`,
      )
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `app-agent-status-container:has-text('WebRTC Agent 24 ('):has(xima-loading)`,
    ),
  ).not.toBeVisible();
  await supervisorPage.waitForTimeout(2000);
  
  // Click on the more menu of the agent "WebRTC Agent 24"
  await supervisorPage.click(
    'app-agent-status-container:has-text("WebRTC Agent 24") [data-cy="agent-tile-more-menu"]',
  );
  
  // Click on the "Live Listen" option from the agent's more menu
  await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
  
  await expect(async () => {
    try {
      // Verify that the "Listen" button appears in the "Call Monitoring Active" footer
      await expect(supervisorPage.locator(".LISTEN")).toBeVisible({
        timeout: 4000,
      });
    } catch {
      try {
        await supervisorPage.locator(".confirm-replace").click({ timeout: 4000 });
      } catch {
        // Click the kebab menua for WebRTC Agent 24
        await supervisorPage
          .locator(
            'app-agent-status-container:has-text("WebRTC Agent 24") [data-cy="agent-tile-more-menu"]',
          )
          .click();
  
        // Click on the "Live Listen" option from the agent's more menu
        await supervisorPage
          .locator('[data-cy="agent-more-menu-live-listen"]')
          .click();
  
        await supervisorPage.locator(".confirm-replace").click();
      }
    }
  }).toPass({ timeout: 2 * 60 * 1000 });
  
  // Click the 'LISTEN' icon
  await supervisorPage.click(".LISTEN");
  
  // wait briefly for changes to take effect
  await supervisorPage.waitForTimeout(2000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the visibility of the text "Call Monitoring Active:"
  await expect(
    supervisorPage.locator("text=Call Monitoring Active:"),
  ).toBeVisible();
  
  // Assert the visibility of the "Whisper" icon button in the "Call Monitoring Active" footer
  await expect(supervisorPage.locator(".WHISPER")).toBeVisible();
  
  // Assert the visibility of the "Join" icon button in the "Call Monitoring Active" footer
  await expect(supervisorPage.locator(".JOIN")).toBeVisible();
  
 // Step 2. Create a live listen call
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Bring WebRTCAgent 24 page to the front
  await page.bringToFront();
  
  // Click the "Manage Skills" button and toggle on only skill 38
  await toggleSkill(page, 38);
  
  // Click the ">" next to the status icon and toggle the Agent status to "Ready"
  await page.waitForTimeout(1000);
  await toggleStatusOn(page);
  
  // Verify the Agent status is set to "Ready"
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Wait for 2 seconds (2000 milliseconds)
  await page.waitForTimeout(2000);
  
  // Verify that the color of VOICE icon is either "rgb(49, 180, 164)" (Active) teal or "rgb(166, 166, 166)" (Disabled) grey
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)");
  } catch {
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).toHaveCSS("color", "rgb(166, 166, 166)");
  }
  
  // Verify that the color of CHAT icon is "rgb(49, 180, 164)" (Active) teal
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Create a WebRTC Call, input Digits and accept the call.
  await expect(async () => {
    // Create WebRTC Call
    let callId = await createCall({
      number: "4352551621",
    });
    console.log("CALL ID: " + callId);
  
    // Input digits
    await inputDigits(callId, [8]);
  
    // Verify the modal "Incoming Call" appears
    await page
      .locator('[data-cy="alert-incoming-call-accept"]')
      .waitFor({ timeout: 25 * 1000 });
  }).toPass({ timeout: 4 * 60 * 1000 });
  
  // Click the button which accepts incoming calls
  await page.locator('[data-cy="alert-incoming-call-accept"]').click({
    force: true,
    delay: 500,
  });
  await page.bringToFront();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Check on the supervisor page to verify the agent is talking, and both Whisper and Join are accessible options.
  // -- Bring the supervisorPage to front
  await supervisorPage.bringToFront();
  
  // Assert that the agent status on supervisor page shows "Talking"
  await expect(
    supervisorPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 24") section :text("Talking")',
    ),
  ).toBeVisible();
  
  // Assert that the "WHISPER" button is enabled
  await expect(supervisorPage.locator(".WHISPER")).toBeEnabled();
  
  // Assert that the "JOIN" button is enabled
  await expect(supervisorPage.locator(".JOIN")).toBeEnabled();
  
 // Step 3. Transfer live listen call
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Bring Agent 23 page to front
  await page2.bringToFront();
  
  // Toggle on on skill 38
  await toggleSkill(page2, 38);
  
  // Toggle "Ready" status on
  await toggleStatusOn(page2);
  
  // Check the agent state on {page2} to confirm it's "Ready"
  await expect(page2.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Bring the original page ({page}) to the front
  await page.bringToFront();
  
  // Wait for 1 second
  await page.waitForTimeout(1000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the transfer button on {page}
  await page.locator('[data-cy="transfer-btn"] path').first().click();
  
  // Wait another second
  await page.waitForTimeout(1000);
  
  // Click the agent icon on {page}
  await page.locator('[data-mat-icon-name="agent"]').click();
  
  // Select "WebRTC Agent 23" on {page}
  await page.getByText(`WebRTC Agent 23`).click();
  
  // click the "Blind Transfer" button on {page}
  await page.locator('button:has-text("Blind Transfer")').click();
  
  // Bring {page2} to the front
  await page2.bringToFront();
  
  // Accept the incoming call alert on {page2}
  await page2.locator('[data-cy="alert-incoming-call-accept"]').click();
  
  // Bring supervisor page to the foreground
  await supervisorPage.bringToFront();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert call monitoring on supervisor page
  // Assert for "Call Monitoring Active:" text visibility on the supervisor page
  await expect(
    supervisorPage.locator("text=Call Monitoring Active:"),
  ).toBeVisible();
  
  // Assert for "WebRTC Agent 24" visibility on the supervisor page
  await expect(
    supervisorPage.locator("text=WebRTC Agent 24>>nth=0"),
  ).toBeVisible();
  
  // Assert that the "WHISPER" button is disabled on the supervisor page
  await expect(supervisorPage.locator(".WHISPER")).toBeDisabled();
  
  // Assert that the "JOIN" button is disabled on the supervisor page
  await expect(supervisorPage.locator(".JOIN")).toBeDisabled();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  // End call monitoring and apply filters
  // Click on "End Call Monitoring" on the supervisor page
  await supervisorPage.locator(':text("End Call Monitoring")').click();
  
  // Click on the view filter title on the supervisor page
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-title"]')
    .click();
  
  // Click on the first edit button of the preview parameters container on the supervisor page
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // Uncheck the "select all" checkbox if it's checked on the supervisor page
  try {
    if (
      await supervisorPage
        .locator('[data-cy="checkbox-tree-property-select-all"] input')
        .isChecked({ timeout: 10000 })
    ) {
      await supervisorPage
        .locator(`[data-cy="checkbox-tree-property-select-all"] input`)
        .click({ force: true });
    }
  } catch {
    if (
      await supervisorPage
        .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
        .isChecked({ timeout: 10000 })
    ) {
      await supervisorPage
        .locator('[data-cy="xima-list-select-select-all"]')
        .click({ force: true, timeout: 7000 });
    }
  }
  
  // Wait for 2 seconds
  await supervisorPage.waitForTimeout(2000);
  
  // Click the "Apply" button on the supervisor page
  await supervisorPage.locator('button.apply> span:text-is(" Apply ")').click();
  
  // Wait for another 2 seconds
  await supervisorPage.waitForTimeout(2000);
  
  // Click the filter apply button on the supervisor page
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-apply-button"]')
    .click();
  
});
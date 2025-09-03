import { logInSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("chat_transfer", async () => {
 // Step 1. Log In with Agent (Skill 3) for Blog Spot (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Create context for blog pages
  const { context } = await launch();
  
  // Log in with agent (Skill 3) for blog spot
  const { page: firstAgentPage } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_26_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  const webRTCAgentInnerText = await firstAgentPage
    .locator("app-agent-status-container")
    .innerText();
  const webRTCAgentFirstStr = webRTCAgentInnerText.replace("W1\n", "");
  const webRTCAgentNumber = webRTCAgentFirstStr.replace("\nmore_vert", "");
  
  // Disable all skills except for 3
  await toggleSkill(firstAgentPage, "3");
  
  // Set Agent to Ready
  await toggleStatusOn(firstAgentPage);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert chat and call icons are enabled
  try {
    await expect(
      firstAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 10 * 1000 });
    await expect(
      firstAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 10 * 1000 });
  } catch {
    // if call is active, remove it
    await expect(firstAgentPage.locator("xima-active-media-tile")).toBeVisible();
    await firstAgentPage.locator("xima-active-media-tile").click();
    await firstAgentPage
      .locator('[data-cy="chat-header"] [data-cy="end-chat"]')
      .click();
    await firstAgentPage
      .locator('[data-cy="call-details-finish-anchor"]')
      .click();
  }
  
 // Step 2. Log In with Second Agent (Skill 3) for Blog Spot (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in with SECOND agent (Skill 3) for blog spot
  const { page: secondAgentPage } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_25_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Disable all skills except for 3
  await toggleSkill(secondAgentPage, "3");
  
  // Set Agent to Ready
  await toggleStatusOn(secondAgentPage);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Soft assert chat and call icons are enabled
  try {
    await expect(
      secondAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 10 * 1000 });
    await expect(
      secondAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 10 * 1000 });
  } catch {
    // if call is active, remove it
    await expect(secondAgentPage.locator("xima-active-media-tile")).toBeVisible();
    await secondAgentPage.locator("xima-active-media-tile").click();
    await secondAgentPage
      .locator('[data-cy="chat-header"] [data-cy="end-chat"]')
      .click();
    await secondAgentPage
      .locator('[data-cy="call-details-finish-anchor"]')
      .click();
  }
  
 // Step 3. Create Web Chat (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Navigate to https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-3.html
  const blogPage = await context.newPage();
  await blogPage.waitForTimeout(3000);
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-3.html",
  );
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.waitForTimeout(3000);
  await blogPage.reload();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Create web chat
  // Click on the Chat box
  await blogPage.locator("#xima-chat-widget-icon-chat").click();
  // await blogPage.locator(`#xima-start-chat-btn`).click();
  
  // Fill the 'Name' input
  const customerName = faker.random.words(2);
  await blogPage.locator("#xima-chat-name").fill(customerName);
  
  // Fill the 'Email' input
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  await blogPage.locator("#xima-chat-email").fill(customerEmail);
  
  // Click the Submit button
  await blogPage.waitForTimeout(5000);
  await blogPage.locator("#xima-chat-name-email-entry-submit").click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert You Are in the Queue message on blog
  await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // Assert Agent gets Chat Offer\
  await firstAgentPage.bringToFront();
  await expect(firstAgentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  await firstAgentPage.waitForTimeout(1500);
  
 // Step 4. Accept Chat Offer (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Accept chat offer
  // Click the 'Accept' button
  await firstAgentPage.locator('[data-cy="alert-chat-offer-accept"]').click(); // accept
  
  try {
    await firstAgentPage.locator(`[data-cy="active-media-tile-CHAT"]`).click();
  } catch (err) {
    console.warn(err);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  await expect(
    firstAgentPage.locator('[data-cy="chat-text-sent"]'),
  ).toBeVisible();
  await expect(firstAgentPage.locator(':text("Customer Details")')).toBeVisible();
  await expect(
    firstAgentPage.locator('[role="tab"]#mat-tab-label-0-1'),
  ).toBeVisible(); // Notes
  await expect(
    firstAgentPage.locator('[role="tab"]#mat-tab-label-0-2'),
  ).toBeVisible(); // Codes
  await expect(firstAgentPage.locator('[data-cy="end-chat"]')).toBeVisible();
  
  // User
  // - Chat Loads up for User on blog
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up
  // - Configured Chat greeting appears
  await blogPage.bringToFront();
  await expect(blogPage.locator("#xima-agent-name")).toContainText(
    webRTCAgentNumber,
  );
  await expect(
    blogPage.locator(
      `text=Hello, ${customerName}. My name is ${webRTCAgentNumber}. How can I help you today?`,
    ),
  ).toBeVisible();
  
 // Step 5. Transfer Chat to Second Agent (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Navigate to Agent CCAC page
  await firstAgentPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Transfer chat to second agent
  // Click the Kebab Menu button next to End Chat
  await firstAgentPage.locator('[data-cy="chat-header-menu-button"]').click();
  
  // Click on 'Transfer Chat'
  await firstAgentPage.locator('[data-cy="transfer-chat"]').click();
  
  // Select Second Agent
  await firstAgentPage
    .locator('[data-cy*="transfer-chat-to-agent-WebRTC Agent 25"]')
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Second Agent with Skill 3 is available, and receives request
  await secondAgentPage.bringToFront();
  await expect(secondAgentPage.locator("text=Chat Transfer Agent")).toBeVisible();
  
 // Step 6. Reject Chat Transfer (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Reject chat transfer
  // Click the 'Reject' button on Chat Transfer Skill Modal
  await secondAgentPage.locator('[data-cy="alert-transfer-chat-reject"]').click();
  
  // Navigate to First Agent CCAC page
  await firstAgentPage.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Chat Transfer pop up with 'DECLINED' appears for First Agent
  await expect(
    firstAgentPage.locator("text=Your chat transfer request has been DECLINED"),
  ).toBeVisible();
  
 // Step 7. Miss Chat Transfer (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Transfer chat to second agent
  await firstAgentPage
    .locator('[data-cy="alert-chat-transfer-response-ok"]')
    .click();
  await firstAgentPage.locator('[data-cy="chat-header-menu-button"]').click();
  await firstAgentPage.locator('[data-cy="transfer-chat"]').click();
  await firstAgentPage
    .locator('[data-cy*="transfer-chat-to-agent-WebRTC Agent 25"]')
    .click();
  
  // Navigate to Second Agent CCAC page
  await secondAgentPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Miss chat transfer
  // Wait 30 seconds
  await secondAgentPage.waitForTimeout(30 * 1000);
  
  // Navigate to First Agent CCAC page
  await firstAgentPage.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Chat Transfer pop up with 'TIMEOUT' appears for First Agent
  await expect(
    firstAgentPage.locator("text=Your chat transfer request has been DECLINED"),
  ).toBeVisible();
  
 // Step 8. Accept Chat Transfer (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Transfer chat to second agent
  await firstAgentPage
    .locator('[data-cy="alert-chat-transfer-response-ok"]')
    .click();
  await firstAgentPage.locator('[data-cy="chat-header-menu-button"]').click();
  await firstAgentPage.locator('[data-cy="transfer-chat"]').click();
  await firstAgentPage
    .locator('[data-cy*="transfer-chat-to-agent-WebRTC Agent 25("]')
    .click();
  
  // Navigate to Second Agent CCAC page
  await secondAgentPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Accept chat transfer
  // Click the 'Accept' button on Chat Transfer Skill Modal
  await secondAgentPage.locator('[data-cy="alert-chat-offer-accept"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Chat is transferred to Second Agent
  await expect(
    secondAgentPage.locator(
      `:text('Hello, ${customerName}. My name is ${webRTCAgentNumber}. How can I help you today?')`,
    ),
  ).toBeVisible();
  
  // Navigate to First Agent CCAC page
  await firstAgentPage.bringToFront();
  
  // Accept Chat Transfer pop up with 'ACCEPTED' appears for First Agent
  await expect(
    firstAgentPage.locator("text=Your chat transfer request has been ACCEPTED"),
  ).toBeVisible();
  
 // Step 9. Chat Logged in Cradle to Grave (chat transfer)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log In as a Supervisor
  const { page: supervisorPage } = await logInSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
    timezoneId: "America/Denver",
  });
  
  // Click Ok for transfer response
  await firstAgentPage
    .locator('[data-cy="alert-chat-transfer-response-ok"]')
    .click();
  
  // Navigate to Second Agent CCAC page
  await secondAgentPage.bringToFront();
  await secondAgentPage.locator('[data-cy="end-chat"]').click(); // End chat
  await secondAgentPage.locator('[data-cy="call-details-finish-anchor"]').click();
  await supervisorPage.bringToFront();
  
  // Navigate to Cradle to Grave
  await supervisorPage.locator('[data-cy="sidenav-menu-REPORTS"]').hover();
  await supervisorPage.locator('button:has-text("Cradle to Grave")').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Chat logged in Cradle to Grave
  // Filter by Agent used in Web Chat
  try {
    await supervisorPage
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await supervisorPage.locator(`xima-header-add`).getByRole(`button`).click();
    await supervisorPage
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await supervisorPage.getByText(`Agent`, { exact: true }).click();
    await supervisorPage
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  await supervisorPage
    .locator(`[data-cy="xima-list-select-option"] :text("${webRTCAgentNumber}")`)
    .click();
  await supervisorPage
    .locator('[data-cy="agents-roles-dialog-apply-button"]')
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // - Correct Calling Party
  // - Correct Receiving Party
  // - Duration of the call
  // - Note is present if one is added during chat
  await expect(
    supervisorPage.locator(
      `:text("${customerName}"):below(:text("Calling Party")) >> nth=0`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `:text("WebRTC Agent 26"):below(:text("Receiving Party")) >> nth=0`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-header-cell-DURATION"] :text("Duration")',
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-note-button"]:below(:text("Notes")) >> nth=0',
    ),
  ).toBeVisible();
  
});
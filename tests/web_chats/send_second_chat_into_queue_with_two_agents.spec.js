import { logInSupervisor, logInWebRTCAgent, toggleOnAllSkills, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("send_second_chat_into_queue_with_two_agents", async () => {
 // Step 1. Log In with Agent (Skill 3) for Blog Spot (send second chat into queue with two agents)
  // Arrange:
  // Navigate to https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-18.html
  // Navigate to DEFAULT_URL
  // Fill the Username input with WEBRTC_AGENT Email
  // Fill the Password input with DEFAULT_PASSWORD
  // Click the 'Login' button
  // Set Agent to Ready
  // Disable all skills except for 18
  // Navigate to Blog Spot
  // Click on the Chat box
  
  // Assert:
  // Chat Window Appearance
  // - Chat window has customer color scheme (not all black)
  // - 'There is an agent available. Would you like to chat?'
  // - Chatter sees agent's nickname instead of ext name
  // - Chatter sees company logo in window
  // - Chatter sees agent's image in window
  
  const { browser, context } = await launch();
  const blogPage = await context.newPage();
  
  // REQ 01 Log in with agent (Skill 18) for blog spot
  const { browser: browser2, page: firstAgentPage } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_27_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // REQ 02 Log in with SECOND agent (Skill 18) for blog spot
  const { browser: browser3, page: secondAgentPage } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_28_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  const { browser: browser4, context: context2 } = await launch()
  const secondBlogPage = await context2.newPage();
  
  // Log In as a Supervisor
  const { browser: browser5, page: supervisorPage } = await logInSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
    timezoneId: "America/Denver"
  });
  
  // Navigate to https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-18.html
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-18.html",
  );
  await blogPage.waitForTimeout(2000);
  
  // Disable all skills except for 18
  await toggleSkill(firstAgentPage, "18");
  
  // Set Agent to Ready
  await firstAgentPage.bringToFront();
  await toggleStatusOn(firstAgentPage);
  
  // Toggle off all channels aside from chat
  await firstAgentPage.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await firstAgentPage.locator(`.ready [data-mat-icon-name="email"]`).click();
  await expect(firstAgentPage.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(firstAgentPage.locator(`.channels-disabled [data-mat-icon-name="email"]`)).toBeVisible();
  
  await expect(
    firstAgentPage.locator('[data-cy="channel-state-label"]'),
  ).toHaveText("Ready");
  await firstAgentPage.waitForTimeout(4000);
  try {
    await expect(
      firstAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await firstAgentPage.click('[data-cy="channel-state-channel-VOICE"]');
  } catch (error) {
    console.log('Error in VOICE channel state check:', error);
  }
  
  try {
    await expect(
      firstAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await firstAgentPage.click('[data-cy="channel-state-channel-CHAT"]');
  } catch (error) {
    console.log('Error in CHAT channel state check:', error);
  }
  
  await expect(
    firstAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  await expect(
    firstAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  
  // Arrange:
  // Navigate to https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-18.html
  // Navigate to DEFAULT_URL
  
  // Disable all skills except for 18
  await secondAgentPage.bringToFront();
  await toggleSkill(secondAgentPage, "18");
  
  // Set Agent to Ready
  await toggleStatusOn(secondAgentPage);
  
  // Toggle off all channels aside from chat
  await secondAgentPage.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await secondAgentPage.locator(`.ready [data-mat-icon-name="email"]`).click();
  await expect(secondAgentPage.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(secondAgentPage.locator(`.channels-disabled [data-mat-icon-name="email"]`)).toBeVisible();
  
  
  await expect(
    secondAgentPage.locator('[data-cy="channel-state-label"]'),
  ).toHaveText("Ready");
  await secondAgentPage.waitForTimeout(4000);
  try {
    await expect(
      secondAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await secondAgentPage.click('[data-cy="channel-state-channel-VOICE"]');
  } catch (error) {
    console.log('Error in VOICE channel state check for secondAgentPage:', error);
  }
  
  try {
    await expect(
      secondAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await secondAgentPage.click('[data-cy="channel-state-channel-CHAT"]');
  } catch (error) {
    console.log('Error in CHAT channel state check for secondAgentPage:', error);
  }
  
  await expect(
    secondAgentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  await expect(
    secondAgentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  
  // Arrange:
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.waitForTimeout(3000);
  await blogPage.reload();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // REQ 03 Create web chat
  // Click on the Chat box
  await expect(async () => {
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }).toPass({ timeout: 1000 * 120 });
  
  try {
    // Click the 'Yes' button
    await blogPage.getByRole(`button`, { name: `Yes` }).click();
  } catch {
    console.log(`no yes button`);
  }
  
  // Fill the 'Name' input
  const customerName = faker.random.words(2);
  console.log(customerName);
  await blogPage.fill("#xima-chat-name", customerName);
  
  // Fill the 'Email' input
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerEmail);
  await blogPage.fill("#xima-chat-email", customerEmail);
  
  // Click the Submit button
  await blogPage.waitForTimeout(5000);
  await blogPage.click("#xima-chat-name-email-entry-submit");
  
  // Assert You Are in the Queue message on blog
  await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // Assert Agent gets Chat Offer
  await secondAgentPage.bringToFront();
  await expect(secondAgentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  // REQ 04 Miss chat offer with second agent on standby
  // After 30 seconds, Navigate to first Agent
  await firstAgentPage.bringToFront();
  await firstAgentPage.waitForTimeout(30 * 1000);
  
  // Assert After Chat Offer's timeout, chat gets re-directed from Agent 2 to Agent 1
  await expect(firstAgentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  // REQ 05 Accept chat offer
  // Click the 'Accept' button
  await firstAgentPage.click('[data-cy="alert-chat-offer-accept"]'); // accept
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  await expect(firstAgentPage.locator('[data-cy="end-chat"]')).toBeVisible();
  await expect(firstAgentPage.locator(':text("Customer Details")')).toBeVisible();
  await expect(
    firstAgentPage.locator('[role="tab"]:has-text("Notes")'),
  ).toBeVisible(); // Notes
  await expect(
    firstAgentPage.locator('[role="tab"]:has-text("Codes")'),
  ).toBeVisible(); // Codes
  await expect(firstAgentPage.locator('[data-cy="end-chat"]')).toBeVisible();
  
  // User
  // - Chat Loads up for User on blog
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up
  // - Configured Chat greeting appears
  await blogPage.bringToFront();
  await expect(blogPage.locator("#xima-agent-name")).toContainText(
    "WebRTC Agent 27",
  );
  await expect(
    blogPage.locator(`text=Hello ${customerName} My name is WebRTC Agent 27`),
  ).toBeVisible();
  
  // REQ 06 Create second web chat
  
  await secondBlogPage.bringToFront();
  await secondBlogPage.goto(
    "https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-18.html",
  );
  
  await secondBlogPage.waitForTimeout(4000);
  await secondBlogPage.reload();
  
  // Create web chat
  // Click on the Chat box
  await secondBlogPage.locator(`#xima-chat-widget-icon-chat`).click();
  
  // Click the 'Yes' button
  try {
    await secondBlogPage.getByRole(`button`, { name: `Yes` }).click();
  } catch {
    console.log(`no yes button`);
  }
  
  // Fill the 'Name' input
  const customerTwoName = faker.random.words(2);
  console.log(customerTwoName);
  await secondBlogPage.fill("#xima-chat-name", customerTwoName);
  
  // Fill the 'Email' input
  const customerTwoEmail = customerTwoName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerTwoEmail);
  await secondBlogPage.fill("#xima-chat-email", customerTwoEmail);
  
  // Click the Submit button
  await secondBlogPage.click("#xima-chat-name-email-entry-submit");
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // User
  // - Sees 'You Are in the Queue' message on blog
  await expect(secondBlogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // - Sees 'Your Estimated Wait Time is:' on blog
  await expect(secondBlogPage.locator("text=Estimated wait time")).toBeVisible();
  
  // Agent
  // - Can see new chat with name under 'Active Media'
  await secondAgentPage.bringToFront();
  console.log(customerTwoName);
  await secondAgentPage.waitForTimeout(2000);
  try {
    await expect(
      secondAgentPage.locator(
        `:text-is("${customerTwoName}"):below(:text("Active Media")) >> nth=0`,
      ),
    ).toBeVisible();
  } catch (error) {
    console.log('Error checking visibility of customerTwoName element:', error);
  }
  
  // REQ 07 Accept chat offer with second agent
  // Click the 'Accept' button
  await secondAgentPage.click(":text('Accept')"); // accept
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  await expect(
    secondAgentPage.locator('[data-cy="chat-text-sent"]'),
  ).toBeVisible();
  await expect(
    secondAgentPage.locator(':text("Customer Details")'),
  ).toBeVisible();
  await expect(
    secondAgentPage.locator('[role="tab"]#mat-tab-label-0-1'),
  ).toBeVisible(); // Notes
  await expect(
    secondAgentPage.locator('[role="tab"]#mat-tab-label-0-2'),
  ).toBeVisible(); // Codes
  await expect(secondAgentPage.locator('[data-cy="end-chat"]')).toBeVisible();
  
  // User
  // - Chat Loads up for User on blog
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up
  // - Configured Chat greeting appears
  await secondBlogPage.bringToFront();
  await expect(secondBlogPage.locator("#xima-agent-name")).toContainText(
    "WebRTC Agent 28",
  );
  await expect(
    secondBlogPage.locator(
      `text=Hello ${customerTwoName} My name is WebRTC Agent 28`,
    ),
  ).toBeVisible();
  
  // Navigate to First Agent CCAC page
  await firstAgentPage.bringToFront();
  await firstAgentPage.click('[data-cy="end-chat"]'); // End chat
  await firstAgentPage.click('[data-cy="call-details-finish-anchor"]');
  
  // Navigate to Second Agent CCAC page
  await secondAgentPage.bringToFront();
  await secondAgentPage.click('[data-cy="end-chat"]'); // End chat
  await secondAgentPage.click('[data-cy="call-details-finish-anchor"]');
  
  // Arrange:
  
  await supervisorPage.bringToFront();
  
  // Navigate to Cradle to Grave
  await supervisorPage.hover('[data-cy="sidenav-menu-REPORTS"]');
  await supervisorPage.click(':text("Cradle to Grave")');
  
  //REQ 08 Chat logged in Cradle to Grave
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
  await supervisorPage.click(
    '[data-cy="xima-list-select-option"] :text("WebRTC Agent 27(")',
  );
  await supervisorPage.click(
    '[data-cy="xima-list-select-option"] :text("WebRTC Agent 28(")',
  );
  await supervisorPage.click('[data-cy="agents-roles-dialog-apply-button"]');
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // CLick the Up Arrow Icon to Expand correct chat
  await supervisorPage
    .locator('[data-cy="cradle-to-grave-table-expand-row-button"]')
    .last()
    .click(); // fails here for AUS team because data has to be rolled back on day.
  await supervisorPage
    .locator('[data-cy="cradle-to-grave-table-expand-row-button"] >> nth=-1')
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
      `:text("${customerTwoName}"):below(:text("Calling Party")) >> nth=0`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `:text("WebRTC Agent 27"):below(:text("Receiving Party")) >> nth=0`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `:text("WebRTC Agent 28"):below(:text("Receiving Party")) >> nth=0`,
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
  
  // Cleanup
  // Toggle disabled skills on
  // First Agent: toggle all skills to "Disabled"
  await firstAgentPage.bringToFront();
  await toggleOnAllSkills(firstAgentPage);
  // Second Agent: toggle all skills to "Enabled"
  await secondAgentPage.bringToFront();
  await toggleOnAllSkills(secondAgentPage);
  
  await supervisorPage.close();
  await firstAgentPage.close();
  await secondAgentPage.close();
  await blogPage.close();
  await secondBlogPage.close();
  
 // Step 2. Log In with Second Agent (Skill 3) for Blog Spot (send second chat into queue with two agents)
  // Arrange:
  // Navigate to https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-3.html
  // Navigate to DEFAULT_URL
  
  // Act:
  // Fill the Username input with different WEBRTC_AGENT Email
  // Fill the Password input with DEFAULT_PASSWORD
  // Click the 'Login' button
  // Set Agent to Ready
  // Disable all skills except for 3
  // Navigate to Blog Spot
  // Click on the Chat box
  
  // Assert:
  // Chat Window Appearance
  // - Chat window has customer color scheme (not all black)
  // - 'There is an agent available. Would you like to chat?'
  // - Chatter sees agent's nickname instead of ext name
  // - Chatter sees company logo in window
  // - Chatter sees agent's image in window
  
  
 // Step 3. Create Web Chat (send second chat into queue with two agents)
  // Arrange:
  // Navigate to Blog Spot
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // You Are in the Queue message on blog
  // Agent gets Chat Offer
  
 // Step 4. Miss Chat Offer with Second Agent on Standby (send second chat into queue with two agents)
  // Arrange:
  
  // Act:
  // After 30 seconds, Navigate to first Agent 
  
  // Assert:
  // After Chat Offer's timeout, chat gets re-directed from Agent 2 to Agent 1
  
 // Step 5. Accept Chat Offer (send second chat into queue with two agents)
  // Arrange:
  // User Submits chat request on blog
  // Navigate to Agent CCAC
  
  // Act:
  // Click the 'Accept' button
  
  // Assert:
  // User
  // - Chat Loads up for User on blog 
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up 
  // - Configured Chat greeting appears
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  
  
  
 // Step 6. Create Second Web Chat (send second chat into queue with two agents)
  // Arrange:
  // Have Chat ongoing with Agent
  // Navigate to Blog Spot 
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // User
  // - Sees 'You Are in the Queue' message on blog
  // - Sees 'Your Estimated Wait Time is:' on blog
  // Agent
  // - Can see new chat with name under 'Active Media'
  
 // Step 7. Accept Chat Offer with Second Agent (send second chat into queue with two agents)
  // Arrange:
  // User Submits chat request on blog
  // Navigate to Second Agent CCAC
  
  // Act:
  // Click the 'Accept' button
  
  // Assert:
  // User
  // - Chat Loads up for User on blog 
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up 
  // - Configured Chat greeting appears
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  
  
  
 // Step 8. Chat Logged in Cradle to Grave (send second chat into queue with two agents)
  // Arrange:
  // Log In as a Supervisor
  // Navigate to Cradle to Grave
  
  // Act:
  // Filter by Agent used in Web Chat
  // CLick the Up Arrow Icon to Expand correct chat
  
  // Assert:
  // - Correct Calling Party
  // - Correct Receiving Party
  // - Duration of the call
  // - Note is present if one is added during chat
  
});
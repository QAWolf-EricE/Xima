import { logInSupervisor, logInWebRTCAgent, toggleSkill } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_a_web_chat", async () => {
 // Step 1. Navigate to Blog Spot without agents logged in (create a web chat)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Launch browser
  const { browser, context } = await launch();
  const blogPage = await context.newPage();
  
  // Navigate to https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-2.html
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-2.html",
  );
  
  // Login as Agent 3
  const { browser: browser2, page: agentPage } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_3_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // Bring blogPage back to the front and reload
  await blogPage.bringToFront();
  await blogPage.waitForTimeout(3000);
  await blogPage.reload();
  
  // Click the chat box on blogPage
  await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  
  // Verify all agents are currently busy chat box - 'Would you like to be placed in the Chat Queue?' text
  try {
    await expect(
      blogPage.locator(`:text("All agents are currently busy")`),
    ).toBeVisible({ timeout: 7000 });
    await expect(
      blogPage.locator(
        `:text("Would you like to be placed in the Chat Queue?")`,
      ),
    ).toBeVisible();
  } catch {
    await expect(
      blogPage.locator(`:text("No agents are currently logged in")`),
    ).toBeVisible();
    await expect(
      blogPage.locator(`:text("Click here to send us an email.")`),
    ).toBeVisible();
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 2. Log In with Agent (Skill 2) for Blog Spot (create a web chat)
  
  
  // toggle agent 13 skills on
  await agentPage.bringToFront();
  await toggleSkill(agentPage, "2");
  await agentPage
    .locator(
      `[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])`,
    )
    .click();
  await agentPage.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(
    agentPage.locator('[data-cy="channel-state-label"]'),
  ).toHaveText("Ready");
  await agentPage.waitForTimeout(4000);
  try {
    await expect(
      agentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await agentPage.click('[data-cy="channel-state-channel-VOICE"]');
  } catch (err) {
    console.log(err);
  }
  try {
    await expect(
      agentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await agentPage.click('[data-cy="channel-state-channel-CHAT"]');
  } catch (err) {
    console.log(err);
  }
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    agentPage.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.waitForTimeout(10000);
  await blogPage.reload();
  
 // Step 3. Create Web Chat (create a web chat)
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
  // REQ 03 Create web chat
  // Click on the Chat box
  await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  
  // Fill the 'Name' input
  const customerName = faker.random.words(2);
  console.log(customerName);
  await blogPage.fill("#xima-chat-name", customerName);
  
  // Fill the 'Email' input
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerEmail);
  await blogPage.fill("#xima-chat-email", customerEmail);
  
  // Click the Submit button
  await blogPage.click("#xima-chat-name-email-entry-submit");
  
  // Assert You Are in the Queue message on blog
  await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // Assert Agent gets Chat Offer
  await agentPage.bringToFront();
  await expect(agentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  
  
 // Step 4. Reject Chat Offer (create a web chat)
  // Arrange:
  // User Submits chat request on blog
  // Navigate to Agent CCAC
  
  // Act:
  // Click the 'Reject' button
  
  // Assert:
  // Missed Chat Timeout message
  // After Timeout, Chat Offer loads again
  
  // REQ 04 Reject chat offer
  // Click the 'Reject' button
  await agentPage.click('[data-cy="alert-chat-offer-reject"]');
  
  // Assert Missed Chat Timeout message
  await expect(
    agentPage.locator('[data-cy="alert-after-call-work-title"]'),
  ).toBeVisible();
  
  // click "I am done"
  await agentPage
    .locator(
      '[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]',
    )
    .click();
  
  // Assert After Timeout, Chat Offer loads again
  await expect(agentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
 // Step 5. Accept Chat Offer (create a web chat)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // REQ 05 Accept chat offer
  // Click the 'Accept' button
  await agentPage.click('[data-cy="alert-chat-offer-accept"]');
  
  // Assert:
  // Agent
  // - Chat Loads up for Agent
  // - User Details, Notes, Codes, and End Chat option load correctly
  await expect(
    agentPage.locator('[data-cy="chat-text-sent"]'),
  ).toBeVisible();
  await expect(
    agentPage.locator(':text("Customer Details")'),
  ).toBeVisible();
  await expect(agentPage.locator('[role="tab"]')).toHaveCount(3);
  await expect(agentPage.locator('[data-cy="end-chat"]')).toBeVisible();
  
  // User
  // - Chat Loads up for User on blog
  // - Agent Nickname loads instead of actual agent name
  // - Skill associated loads up
  // - Configured Chat greeting appears
  await blogPage.bringToFront();
  await expect(blogPage.locator("#xima-agent-name")).toContainText(
    "WebRTC Agent 3",
  );
  await expect(
    blogPage.locator(
      `text=Hello, ${customerName}. My name is WebRTC Agent 3. How can I help you today?`,
    ),
  ).toBeVisible();
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 6. Send Chat Message as User (create a web chat)
  // Arrange:
  // Create a Chat
  // Navigate to Blog spot
  
  // Act:
  // Fill the 'Type here...' input with message
  // Click the Send Icon
  
  // Assert:
  // Agent is able to see '...' message in progress icon
  // Agent is able to get message from user
  
  // REQ 06 Send chat message as user
  // Fill the 'Type here...' input with message
  const message = faker.random.words(5);
  await blogPage.fill("#xima-chat-textarea", message);
  
  // Click the Send Icon
  await blogPage.click("#xima-send-message-btn");
  
  // Assert Agent is able to get message from user
  await agentPage.bringToFront();
  await expect(
    agentPage.locator('[data-cy="chat-test-receieved"]'),
  ).toHaveText(`${message}`);
  
  
  
 // Step 7. Send Chat Message as Agent (create a web chat)
  // Arrange:
  // Create a Chat
  // Navigate to Agent CCAC
  
  // Act:
  // Fill the 'Write a Reply' input with message
  // Click the 'Send' button
  
  // Assert:
  // User is able to see 'Agent is typing... message in progress
  // User is able to get message from Agent
  // REQ 07 Send chat message as Agent
  // Fill the 'Write a Reply' input with message
  const agentMessage = faker.random.words(2);
  await agentPage.fill('[data-cy="chat-text-input"]', agentMessage);
  
  // Assert User is able to see speech bubble with dots
  await blogPage.bringToFront();
  await expect(blogPage.locator(".dot-container")).toBeVisible();
  
  // Click the 'Send' button
  await agentPage.bringToFront();
  await agentPage.click('[data-cy="chat-send-message"]');
  
  // Assert User is able to get message from Agent
  await blogPage.bringToFront();
  await expect(blogPage.locator(`:text("${agentMessage}")`)).toBeVisible();
  
 // Step 8. Send Canned Message as an Agent (create a web chat)
  // Arrange:
  // Create a Chat
  // Navigate to Agent CCAC
  
  // Click the Sheet Icon Near the Send button
  // Select the 'Greeting' Option
  // Click the 'Send' button
  // Select the 'Address' Option
  // Click the 'Send' button
  
  // Assert:
  // Canned messages autofill and send message successfully
  // REQ 08 Send canned message as an agent
  // Click the Sheet Icon Near the Send button
  await agentPage.bringToFront();
  await agentPage.click('[data-cy="chat-select-template"]');
  
  // Select the 'Greeting' Option
  await agentPage.click(
    '[data-cy="chat-template-menu-item"]:has-text("Greeting")',
  );
  
  // Assert Canned messages autofill successfully
  await expect(
    agentPage.locator('[data-cy="chat-text-input"]'),
  ).toHaveValue(
    `Hello, ${customerName}. My name is WebRTC Agent 3. How can I help you today?`,
  );
  
  // Click the 'Send' button
  await agentPage.click('[data-cy="chat-send-message"]');
  
  // Select the 'Address' Option
  await agentPage.click('[data-cy="chat-select-template"]');
  await agentPage.click(
    '[data-cy="chat-template-menu-item"]:has-text("Address")',
  );
  
  // Assert Canned messages autofill successfully
  await expect(
    agentPage.locator('[data-cy="chat-text-input"]'),
  ).toHaveValue(
    "Our address is \n\nP. Sherman 42 Wallaby Way\nSydney, AUS",
  );
  
  // Click the 'Send' button
  await agentPage.click('[data-cy="chat-send-message"]');
  
  // Assert Canned messages send message successfully
  await blogPage.bringToFront();
  await expect(
    blogPage
      .locator(
        `text=Hello, ${customerName}. My name is WebRTC Agent 3. How can I help you today?`,
      )
      .last(),
  ).toBeVisible();
  await expect(
    blogPage.locator(
      "text=Our address is P. Sherman 42 Wallaby Way Sydney, AUS",
    ),
  ).toBeVisible();
  
 // Step 9. Request Screenshot as an Agent (create a web chat)
  // Arrange:
  // Create a Chat
  // Navigate to Agent CCAC
  
  // Click the Clip Icon Near the Send button
  
  // Assert:
  // User Recieves Screenshot Request
  // REQ 09 Request screenshot as an agent
  // Navigate to Agent CCAC
  await agentPage.bringToFront();
  
  // Click the Clip Icon Near the Send button
  await agentPage.click('[data-cy="chat-request-screenshot"]');
  
  // Assert User Recieves Screenshot Request
  await blogPage.bringToFront();
  await expect(
    blogPage.locator(
      "text=WebRTC Agent 3 is requesting a screenshot of the web page.",
    ),
  ).toBeVisible();
  
 // Step 10. Reject Screenshot Request (create a web chat)
  // Arrange:
  // Have agent send screenshot request
  // Navigate to Blog Spot
  
  // Act:
  // Click the "Don't Send" button
  
  // Assert:
  // "Screenshot request rejected" message appears in Blog and CCAC
  // REQ 10 Reject screenshot request as user
  // Click the "Don't Send" button
  await blogPage.click('button:has-text("Don\'t send")');
  
  // Assert "Screenshot request rejected" message appears in Blog and CCAC
  await expect(
    blogPage.locator("text=Screenshot request rejected."),
  ).toBeVisible();
  await agentPage.bringToFront();
  await expect(agentPage.locator("text=Screenshot Rejected")).toBeVisible();
  
  
 // Step 11. Accept Screenshot Request (create a web chat)
  // Arrange:
  // Have agent send screenshot request
  // Navigate to Blog Spot
  
  // Act:
  // Click the "Send Screenshot" button
  
  // Assert:
  // 'Screenshot sent to agent' message on blog
  // Screenshot of blog is sent to agent
  // REQ 11 Accept screnshot request as user
  // Have agent send screenshot request
  await agentPage.click('[data-cy="chat-request-screenshot"]');
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  
  // Click the "Send Screenshot" button
  await blogPage.click('button:has-text("Send Screenshot")');
  
  // Assert 'Screenshot sent to agent' message on blog
  await expect(
    blogPage.locator("text=Screenshot sent to agent."),
  ).toBeVisible();
  
  // Assert Screenshot of blog is sent to agent
  await agentPage.bringToFront();
  await expect(
    agentPage.locator('[data-cy="chat-screenshot-received"]'),
  ).toBeVisible();
  
 // Step 12. Add Note during Web Chat (create a web chat)
  // Arrange:
  // Navigate to Agent CCAC page
  
  // Act:
  // Click the 'Notes' tab
  // Enter a note 
  // Click the 'Post' button
  
  // Assert:
  // Note is posted under Notes tab
  // REQ 12 Add note during web chat
  // Click the 'Notes' tab
  await agentPage.click('[role="tab"] >> nth=1');
  
  // Enter a note
  const agentNote = faker.random.words(3);
  await agentPage.fill(
    '[data-cy="details-sidebar-note-textarea"]',
    agentNote,
  );
  
  // Click the 'Post' button
  await agentPage.click('[data-cy="details-sidebar-note-post-anchor"]');
  
  // Assert Note is posted under Notes tab
  await expect(agentPage.locator(`:text("${agentNote}")`)).toBeVisible();
  
  
 // Step 13. End Chat as Agent (create a web chat)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // REQ 13 End chat as agent
  // Click the 'End Chat' button
  await agentPage.click('[data-cy="end-chat"]');
  
  // Click the 'Finish' button
  await agentPage.click('[data-cy="call-details-finish-anchor"]');
  
  // Assert Chat is closed on CCAC
  await expect(
    agentPage.locator(':text("Customer Details")'),
  ).not.toBeVisible();
  
  // Assert User gets 'Chat has ended.' message on blog Spot
  await blogPage.bringToFront();
  await expect(blogPage.locator("#xima-chat-header")).toContainText(
    "Chat has ended. Thank You, Have a good day!",
  );
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 14. Chat Logged in Cradle to Grave (create a web chat)
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
  
  await supervisorPage.bringToFront();
  
  // Navigate to Cradle to Grave
  await supervisorPage.hover('[data-cy="sidenav-menu-REPORTS"]');
  await supervisorPage.click(':text("Cradle to Grave")');
  
  //REQ 14 Chat logged in Cradle to Grave
  // Filter by Agent used in Web Chat
  await supervisorPage.click(
    '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
  );
  await supervisorPage.click(
    '[data-cy="xima-list-select-option"] :text("WebRTC Agent 3(205)")',
  );
  await supervisorPage.click(
    '[data-cy="agents-roles-dialog-apply-button"]',
  );
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // CLick the Up Arrow Icon to Expand correct chat
  // await supervisorPage.locator('[data-cy="cradle-to-grave-table-expand-row-button"]').last().click();
  
  // Assert:
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
      `:text("WebRTC Agent 3"):below(:text("Receiving Party")) >> nth=0`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-header-cell-DURATION"] :text("Duration")',
    ),
  ).toBeVisible();
  await expect(
    supervisorPage
      .locator(
        '[data-cy="cradle-to-grave-table-note-button"]:below(:text("Notes"))',
      )
      .last(),
  ).toBeVisible();
  
});
import { createCall, inputDigits, logInSupervisor, logInWebRTCAgent, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_4_quote_needed", async () => {
 // Step 1. Send Email 4: "Quote Needed"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Go to page
  const { browser, context } = await launch();
  const page = await context.newPage();
  
  // Clean up - reset emails in agents' dashboards if present
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  // Log in as WebRTC Agent 49
  const {
    browser: agent1browser,
    context: agent1context,
    page: agent1page,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_49_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Login as Supervisor
  const {
    context: supervisorContext,
    browser: supervisorBrowser,
    page: supervisorPage,
  } = await logInSupervisor();
  
  // Store current datetime for later use in identifying correct email
  const after = new Date();
  
  // Set up email for sending
  const {
    emailAddress: email,
    sendMessage,
    waitForMessage,
    waitForMessages,
  } = await getInbox();
  
  // Set up email for cc'ing
  const {
    emailAddress: emailCC,
    waitForMessage: waitForMessageCC,
    waitForMessages: waitForMessagesCC,
  } = await getInbox({
    new: true,
  });
  
  await page.bringToFront();
  await page.goto(`${process.env.DEFAULT_URL}`);
  
  // Wait a moment for emails to load if any
  await agent1page.bringToFront();
  
  // Toggle Agent status to Ready
  await agent1page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await agent1page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  await agent1page.waitForTimeout(10000);
  
  let counter = 0;
  while (
    (await agent1page
      .locator(`[data-cy="active-media-tile-EMAIL"]`)
      .isVisible()) &&
    counter < 10
  ) {
    // Check for existence of the email
    const emailElement = agent1page.locator(
      '[data-cy="active-media-tile-EMAIL"]',
    );
  
    // Break out of loop if no more emails are found
    if (!(await emailElement.isVisible())) {
      break;
    }
  
    // Click into email
    await emailElement.click();
  
    // Mark email as complete
    await agent1page.locator(`:text("Mark as Complete")`).click();
  
    // Delay/wait for any other emails to populate
    await agent1page.waitForTimeout(15000); // 15 seconds delay
  }
  
  // Toggle Agent status to On DND
  await agent1page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await agent1page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Lunch",
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Send Email 4 with CC to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  console.log("emailCC", emailCC);
  const email4 = await sendMessage({
    html: "<body>I need you to look at this proposal</body>",
    subject: "Email 4: Quote Needed (Skill 19)",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
    cc: [`${emailCC}`],
  });
  
  // Add minor delay for queue time to develop in C2G
  await agent1page.waitForTimeout(2 * 30000);
  
  // Toggle skills 19 and 20 on for WebRTC Agent 49
  await agent1page.click('[data-cy="channel-state-manage-skills"]');
  await agent1page.click(':text("All Skills Off")');
  await agent1page.waitForTimeout(1000);
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 19") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 20") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.waitForTimeout(1000);
  await agent1page.click("xima-dialog-header button");
  
  // Toggle Agent status to Ready for WebRTC Agent 49
  await agent1page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await agent1page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Toggle on Channel States for WebRTC Agent 49
  await agent1page.waitForTimeout(5000);
  await toggleStatusOn(agent1page);
  await expect(
    agent1page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    agent1page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  try {
    await expect(
      agent1page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch {
    // Email icon will not be green if email is present
    await expect(
      agent1page.locator(`[data-cy="active-media-chat-email"]`),
    ).toBeVisible();
  }
  
  // Add minor delay for queue time to develop in C2G
  await agent1page.waitForTimeout(30000);
  
  // Click into active email
  await agent1page.locator('[data-cy="active-media-chat-email"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert agent receives one email only
  expect(
    await agent1page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert active email was selectable
  await expect(agent1page.locator(':text-is("Details")')).toBeVisible();
  await expect(agent1page.locator(':text-is("Notes")')).toBeVisible();
  await expect(agent1page.locator(':text-is("Codes")')).toBeVisible();
  
  // Assert that email subject is visible
  await expect(agent1page.locator('[placeholder="Subject"]')).toBeVisible();
  
  // Assert that email body is visible
  await expect(agent1page.locator("#email-body")).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  await agent1page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click into the email received
  await agent1page.locator('[data-cy="active-media-tile-EMAIL"]').click();
  
  // Type out a response
  let emailResponse = faker.lorem.sentences(1);
  await agent1page.locator('[contenteditable="true"]').waitFor();
  await agent1page.locator('[contenteditable="true"]').click();
  await agent1page.waitForTimeout(1500);
  await agent1page
    .locator('[contenteditable="true"]')
    .pressSequentially(emailResponse, { delay: 250 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert agent receives one email only
  expect(
    await agent1page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert Agent receives "Email 4: Quote Needed"
  await expect(
    agent1page.locator('[data-cy="media-renderer-header-title"]'),
  ).toContainText("Email 4: Quote Needed");
  
  // Assert email's contact details in the details pane
  await expect(
    agent1page.locator('[data-cy="active-media-chat-email"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert able to see cc'd party in the "TO" field of the response
  await expect(agent1page.locator(`:text("${emailCC}")`)).toBeVisible();
  
  // Assert that the targert skill is 'Skill 19'
  await expect(
    agent1page.locator('[data-cy="email-details-targetSkill"]'),
  ).toContainText("Skill 19");
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Simulate an outbound call into Skill 19
  let callId = await createCall({ number: "4352437430" });
  console.log("CALL ID: " + callId);
  await agent1page.waitForTimeout(3000);
  await inputDigits(callId, [9]);
  
  // Agent 1 receives phone call and answers
  await expect(agent1page.locator("text=Incoming Call")).toBeVisible({
    timeout: 60000,
  });
  await agent1page.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Active media adds the phone call and agent can see call details
  await agent1page.waitForTimeout(2000);
  await expect(
    agent1page.locator(`[data-cy="active-media-tile-VOICE"]`),
  ).toBeVisible();
  await agent1page.locator(`[data-cy="active-media-tile-VOICE"]`).click();
  await expect(agent1page.locator("text=Customer Details")).toBeVisible();
  await expect(agent1page.locator("text=Caller Id")).toBeVisible();
  await expect(agent1page.locator("text=Dialed Party Number")).toBeVisible();
  await expect(agent1page.locator("text=External Party Number")).toBeVisible();
  await expect(agent1page.locator("text=Media Details")).toBeVisible();
  await expect(agent1page.locator("text=Wait Time")).toBeVisible();
  await expect(agent1page.locator("text=Target Skill")).toBeVisible();
  await expect(
    agent1page.locator(`app-active-media-details-translation:text("Tag")`),
  ).toBeVisible();
  await expect(agent1page.locator("text=Call Direction")).toBeVisible();
  
  // WebRTC Agent 49 still able to view phone call
  await expect(agent1page.locator(`xima-call .title`)).toBeVisible();
  await expect(agent1page.locator(`:text("Call Active")`)).toBeVisible();
  await expect(
    agent1page.locator(`[data-cy="active-media-tile-VOICE"]`),
  ).toBeVisible();
  
  // End call
  await agent1page.locator(`[data-cy="end-call-btn"]`).click();
  await agent1page.locator(`[data-cy="alert-after-call-work-done"]`).click();
  await agent1page.waitForTimeout(15000);
  await agent1page.locator(`[data-cy="finish-btn"]`).click();
  
  // Click into Email 4: Quote Needed
  await agent1page.locator(`[data-cy="active-media-tile-EMAIL"]`).click();
  
  // Assert user still able to see email in active media
  await expect(
    agent1page.locator('[data-cy="media-renderer-header-title"]'),
  ).toContainText("Email 4: Quote Needed", { timeout: 10000 });
  
  // Add minor delay for email time to develop in C2G
  await agent1page.waitForTimeout(3000);
  
  // Assert agent still able to see previous sentence
  await expect(agent1page.locator(`:text("${emailResponse}")`)).toBeVisible();
  
  // Add one more sentence to email response
  let emailResponseContinue = `${emailResponse} ${faker.lorem.sentences(1)}`;
  await agent1page
    .locator('[contenteditable="true"]')
    .fill(emailResponseContinue);
  await agent1page.waitForTimeout(5000);
  
  // Click 'Send' to submit response
  await agent1page.locator(`[data-cy="email-footer-send-button"]`).click();
  
  // Click 'Done'
  await agent1page.locator(`.done`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that Email 4 is no longer in agent's queue
  try {
    // If agent still has active emails incoming
    await expect(
      agent1page.locator('[data-cy="active-media-tile-EMAIL"]'),
    ).not.toContainText("Email 4", { timeout: 10000 });
  } catch {
    // If agent has no active emails
    await expect(
      agent1page.locator('[data-cy="active-media-tile-EMAIL"]'),
    ).not.toBeVisible({ timeout: 10000 });
  }
  
  // Assert that sender receives reply
  // Assert that the sender receives a response
  const messages = await waitForMessages({ after });
  const message = messages.find((message) =>
    message.subject.includes("Email 4: Quote Needed"),
  );
  expect(message).toBeTruthy();
  console.log(`message:`, message);
  console.log(`messages:`, messages);
  console.log("emailResponseContinue", emailResponseContinue);
  
  // Assert that the received email contains response UC Agent Stephanie P2 wrote
  const emailPage = await context.newPage();
  await emailPage.setContent(message.html);
  expect(message.text).toContain(emailResponseContinue);
  
  // Assert that CC'ed party is included in cc object
  expect(message.cc).toContain(emailCC);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Click Cradle to Grave
  await supervisorPage.bringToFront();
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).waitFor();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).click();
  
  // Click into Channels filter and apply Emails filter
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-container"]:has-text("Channels") [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      `[data-cy="checkbox-tree-property-option"]:has-text("Emails") .mdc-checkbox`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // date filter
  await supervisorPage
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await supervisorPage
    .locator(`[aria-pressed="false"]:has-text("1") >> nth=0`)
    .click();
  await supervisorPage.locator(`[aria-current="date"]`).click();
  
  // Click into Agent for Filter Results
  try {
    await supervisorPage
      .locator(
        `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
      )
      .click({ timeout: 3000 });
  } catch {
    await supervisorPage.locator(`[aria-current="date"]`).click();
    await supervisorPage
      .locator(
        `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
      )
      .click();
  }
  
  await supervisorPage.waitForTimeout(1000);
  
  // Search for, select, and apply filter for WebRTC Agent 49
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 49`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // Search for Skill 19 and apply
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text-is("Skill 19")`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // Click 'Apply' button for filter results
  await supervisorPage
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  // wait for results to load
  await expect(supervisorPage.getByRole("progressbar")).toBeVisible();
  await expect(supervisorPage.getByRole("progressbar")).not.toBeVisible();
  
  // Sort by latest
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  // Sort by latest
  // await supervisorPage
  //   .locator(
  //     `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`
  //   )
  //   .click();
  
  // Move first columns into view
  const numberOfPresses = 50;
  for (let i = 0; i < numberOfPresses; i++) {
    await supervisorPage.keyboard.press("ArrowLeft");
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Expand the latest email
  await supervisorPage.waitForTimeout(5000);
  
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`,
    )
    .click();
  
  // Click "View Email" (in ellipsis on far left)
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-collapse-row-button"] + :has-text("Email") >> nth=0`,
    )
    .hover();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-cell-INFO"] [data-mat-icon-name*="more"]:visible >> nth=0`,
    )
    .click();
  await supervisorPage.locator(`:text("View Email")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert email subject is "Email 4: Quote Needed"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`),
  ).toContainText(`Email 4: Quote Needed`);
  
  // Assert can see full content of email in the preview
  await supervisorPage.locator(`xima-email-message >> nth=0`).click();
  await expect(supervisorPage.locator(`#email-body`)).toHaveText(
    `I need you to look at this proposal`,
  );
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Assert email is routed to Skill 19
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("QUEUED")) >> nth=0`,
    ),
  ).toContainText("Skill 19");
  
  // Assert "Message Received" event
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Message Received")`,
    ),
  ).toBeVisible();
  
  // Assert "Queued" event and the duration is more than 0:00:00
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"] :text("Queued")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Queued")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert "Pending Agent Review" event with the correct agent (first Agent - WebRTC Agent 49)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`,
    ),
  ).toBeVisible();
  
  // Assert 'Pending Agent Review' with correct agent (WebRTC Agent 49)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`,
    ),
  ).toContainText("WebRTC Agent 49");
  
  // Assert FIRST "Focused" event and the duration is more than 0:00:00
  await expect(supervisorPage.locator("text=Focused >> nth=0")).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Focused")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert 'On Hold' event and duration is more than 0:00:00
  await expect(supervisorPage.locator("text=On Hold >> nth=0")).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("On Hold")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert SECOND "Focused" event and the duration is more than 0:00:00
  await expect(supervisorPage.locator("text=Focused >> nth=1")).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Focused")) >> nth=1',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert "Message Sent" event
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Message Sent")`,
    ),
  ).toBeVisible();
  
  // Assert "Completed" event
  // await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-row-details-cell-INFO"] :text("Completed")`)).toBeVisible();
  
 // Step 2. Type out one sentence of the reply
  
 // Step 3. Call into skill Skill 3
  
 // Step 4. Agent 1 concludes phone call
  
 // Step 5. Add more content (one more sentence)
  
 // Step 6. Cradle to Grave - Fourth Email on List
  
});
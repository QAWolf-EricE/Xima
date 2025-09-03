import { logInAgent, logInSupervisor, logInWebRTCAgent, logUCAgentIntoUCWebphone, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_2_i_need_help", async () => {
 // Step 1. Send Email 2: "I need help"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Clean up - reset emails in agents' dashboards if present
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  // Log in as WebRTC Agent 20
  const {
    browser: agent1browser,
    context: agent1context,
    page: agent1page,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_11_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Log in as UC agent
  const { page: agent2page, browser: agent2browser } = await logInAgent({
    email: process.env.UC_AGENT_18_EXT_118,
    password: process.env.UC_AGENT_18_EXT_118_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Log UC agent into webphone
  await logUCAgentIntoUCWebphone(
    agent2browser,
    process.env.UC_AGENT_18_EXT_118_WEBPHONE_USERNAME,
  );
  
  // Login as Supervisor
  const { browser: supervisorBrowser, page: supervisorPage } =
    await logInSupervisor();
  
  // log in to outlook email
  const email = process.env.OUTLOOK_EMAIL;
  const emailPage = await agent1context.newPage();
  await emailPage.goto("https://outlook.com");
  await emailPage.waitForTimeout(5000);
  await expect(
    emailPage.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await emailPage.getByRole("link", { name: "Sign in", exact: true }).click();
  await emailPage
    .getByRole(`textbox`, { name: `Enter your email, phone, or` })
    .fill(email);
  await emailPage.getByRole(`button`, { name: `Next` }).click();
  await emailPage.waitForTimeout(1000);
  await emailPage.getByRole(`button`, { name: `Use your password` }).click();
  await emailPage.waitForTimeout(1000);
  
  await emailPage
    .getByRole(`textbox`, { name: `Password` })
    .fill(process.env.OUTLOOK_PASS);
  
  try {
    // Click the "Sign in" button
    await emailPage
      .getByRole(`button`, { name: `Sign in` })
      .click({ timeout: 3 * 1000 });
  } catch {
    // Click the "Next" button
    await emailPage.locator(`[data-testid="primaryButton"]`).click();
  }
  await emailPage.getByRole(`button`, { name: `No` }).click();
  
  // Store current datetime for later use in identifying correct email
  const after = new Date();
  
  await agent1page.bringToFront();
  const stateButton = agent1page.locator(
    `[data-cy="channel-state-label"] + div > button`,
  );
  const readyStateBtn = agent1page.getByRole(`menuitem`, { name: `Ready` });
  const lunchStateBtn = agent1page.getByRole(`menuitem`, { name: `Lunch` });
  
  // Toggle Agent status to Ready
  await stateButton.click();
  await readyStateBtn.click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Wait a moment for emails to load if any
  await agent1page.waitForTimeout(5000);
  
  let counter = 0;
  while (counter < 15) {
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
    counter += 1;
  }
  // Toggle Agent status to On DND
  await stateButton.click();
  await lunchStateBtn.click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Lunch",
  );
  
  // Toggle skills 76 and 77 on for WebRTC Agent 11
  await agent1page.click('[data-cy="channel-state-manage-skills"]');
  await agent1page.click(':text("All Skills Off")');
  await agent1page.waitForTimeout(1000);
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 76") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 77") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.waitForTimeout(1000);
  await agent1page.click("xima-dialog-header button");
  
  // Toggle Agent status to Ready for WebRTC Agent 20
  await stateButton.click();
  await readyStateBtn.click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Toggle on Channel States for WebRTC Agent 20
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
    await expect(
      agent1page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  
  await agent2page.bringToFront();
  const stateButton2 = agent2page.locator(
    `[data-cy="channel-state-label"] + div > button`,
  );
  const readyStateBtn2 = agent2page.getByRole(`menuitem`, { name: `Ready` });
  const lunchStateBtn2 = agent2page.getByRole(`menuitem`, { name: `Lunch` });
  
  // Toggle Agent status to Ready
  await stateButton2.click();
  await readyStateBtn2.click();
  await expect(agent2page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Wait a moment for emails to load if any
  await agent2page.waitForTimeout(5000);
  
  for (let i = 0; i < 10; i++) {
    // Check for existence of the email
    const emailElement = agent2page.locator(
      '[data-cy="active-media-tile-EMAIL"]',
    );
  
    // Break out of the loop if no more emails are found
    if (!(await emailElement.isVisible())) {
      break;
    }
  
    // Click into email
    await emailElement.click();
  
    // Mark email as complete
    await agent2page.locator(`:text("Mark as Complete")`).click();
  
    // Delay/wait for any other emails to populate
    await agent2page.waitForTimeout(15000); // 15 seconds delay
  }
  // Toggle Agent status to On DND
  await stateButton2.click();
  await lunchStateBtn2.click();
  await expect(agent2page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Lunch",
  );
  
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Send Email 2 to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  // await sendMessage({
  //   html: "<body>What is your warranty for part 98447?</body>",
  //   subject: "Email 2: I need help (Skill 75)",
  //   to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
  // });
  await emailPage.bringToFront();
  await emailPage
    .locator(`[aria-label="New mail"] [aria-label="New mail"]`)
    .click();
  await emailPage
    .locator(`[aria-label="To"]`)
    .fill("ximaqawolf1@ximasoftwaretest.onmicrosoft.com");
  await emailPage
    .locator(`[aria-label="Subject"]`)
    .fill("Email 2: I need help (Skill 75)");
  await emailPage
    .locator(`#docking_DockingTriggerPart_0 [contenteditable="true"]`)
    .fill("What is your warranty for part 98447?");
  await emailPage
    .locator(`[data-testid="ComposeSendButton"] :text("Send")`)
    .click();
  
  // Delay/wait for any other emails to populate
  await agent2page.bringToFront();
  await agent2page.waitForTimeout(30000);
  
  // Toggle Agent status to Ready
  await stateButton2.click();
  await readyStateBtn2.click();
  await expect(agent2page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Toggle skills 75, 76, 77 on for UC Agent
  await agent2page.click('[data-cy="channel-state-manage-skills"]');
  await agent2page.click(':text("All Skills Off")');
  await agent2page.waitForTimeout(1000);
  await agent2page.click(
    `[class*="skill"]:has(:text-is("Skill 75")) [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 76") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 77") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.waitForTimeout(1000);
  await agent2page.click("xima-dialog-header button");
  
  // Toggle on Channel States
  await agent2page.waitForTimeout(5000);
  await toggleStatusOn(agent2page);
  await expect(
    agent2page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    agent2page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  try {
    await expect(
      agent2page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch {
    // If there is an email visible the email icon will not be green
    await expect(
      agent2page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  // await expect(
  //   agent2page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
  // ).toHaveCSS("color", "rgb(49, 180, 164)"); // https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1705520442064509?thread_ts=1705516983.009159&cid=C03PG5DB4N9
  
  // Add minor delay for focus time to develop in C2G
  await agent2page.waitForTimeout(15000);
  
  // Click into active email
  await agent2page.locator('[data-cy="active-media-chat-email"]').click();
  
  // Assert agent receives one email only
  expect(
    await agent2page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert active email was selectable
  await expect(agent2page.locator(':text-is("Details")')).toBeVisible();
  await expect(agent2page.locator(':text-is("Notes")')).toBeVisible();
  await expect(agent2page.locator(':text-is("Codes")')).toBeVisible();
  
  // Assert that email subject is visible
  await expect(agent2page.locator('[placeholder="Subject"]')).toBeVisible();
  
  // Assert that email body is visible
  await expect(agent2page.locator("#email-body")).toBeVisible();
  
  await agent2page.bringToFront();
  
  // Click into the email received
  await agent2page.locator('[data-cy="active-media-tile-EMAIL"]').click();
  
  // Add minor delay for email time to develop in C2G
  await agent2page.waitForTimeout(15000);
  
  // Assert agent receives one email only
  expect(
    await agent2page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert Agent receives "Email 2: I need help"
  await expect(
    agent2page.locator('[data-cy="media-renderer-header-title"]'),
  ).toContainText("Email 2: I need help");
  
  // Assert email's contact details in the details pane
  await expect(
    agent2page.locator('[data-cy="active-media-chat-email"]'),
  ).toContainText(email);
  
  // Assert that the targert skill is 'Skill 75'
  await expect(
    agent2page.locator('[data-cy="email-details-targetSkill"]'),
  ).toContainText("Skill 75");
  
  // Type out a response
  let emailResponse = faker.lorem.sentences(2);
  await agent2page.locator('[contenteditable="true"]').fill(emailResponse);
  
  // Click Notes tab
  await agent2page.locator(':text("Notes")').click();
  await agent2page.waitForTimeout(1000);
  
  // Add notes to the communication
  const notes = faker.lorem.sentences(1);
  await agent2page.locator("textarea").fill(notes);
  await agent2page.waitForTimeout(1000);
  await agent2page.locator(`:text("Post")`).click();
  await agent2page.waitForTimeout(1000);
  
  // Add 2 account codes to communication
  await agent2page.locator(':text("Codes")').click();
  await agent2page.waitForTimeout(1000);
  await agent2page
    .locator('[id*="mat-select"]:above(:text("Post")) >> nth=0')
    .click();
  await agent2page.waitForTimeout(1000);
  await agent2page.locator(`:text("During Call")`).click();
  await agent2page.waitForTimeout(1000);
  await agent2page.locator(`:text("Post")`).click();
  await agent2page.waitForTimeout(1000);
  await agent2page
    .locator('[id*="mat-select"]:above(:text("Post")) >> nth=0')
    .click();
  await agent2page.waitForTimeout(1000);
  await agent2page.locator(`:text("Test Code")`).click();
  await agent2page.waitForTimeout(1000);
  await agent2page.locator(`:text("Post")`).click();
  await agent2page.waitForTimeout(1000);
  
  // Agent goes to DND
  await stateButton2.click();
  await lunchStateBtn2.click();
  
  // Send email out
  await agent2page.locator('[data-cy="email-footer-send-button"]').click();
  await agent2page.locator(':text("Done")').click();
  
  // Assert that Email 2 is no longer in agent's queue
  try {
    // If agent still has active emails incoming
    await expect(
      agent2page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toContainText("Email 2: I need help", { timeout: 10000 });
  } catch {
    // If agent has no active emails
    await expect(
      agent2page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toBeVisible({ timeout: 10000 });
  }
  
  // Assert that the sender receives a response
  await emailPage.bringToFront();
  await emailPage.waitForTimeout(5000);
  await emailPage.locator('[role="option"]:has-text("Email 2:")').first().click();
  const receivedMessage = await emailPage
    .locator(`[role="document"] span`)
    .innerText();
  
  // Assert that the received email contains response UC Agent Stephanie P wrote
  expect(receivedMessage).toContain(emailResponse);
  expect(receivedMessage).toBeTruthy();
  
  // Reply to the received message
  const email2Response = faker.lorem.sentences(2);
  // const reply = await sendMessage({
  //   to: [receivedMessage.from],
  //   subject: `Re: ${receivedMessage.subject}`,
  //   // add some text to email response body
  //   html: `<body>${email2Response}</body>`,
  // });
  await emailPage.locator(`[aria-label="Reply"] .fui-Button__icon`).click();
  await emailPage
    .getByRole(`textbox`, { name: `Message body` })
    .fill(email2Response);
  await emailPage
    .locator(`[data-testid="ComposeSendButton"] :text("Send")`)
    .click();
  
  // Confirm Agent 1 did NOT receive this email response
  await agent1page.bringToFront();
  await agent1page.waitForTimeout(3000);
  
  // Assert WebRTC Agent 20 should not have any emails at this point
  await expect(
    agent1page.locator(`[data-cy="active-media-chat-recent-message"]`),
  ).not.toBeVisible();
  
  // Assert that WebRTC Agent 20 does not receive the Email 2 response
  await expect(
    agent1page.locator("text=Re: Email 2: I need help"),
  ).not.toBeVisible();
  
  // Navigate to UC Agent Stephanie P's dashboard
  await agent2page.bringToFront();
  
  // make sure agent ready
  try {
    await expect(
      agent2page.locator(
        `[data-cy="channel-state-dnd-toggle"]:has-text("Ready")`,
      ),
    ).toBeVisible({ timeout: 3000 });
  } catch {
    await stateButton2.click();
    await readyStateBtn2.click();
  }
  
  // Add minor delay for email time to develop in C2G
  await agent2page.waitForTimeout(30 * 1000);
  
  // Assert that Agent 2 received the email response
  await agent2page.locator(`[data-cy="active-media-chat-username"]`).click();
  await expect(
    agent2page.locator(`[data-cy="active-media-chat-recent-message"]`),
  ).toBeVisible();
  await expect(
    agent2page.locator(
      `[data-cy="media-renderer-header-title"]:has-text("Email 2: I need help (Skill 75)")`,
    ),
  ).toBeVisible({ timeout: 120000 });
  
  // Assert email routed to Skill 9
  await agent2page
    .locator(`[data-cy="active-media-chat-recent-message"]`)
    .click();
  
  // Add minor delay for email time to develop in C2G
  await agent2page.waitForTimeout(15000);
  
  await expect(
    agent2page.locator(`[data-cy="email-details-targetSkill"]`),
  ).toHaveText(`Skill 75`);
  
  // Assert that the response has appropriate body
  await expect(agent2page.locator(`:text("${email2Response}")`)).toBeVisible();
  
  // Click 'Mark as Completed'
  await agent2page.locator(`:text("Mark as Complete")`).click();
  await agent1page.bringToFront();
  
  // Assert that Email 2 is no longer in agent's queue
  try {
    // If agent still has active emails incoming
    await expect(
      agent1page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toContainText("Email 2: I need help", { timeout: 10000 });
  } catch {
    // If agent has no active emails
    await expect(
      agent1page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toBeVisible({ timeout: 10000 });
  }
  
  // Add minor delay for email time to develop in C2G
  await supervisorPage.bringToFront();
  await supervisorPage.waitForTimeout(60 * 1000);
  await supervisorPage.reload();
  
  // Click Cradle to Grave
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).click();
  
  // date filter
  await supervisorPage
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000)
  const todayDay = await supervisorPage.locator(`.mat-calendar-body-today`).innerText();
  if (todayDay !== "1") {
    await supervisorPage
      .locator(`[aria-pressed="false"]:has-text("1") >> nth=0`)
      .click();
    await supervisorPage.locator(`[aria-current="date"]`).click();
  } else {
    await supervisorPage.keyboard.press("Escape")
  }
  
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
  
  // Search for, select, and apply filter for Stephanie P2
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
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 18`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // Search for Skill 9 and apply
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text("Skill 75")`)
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
  
  // Sort by latest
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  // Move first columns into view
  const numberOfPresses = 50;
  for (let i = 0; i < numberOfPresses; i++) {
    await supervisorPage.keyboard.press("ArrowLeft");
  }
  
  // NOTE: this one can be tricky because there are two line items since UC Agent Stephanie receives two separate emails from us > need to switch between and check two separate line items
  // Click "View Email" (in ellipsis on far left) > first email checking is for email2Response
  await supervisorPage.waitForTimeout(5000);
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`,
    )
    .hover();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-cell-INFO"] [data-mat-icon-name*="more"]:visible >> nth=0`,
    )
    .click();
  await supervisorPage.locator(`:text("View Email")`).click();
  
  // Assert can see full content of email in the preview
  await expect(supervisorPage.locator(`#email-body`)).toContainText(
    `${email2Response}`,
    { timeout: 10000 },
  );
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Click "View Email" (in ellipsis on far left) > first email checking is for notes
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=1`,
    )
    .hover();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-cell-INFO"] [data-mat-icon-name*="more"]:visible >> nth=0`,
    )
    .click();
  await supervisorPage.locator(`:text("View Email")`).click();
  
  // Assert notes are visible
  await supervisorPage
    .locator('[class="details-header-title"]:has-text("Notes")')
    .click();
  await expect(supervisorPage.locator(`text=${notes}`)).toBeVisible();
  
  // Assert email subject is "Email 2: I need help"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`),
  ).toContainText(`Email 2: I need help`);
  
  // Assert Account Codes are visible
  await supervisorPage
    .locator('[class="details-header-title"]:has-text("Codes")')
    .click();
  await expect(supervisorPage.locator(`:text("No Codes")`)).not.toBeVisible();
  await expect(
    supervisorPage.locator(`[data-cy="code-item"] :text("During Call")`),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(`[data-cy="code-item"] :text("Test Code")`),
  ).toBeVisible();
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Assert email is routed to Skill 9
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=1`,
    )
    .click();
  
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:has-text("Skill 75")`,
    ),
  ).toBeVisible();
  
  // Assert "Message Received" event
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Message Received")`,
    ),
  ).toBeVisible();
  
  // Assert "Queued" event and the duration is more than 0:00:00
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Queued")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Queued")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert 'Pending Agent Review' with correct agent (Xima Agent 18)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`,
    ),
  ).toContainText("Xima Agent 18");
  
  // Assert "Focused" event and the duration is more than 0:00:00
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Focused")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Focused")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert "Message Sent" event
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Message Sent")`,
    ),
  ).toBeVisible();
  
 // Step 2. Send a reply
  
 // Step 3. Agent 2 - Second Response to First Email
  
 // Step 4. Cradle to Grave - Second Email on List
  
});
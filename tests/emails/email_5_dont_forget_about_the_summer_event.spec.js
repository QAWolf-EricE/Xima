import { logInAgent, logInSupervisor, logUCAgentIntoUCWebphone, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_5_dont_forget_about_the_summer_event", async () => {
 // Step 1. Send Email 5: "Don't forget about the Summer Event"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as UC agent
  const { page: agent2page, browser: agent2browser } = await logInAgent({
    email: process.env.UC_AGENT_3_EXT_103,
    password: process.env.UC_AGENT_3_EXT_103_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // log UC agent into webphone
  await logUCAgentIntoUCWebphone(
    agent2browser,
    process.env.UC_AGENT_3_EXT_103_WEBPHONE_USERNAME,
  );
  
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
  
  //--------------------------------
  // Clean up - reset emails in agents' dashboards if present
  //--------------------------------
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  await agent2page.bringToFront();
  
  // Agent comes off DND - Toggle Agent status to Ready
  await agent2page.locator(`.dnd-status-container button`).click();
  await agent2page.locator('[role="menuitem"]:has-text("Ready")').click();
  await expect(agent2page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  // Wait a moment for emails to load if any
  await agent2page.waitForTimeout(3000);
  
  // Check for existence of the email
  const emailElement = agent2page.locator('[data-cy="active-media-tile-EMAIL"]');
  
  // Break out of the loop if no more emails are found
  if (await emailElement.isVisible()) {
    // break;
    // Click into email
    await emailElement.click();
  
    // Mark email as complete
    await agent2page.locator(`:text("Mark as Complete")`).click();
  
    // Delay/wait for any other emails to populate
    await agent2page.waitForTimeout(15000); // 15 seconds delay
  }
  
  // Toggle Agent status to On DND
  await agent2page.locator(`.dnd-status-container button`).click();
  await agent2page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    agent2page.locator('.dnd-status-container [data-mat-icon-name="dnd"]'),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Toggle skills 25,26,27 on for UC Agent Stephanie P
  await agent2page.click('[data-cy="channel-state-manage-skills"]');
  await agent2page.click(':text("All Skills Off")');
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 25") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 26") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 27") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click("xima-dialog-header button");
  
  // Send Email 5 to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  const email5 = await sendMessage({
    html: "<body>BBQ is on the 5th of July!</body>",
    subject: "Email 5: Don't forget about the Summer Event (Skill 25)",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
  });
  
  // Add minor delay for queue time to develop in C2G
  await agent2page.waitForTimeout(60 * 1000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert agent did NOT receive an email while on DND
  await expect(
    agent2page.locator('[data-cy="active-media-chat-recent-message"]'),
  ).not.toBeVisible();
  
 // Step 2. Agent 2 comes off DND
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Agent comes off DND - Toggle Agent status to Ready
  await agent2page.locator(`.dnd-status-container button`).click();
  await agent2page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(agent2page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
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
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 5000 });
  } catch {
    // If there is an email present we will not see the email icon change colors
    await expect(
      agent2page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  
  // Click into the email received after coming back from DND
  await agent2page.locator('[data-cy="active-media-tile-EMAIL"]').click();
  
  // Add minor delay for email time to develop in C2G
  await agent2page.waitForTimeout(3000);
  
  // Assert agent receives one email only
  expect(
    await agent2page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert Agent receives "Email 5: Don't forget about the Summer Event"
  await expect(
    agent2page.locator('[data-cy="media-renderer-header-title"]'),
  ).toContainText("Email 5: Don't forget about the Summer Event");
  
  // Assert email's contact details in the details pane
  await expect(
    agent2page.locator('[data-cy="active-media-chat-email"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert that the targert skill is 'Skill 25'
  await expect(
    agent2page.locator('[data-cy="email-details-targetSkill"]'),
  ).toContainText("Skill 25");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click 'Mark as Complete'
  await agent2page.locator(`:text("Mark as Complete")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that Email 5 is no longer in agent's queue
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
  
 // Step 3. Cradle to Grave - Fifth Email on List
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  await supervisorPage.bringToFront();
  // Click Cradle to Grave
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).click();
  
  // Click into Channels filter and apply Emails filter
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-container"]:has-text("Channels") [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage
    .locator(
      `[data-cy="checkbox-tree-property-option"]:has-text("Emails") .mdc-checkbox`,
    )
    .click();
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
  await supervisorPage.waitForTimeout(2000)
  const todayDay = await supervisorPage.locator(`.mat-calendar-body-today`).innerText();
  if (todayDay !== "1") {
    await supervisorPage
      .locator(`[aria-pressed="false"]:has-text("1") >> nth=0`)
      .click();
    await supervisorPage.locator(`[aria-current="date"]`).click();
  } else {
    await supervisorPage.keyboard.press("Escape")
  }
  
  // Click into Agent for Filter Results
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
  
  // Search for, select, and apply filter for xima agent 3
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`xima agent 3`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  
  // Search for Skill 25 and apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text("Skill 25")`)
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
  
  // Move first columns into view
  const numberOfPresses = 50;
  for (let i = 0; i < numberOfPresses; i++) {
    await supervisorPage.keyboard.press("ArrowLeft");
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click "View Email" (in ellipsis on far left)
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
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert email subject is "Email 5: Don't forget about the Summer Event"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`),
  ).toContainText(`Email 5: Don't forget about the Summer Event`);
  
  // Assert can see full content of email in the preview
  await expect(supervisorPage.locator(`#email-body`)).toHaveText(
    `BBQ is on the 5th of July!`,
    { timeout: 10000 },
  );
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Assert email is routed to Skill 25
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`,
    )
    .click();
  
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:has-text("Skill 25")`,
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
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"] :text("Queued")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Queued")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert 'Pending Agent Review' with correct agent (xima agent 3)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`,
    ),
  ).toContainText("Xima Agent 3");
  
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
  
  // Assert that 'Marked as Complete' event occurred
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Agent Marked As Completed")`,
    ),
  ).toBeVisible();
  
});
import { logInAgent, logInSupervisor, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_6_make_10_k_a_week", async () => {
 // Step 1. Send Email 6: "Make $10k a week!"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as UC agent
  const { page: agent2page, browser: agent2browser } = await logInAgent({
    email: process.env.UC_AGENT_6_EXT_106,
    password: process.env.UC_AGENT_6_EXT_106_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Login as Supervisor
  const { page: supervisorPage } = await logInSupervisor({
    timezoneId: "America/Denver",
  });
  
  // Store current datetime for later use in identifying correct email
  const after = new Date();
  
  // Set up email for sending
  const { emailAddress: email, sendMessage } = await getInbox();
  
  // Set up email for cc'ing
  const { emailAddress: emailCC } = await getInbox({
    new: true,
  });
  
  // Clean up - reset emails in agents' dashboards if present
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  const stateButton = agent2page.locator(
    `[data-cy="channel-state-label"] + div > button`,
  );
  const readyStateBtn = agent2page.getByRole(`menuitem`, { name: `Ready` });
  const lunchStateBtn = agent2page.getByRole(`menuitem`, { name: `Lunch` });
  await agent2page.bringToFront();
  
  // Toggle Agent status to Ready
  await stateButton.click();
  await readyStateBtn.click();
  
  // Wait a moment for emails to load if any
  await agent2page.waitForTimeout(5000);
  
  // Check for existence of the email
  const emailElement = agent2page.locator('[data-cy="active-media-tile-EMAIL"]');
  
  let counter = 0;
  while ((await emailElement.isVisible()) && counter < 10) {
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
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Toggle Agent status to On DND
  await stateButton.click();
  await lunchStateBtn.click();
  await expect(agent2page.locator(`[data-cy="channel-state-label"]`)).toHaveText(
    `Lunch`,
  );
  
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Send Email 6 to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  const email6 = await sendMessage({
    html: "<body>Want to make big money?</body>",
    subject: "Email 6: Make $10k a week! (Skill 14)",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
  });
  
  // Add minor delay for queue time to develop in C2G
  await agent2page.waitForTimeout(30000);
  
  // Agent comes off DND - Toggle Agent status to Ready
  await stateButton.click();
  await readyStateBtn.click();
  
  // Toggle skills 13, 14, 15 on for UC Agent 6
  await agent2page.click('[data-cy="channel-state-manage-skills"]');
  await agent2page.click(':text("All Skills Off")');
  await agent2page.waitForTimeout(1000);
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 13") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 14") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent2page.click(
    `[class*="skill"]:has-text("Skill 15") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
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
  
  // Add minor delay for queue time to develop in C2G
  await agent2page.waitForTimeout(15000);
  
  // Click into active email
  await agent2page.locator('[data-cy="active-media-chat-email"]').click();
  
  // Add minor delay for focus time to develop in C2G
  await agent2page.waitForTimeout(15000);
  
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
  
  // Click into the email received
  await agent2page.locator('[data-cy="active-media-tile-EMAIL"]').click();
  
  // Add minor delay for email time to develop in C2G
  await agent2page.waitForTimeout(30 * 1000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert agent receives one email only
  expect(
    await agent2page.locator('[data-cy="active-media-chat-email"]').count(),
  ).toBe(1);
  
  // Assert Agent receives "Email 6: Make $10k a week!"
  await expect(
    agent2page.locator('[data-cy="media-renderer-header-title"]'),
  ).toContainText("Email 6: Make $10k a week!");
  
  // Assert email's contact details in the details pane
  await expect(
    agent2page.locator('[data-cy="active-media-chat-email"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert that the targert skill is 'Skill 14'
  await expect(
    agent2page.locator('[data-cy="email-details-targetSkill"]'),
  ).toHaveText("Skill 14");
  
  // Assert the sending party as the "To" in Agent's response
  await expect(
    agent2page.locator('[id*="mat-mdc-chip"][role="row"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert the "From" email is ximaqawolf1@ximasoftwaretest.onmicrosoft.com
  await expect(agent2page.locator('[name="from"]')).toContainText(
    "ximaqawolf1@ximasoftwaretest.onmicrosoft.com",
  );
  
 // Step 2. Mark as spam
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Assert that agent able to view 'Mark as Spam' button
  await expect(
    agent2page.locator(`[data-mat-icon-name="mark-as-spam"]`),
  ).toBeVisible();
  
  // Click 'Mark as Spam' button
  await agent2page.waitForTimeout(2000);
  await agent2page.locator(`[data-mat-icon-name="mark-as-spam"]`).click();
  
  // Assert agent receives message to confirm spam
  await agent2page.waitForTimeout(2000);
  await expect(agent2page.locator("text=Mark Email as Spam")).toBeVisible();
  
  // Click confirm to accept mail as spam
  await agent2page.waitForTimeout(2000);
  await agent2page.locator(`:text("Confirm")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that Email 6 is no longer in agent's queue
  try {
    // If agent still has active emails incoming
    await expect(
      agent2page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toContainText("Email 6", { timeout: 10000 });
  } catch {
    // If agent has no active emails
    await expect(
      agent2page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).not.toBeVisible({ timeout: 10000 });
  }
  
  await supervisorPage.bringToFront();
  
 // Step 3. Cradle to Grave - Sixth Email on List
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click Cradle to Grave
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
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
  
  // Click into Agent for Filter Results
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  
  // Search for, select, and apply filter for Xima Agent 6
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 6`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  
  // Search for Skill 14 and apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text-is("Skill 14")`)
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
  // Assert email subject is "Email 6: Make $10k a week!"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`),
  ).toContainText(`Email 6: Make $10k a week!`);
  
  // Assert can see full content of email in the preview
  await expect(supervisorPage.locator(`#email-body`)).toHaveText(
    `Want to make big money?`,
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
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:has-text("Skill 14")`,
    ),
  ).toBeVisible();
  
  // Assert "Message Received" event
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"] :text("Message Received")`,
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
      '[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Queued")',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert 'Pending Agent Review' with correct agent (Xima Agent 6)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`,
    ),
  ).toContainText("Xima Agent 6");
  
  // Assert "Focused" event and the duration is more than 0:00:00
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"] :text("Focused")`,
    ),
  ).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Focused")) >> nth=0',
    ),
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert that 'Marked As Spam' event occurred
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Marked As Spam")`,
    ),
  ).toBeVisible();
  
});
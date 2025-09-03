import { logInSupervisor, logInWebRTCAgent, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_3_become_a_real_estate_apprentice", async () => {
 // Step 1. Send Email 3: "Become a Real Estate Apprentice"
  // state machine: workflow has started running
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Store current datetime for later use in identifying correct email
  const after = new Date();
  
  // Set up email for sending
  const {
    emailAddress: email,
    sendMessage,
    waitForMessage,
  } = await getInbox();
  
  // Set up email for cc'ing
  const {
    emailAddress: emailCC,
    waitForMessage: waitForMessageCC,
  } = await getInbox({ new: true });
  
  // Log in as WebRTC Agent 48
  const { page: agent1page } = await logInWebRTCAgent(process.env.WEBRTCAGENT_48_EMAIL, {
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    permissions: ["microphone", "camera"],
  });
  
  // Login as Supervisor
  const { page: supervisorPage } = await logInSupervisor();
  
  // Wait a moment for emails to load if any
  await agent1page.bringToFront();
  
  // Toggle Agent status to Ready
  await agent1page.locator('[class="dnd-status-container"] button').click();
  await agent1page.getByRole("menuitem", { name: "Ready" }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText("Ready");
  
  //--------------------------------
  // Clean up - reset emails in agents' dashboards if present
  //--------------------------------
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  while (await agent1page.locator('[data-cy="active-media-tile-EMAIL"]').isVisible()) {
    await agent1page.locator('[data-cy="active-media-tile-EMAIL"]').click();
    await agent1page.locator(':text("Mark as Complete")').click();
    await agent1page.waitForTimeout(15000); // 15 seconds delay
  }
  await agent1page.waitForTimeout(2000);
  
  // Toggle Agent status to On DND
  await agent1page.locator('[class="dnd-status-container"] button').click();
  await agent1page.getByRole("menuitem", { name: "Lunch" }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText("Lunch");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Send Email 3 to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  const email3 = await sendMessage({
    html: "<body>It's not a pyramid scheme, I promise!</body>",
    subject: "Email 3: Become a Real Estate Apprentice (Skill 6)",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
  });
  
  // Add minor delay for queue time to develop in C2G
  await agent1page.waitForTimeout(30000);
  
  // Toggle skills 6 and 7 on for WebRTC Agent 48
  await agent1page.click('[data-cy="channel-state-manage-skills"]');
  await agent1page.click(':text("All Skills Off")');
  await agent1page.waitForTimeout(1000);
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 6") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.waitForTimeout(1000);
  await agent1page.click("xima-dialog-header button");
  
  // Toggle Agent status to Ready for WebRTC Agent 48
  await agent1page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await agent1page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Toggle on Channel States for WebRTC Agent 48
  // await agent1page.waitForTimeout(5000);
  await toggleStatusOn(agent1page);
  
  // Toggle off all channels aside from email
  await agent1page.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await agent1page.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="chat"]`)).toBeVisible();
  
  try {
    await expect(
      agent1page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 5000 });
  } catch {
    // Unless there is an active email
    await expect(
      agent1page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  
  // Add minor delay for queue time to develop in C2G
  await agent1page.waitForTimeout(15000);
  
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
  
 // Step 2. Mark as spam
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click into the email received
  await agent1page.locator('[data-cy="active-media-tile-EMAIL"]').click();
  
  // Add minor delay for email time to develop in C2G
  await agent1page.waitForTimeout(5000);
  
  // Assert agent receives one email only
  expect(
    await agent1page.locator('[data-cy="active-media-chat-email"]').count()
  ).toBe(1);
  
  // Assert Agent receives "Email 3: Become a Real Estate Apprentice"
  await expect(
    agent1page.locator('[data-cy="media-renderer-header-title"]')
  ).toContainText("Email 3: Become a Real Estate Apprentice");
  
  // Assert email's contact details in the details pane
  await expect(
    agent1page.locator('[data-cy="active-media-chat-email"]')
  ).toContainText("xima@qawolf.email");
  
  // Assert that the targert skill is 'Skill 6'
  await expect(
    agent1page.locator('[data-cy="email-details-targetSkill"]')
  ).toContainText("Skill 6");
  
  // Assert that agent able to view 'Mark as Spam' button
  await expect(
    agent1page.locator(`[data-mat-icon-name="mark-as-spam"]`)
  ).toBeVisible();
  
  // Click 'Mark as Spam' button
  await agent1page.locator(`[data-mat-icon-name="mark-as-spam"]`).click();
  
  // Assert agent receives message to confirm spam
  await expect(agent1page.locator("text=Mark Email as Spam")).toBeVisible();
  
  // Click confirm to accept mail as spam
  await agent1page.locator(`:text("Confirm")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that Email 3 is no longer in agent's queue
  try {
    // If agent still has active emails incoming
    await expect(
      agent1page.locator('[data-cy="active-media-chat-recent-message"]')
    ).not.toContainText("Email 3", { timeout: 10000 });
  } catch {
    // If agent has no active emails
    await expect(
      agent1page.locator('[data-cy="active-media-chat-recent-message"]')
    ).not.toBeVisible({ timeout: 10000 });
  }
  
  
 // Step 3. Cradle to Grave - Third Email on List
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Click Cradle to Grave
  await supervisorPage.bringToFront();
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).click();
  
  // Click into Channels filter and apply Emails filter
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-container"]:has-text("Channels") [data-cy="xima-preview-input-edit-button"]`
    )
    .click();
  // await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      `[data-cy="checkbox-tree-property-option"]:has-text("Emails") .mdc-checkbox`
    )
    .click();
  // await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-dialog-apply-button"]`)
    .click();
  // await supervisorPage.waitForTimeout(1000);
  
  // Click into Agent for Filter Results
  try {
    await supervisorPage
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  } catch {
    await supervisorPage.locator(`xima-header-add`).getByRole(`button`).click();
    await supervisorPage.locator(`[data-cy="xima-criteria-selector-search-input"]`).fill(`Agent`);
    await supervisorPage.getByText(`Agent`, { exact: true }).click();
    await supervisorPage
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  }
  await supervisorPage.waitForTimeout(1000);
  
  // Search for, select, and apply filter for WebRTC Email Agent
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 48`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // change filter date range
  await supervisorPage.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`
  ); // clicks calendar icon
  await supervisorPage.waitForTimeout(3000);
  const todayDay = await supervisorPage.locator(`.mat-calendar-body-today`).innerText();
  if (todayDay !== "1") {
    await supervisorPage
      .locator(`[aria-pressed="false"]:has-text("1") >> nth=0`)
      .click();
    await supervisorPage.locator(`[aria-current="date"]`).click();
  } else {
    await supervisorPage.keyboard.press("Escape")
  }
  
  
  // Search for Skill 6 and apply
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text-is("Skill 6")`)
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
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`
    )
    .click();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`
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
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`
    )
    .hover();
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-cell-INFO"] [data-mat-icon-name*="more"]:visible >> nth=0`
    )
    .click();
  await supervisorPage.locator(`:text("View Email")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert email subject is "Email 3: Become a Real Estate Apprentice"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`)
  ).toContainText(`Email 3: Become a Real Estate Apprentice`);
  
  // Assert can see full content of email in the preview
  await expect(supervisorPage.locator(`#email-body`)).toHaveText(
    `It's not a pyramid scheme, I promise!`,
    { timeout: 10000 }
  );
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Assert email is routed to Skill 6
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`
    )
    .click();
  
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:has-text("Skill 6")`
    )
  ).toBeVisible();
  
  // Assert "Message Received" event
  await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Message Received")`)).toBeVisible();
  
  // Assert "Queued" event and the duration is more than 0:00:00
  await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Queued")`)).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Queued")) >> nth=0'
    )
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert 'Pending Agent Review' with correct agent (WebRTC Agent 48()
  await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`)).toBeVisible();
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`
    )
  ).toContainText("WebRTC Agent 48(");
  
  // Assert "Focused" event and the duration is more than 0:00:00
  await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Focused")`)).toBeVisible();
  await expect(
    supervisorPage.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-DURATION"]:right-of(:text("Focused")) >> nth=0'
    )
  ).not.toContainText(`0:00:00`, { timeout: 10000 });
  
  // Assert that 'Marked as Spam' event occurred
  await expect(supervisorPage.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Marked As Spam")`)).toBeVisible();
  
});
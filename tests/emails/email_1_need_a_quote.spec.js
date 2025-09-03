import { logInSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("email_1_need_a_quote", async () => {
 // Step 1. Send Email 1: "Need a Quote"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Store current datetime for later use in identifying correct email
  const fs = await import("node:fs/promises");
  const after = new Date();
  
  // Set up email for sending
  const {
    sendMessage,
    waitForMessages,
  } = await getInbox();
  
  // Set up email for cc'ing
  await getInbox({
    new: true,
  });
  
  // Clean up - reset emails in agents' dashboards if present
  // Check for emails > click into email > mark as completed > delay (wait for any other emails to populate)
  // Log in as WebRTC Agent 67
  const {
    page: agent1page,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_67_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // toggle agent status to Ready
  await toggleSkill(agent1page, "11");
  await toggleStatusOn(agent1page);
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // enable email channel
  try {
    await expect(
      agent1page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch {
    await expect(
      agent1page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  
  // Toggle off all channels aside from email
  await agent1page.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await agent1page.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="chat"]`)).toBeVisible();
  
  // Wait a moment for emails to load if any
  await agent1page.waitForTimeout(3000);
  
  // Check for existence of the email
  const emailElement = agent1page.locator('[data-cy="active-media-tile-EMAIL"]');
  
  // Break out of loop if no more emails are found
  if (await emailElement.isVisible()) {
    // Click into email
    await emailElement.click();
  
    // Mark email as complete
    await agent1page.locator(`:text("Mark as Complete")`).click();
  
    // Delay/wait for any other emails to populate
    await agent1page.waitForTimeout(15 * 1000); // 30 seconds delay
  }
  
  // make sure on DND
  try {
    await expect(
      agent1page.locator(`.dnd-status-container:has-text("On DND")`),
    ).toBeVisible({ timeout: 3000 });
  } catch {
    await agent1page.locator(`.dnd-status-container button`).click();
  }
  
  // select reason if needed
  try {
    await agent1page.getByRole(`menuitem`, { name: `Lunch` }).click();
  } catch {
    console.log(`don't need to select status reason`);
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Per Kelly, emails to be ~45-60 seconds apart for their email routing system
  // Context here: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
  
  // Send Email 1 with PDF attachment to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  const pdfContent = await fs.readFile("/home/wolf/files/qawolf.pdf");
  await sendMessage({
    html: "<body>Can I get an estimate</body>",
    subject: "Email 1: Need a Quote (Skill 12)",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
    attachments: [
      {
        fileName: "qawolf.pdf",
        type: "application/pdf",
        content: pdfContent,
        disposition: "inline",
        contentId: "qawolf.pdf",
      },
    ],
  });
  
  // Add minor delay for queue time to develop in C2G
  await agent1page.waitForTimeout(30000);
  
  // Toggle skills 11 and 12 on for WebRTC Agent 67
  await agent1page.click('[data-cy="channel-state-manage-skills"]');
  await agent1page.click(':text("All Skills Off")');
  await agent1page.waitForTimeout(1000);
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 11") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.click(
    `[class*="skill"]:has-text("Skill 12") [data-cy="skills-edit-dialog-skill-slide-toggle"]`,
  );
  await agent1page.waitForTimeout(1000);
  await agent1page.click("xima-dialog-header button");
  
  // Toggle Agent status to Ready for WebRTC Agent 67
  await agent1page
    .locator(`.dnd-status-container button`)
    .click();
  await agent1page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(agent1page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // Toggle on Channel States for WebRTC Agent 67
  await agent1page.waitForTimeout(5000);
  await toggleStatusOn(agent1page);
  
  // Toggle off all channels aside from email
  await agent1page.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await agent1page.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(agent1page.locator(`.channels-disabled [data-mat-icon-name="chat"]`)).toBeVisible();
  
  // Wait for active email to show up in queue
  await expect(
    agent1page.locator('[data-cy="active-media-chat-email"]'),
  ).toBeVisible({ timeout: 60 * 1000 });
  
  // Add minor delay for focus time to develop in C2G
  await agent1page.waitForTimeout(30 * 1000);
  
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
  
  // Assert Agent receives "Email 1: Need a Quote"
  try {
    await expect(
      agent1page.locator('[data-cy="active-media-chat-recent-message"]'),
    ).toContainText("Email 1: Need a Quote", { timeout: 3000 });
  } catch {
    await expect(
      agent1page.locator(`[data-cy="media-renderer-header-title"]`),
    ).toContainText(`Quote Needed`);
  }
  
  // Assert email's contact details in the details pane
  await expect(
    agent1page.locator('[data-cy="active-media-chat-email"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert agent can see the attachment
  await expect(agent1page.locator(`xima-email-attachment`)).toBeVisible();
  
  // Assert agent can download the attachment
  const downloadPromise = agent1page.waitForEvent("download", {
    timeout: 60 * 1000,
  });
  await expect(
    agent1page.locator("xima-email-attachment .download-icon"),
  ).toBeVisible();
  await agent1page.locator("xima-email-attachment .download-icon").waitFor();
  await agent1page.click("xima-email-attachment .download-icon");
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toContain("/tmp/playwright-artifacts");
  
  // Assert that the targert skill is 'Skill 12'
  await expect(
    agent1page.locator('[data-cy="email-details-targetSkill"]'),
  ).toHaveText("Skill 12");
  
  // Assert the sending party as the "To" in Agent's response
  await expect(
    agent1page.locator('[id*="mat-mdc-chip"][role="row"]'),
  ).toContainText("xima@qawolf.email");
  
  // Assert the "From" email is ximaqawolf1@ximasoftwaretest.onmicrosoft.com
  await expect(agent1page.locator('[name="from"]')).toContainText(
    "ximaqawolf1@ximasoftwaretest.onmicrosoft.com",
  );
  
 // Step 2. Send a reply
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Assert Agent can send a reply
  let emailResponse = faker.lorem.sentences(2);
  await agent1page.locator('[contenteditable="true"]').fill(emailResponse);
  
  // Agent able to change the size of the response text
  await agent1page.keyboard.down("Control");
  await agent1page.keyboard.press("A");
  await agent1page.waitForTimeout(3000);
  await agent1page.locator('[data-mat-icon-name="formatting-options"]').click();
  await agent1page.waitForTimeout(2000);
  await agent1page.locator('[data-mat-icon-name="text-bold"]').click();
  
  // Agent able to change the font of the response text
  await agent1page.locator('[class="current-font"]').click();
  await agent1page.locator('[style="font-family: serif;"]').click();
  
  // Assert that the response is bolded and font was changed to Serif
  await agent1page.waitForTimeout(3000);
  const currentResponse = await agent1page
    .locator('[contenteditable="true"]')
    .innerHTML();
  console.log("currentResponse", currentResponse);
  
  const isBolded =
    currentResponse.includes("<strong>") && currentResponse.includes("</strong>");
  const hasFontFamilySerif = currentResponse.includes(
    'style="font-family: Serif"',
  );
  
  expect(isBolded).toBe(true);
  expect(hasFontFamilySerif).toBe(true);
  
  // Send the reply
  await agent1page.locator('[data-cy="email-footer-send-button"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert email sent success toast
  await expect(agent1page.locator("text=Email Sent")).toBeVisible();
  
 // Step 3. Modify the reply and resend
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Cancel the send attempt
  await expect(agent1page.locator("text=undo send")).toBeVisible();
  await agent1page.locator(':text("undo send")').click();
  
  // Modify the response slightly after cancelling
  let updateEmailResponse = emailResponse + "modified slightly";
  await agent1page.locator('[contenteditable="true"]').fill(updateEmailResponse);
  
  // Add minor delay for email time to develop in C2G
  await agent1page.waitForTimeout(5000);
  
  // Send the email response again
  await agent1page.locator('[data-cy="email-footer-send-button"]').click();
  
  // Confirm email send
  await expect(agent1page.locator("text=Email Sent")).toBeVisible();
  await expect(agent1page.locator("text=undo send")).toBeVisible();
  await agent1page.locator(':text("Done")').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the sender receives a response
  const messages = await waitForMessages({ after });
  const message = messages.find((message) =>
    message.subject.includes("Email 1: Need a Quote"),
  );
  expect(message).toBeTruthy();
  
  // Assert that the received email contains response WebRTC Agent 20 wrote
  expect(message.text).toContain(updateEmailResponse);
  
 // Step 4. Cradle to Grave - "Email 1: Need a Quote"
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as Supervisor
  const { page: supervisorPage } = await logInSupervisor();
  await supervisorPage.bringToFront();
  
  // Click Cradle to Grave
  await supervisorPage.waitForTimeout(60 * 1000);
  await supervisorPage.reload();
  await supervisorPage.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await supervisorPage.locator(`button:has-text("Cradle to Grave")`).click();
  await supervisorPage.waitForTimeout(1000);
  
  // date filter
  await supervisorPage
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(3000);
  await supervisorPage
    .locator(`.mat-calendar-body-cell :text-is("1") >> nth=0`)
    .click();
  await supervisorPage.waitForTimeout(3000);
  await supervisorPage.locator(`[aria-current="date"]`).click();
  await supervisorPage.waitForTimeout(1000);
  
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
  
  // Search for, select, and apply filter for WebRTC Agent 67
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 67`);
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="xima-list-select-option"]`).click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage.waitForTimeout(1000);
  
  // Search for Skill 12 and apply
  await supervisorPage
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text-is("Skill 12")`)
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
  // Assert email subject is "Email 1: Need a Quote"
  await expect(
    supervisorPage.locator(`[data-cy="media-renderer-header-title"]`),
  ).toContainText(`Email 1: Need a Quote`);
  
  // Assert can see full content of email in the preview
  await expect(supervisorPage.locator(`#email-body`)).toHaveText(
    `${updateEmailResponse}`,
  );
  
  // Assert PDF attachment is visible in preview
  await supervisorPage.locator(`.attachment-icon:visible`).click();
  await expect(supervisorPage.locator(`xima-email-attachment`)).toHaveText(
    `qawolf.pdf`,
  );
  
  // Close email preview to return to C2G event view
  await supervisorPage.locator(`[data-cy="media-renderer-close-button"]`).click();
  
  // Assert email is routed to Skill 12
  await supervisorPage
    .locator(
      `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Email") >> nth=0`,
    )
    .click();
  
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
  
  // Assert "Pending Agent Review" event with the correct agent (first Agent - WebRTCAgent 20)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Pending Agent Review")`,
    ),
  ).toBeVisible();
  
  // Assert 'Pending Agent Review' with correct agent (WebRTC Agent 67)
  await expect(
    supervisorPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-RECEIVING_PARTY"]:right-of(:text("Pending Agent Review")) >> nth=0`,
    ),
  ).toContainText("WebRTC Agent 67");
  
  // Assert "Focused" event and the duration is more than 0:00:00
  await expect(supervisorPage.locator(`:text("Focused") >> nth=0`)).toBeVisible();
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
  
});
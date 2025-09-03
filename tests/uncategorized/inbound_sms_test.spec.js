import { cleanupChats, logInSupervisor, logInWebRTCAgent, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("inbound_sms_test", async () => {
 // Step 1. Inbound SMS Test
  //--------------------------------
  // Arrange:
  //--------------------------------
  const skill = "Inbound SMS Test";
  const textMessage = "QA Inbound SMS Test " + Date.now().toString().slice(-5);
  
  // Log in to Agent 74
  const { page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_74_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // Toggle Skills on
  await page.locator('[data-cy="channel-state-manage-skills"]').click();
  await page.locator('button :text("All Skills Off")').click();
  await page.waitForTimeout(1000);
  await page.locator(`span:text("${skill}") + mat-slide-toggle`).click();
  await page.waitForTimeout(1000);
  await page.locator('[data-unit="close"]').click();
  
  // Toggle status on for Agent 56
  await toggleStatusOn(page);
  
  // Cleanup
  await cleanupChats(page);
  
  // Set up textClient
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // With the contacts twillo number, send a message to your Number
  // Number can be formatted like: +X (XXX) XXX-XXXX or +XXXXXXXXXXXX (11 digits, 1 for extension and then 10 digit phone)
  client.messages
    .create({
      body: textMessage,
      from: `+1${process.env.TWILIO_NUMBER}`,
      to: `+14352003655`,
    })
    .then((message) => console.log(message.sid));
  
  // Assert chat offer is visible
  await expect(
    page.locator(`xima-dialog-header:has-text("Chat Offer")`),
  ).toBeVisible();
  
  // Assert chat offer contains sender number and correct skill
  await expect(
    page.locator(`.skills:has-text("Name1${process.env.TWILIO_NUMBER}")`),
  ).toBeVisible({ timeout: 1500 });
  await expect(page.locator(`.skills:has-text("Skill${skill}")`)).toBeVisible({
    timeout: 1500,
  });
  
  // Accept offer
  await page.getByRole(`button`, { name: "Accept" }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert textMessage is visible in the chat
  await expect(page.locator(`[data-cy="chat-test-receieved"]`)).toHaveText(
    textMessage,
  );
  
  // Assert Details contains sender number
  await expect(
    page.locator(
      `.data:has-text("Customer Email 1${process.env.TWILIO_NUMBER}")`,
    ),
  ).toBeVisible();
  
  // Assert Details contains correct skill
  await expect(
    page.locator(`.data:has-text("Target Skill ${skill}")`),
  ).toBeVisible();
  
  // Assert Details contains correct messaging type
  await expect(
    page.locator(`.data:has-text("Messaging Type SMS")`),
  ).toBeVisible();
  
  // Small pause to allow chat to develop in C2G
  await page.waitForTimeout(10 * 1000);
  
  // End chat
  await page.getByRole(`button`, { name: `End Chat` }).click();
  await page.getByRole(`button`, { name: `Close` }).click();
  
  // log in as admin
  const { page: adminPage } = await logInSupervisor({
    allowTracking: true,
    timezoneId: "America/New_York",
  });
  
  // Go to  "Cradle to Grave"
  await adminPage.getByText(`Cradle to Grave`).click();
  
  // Filter by Calls made today to the "Inbound SMS Test" Skill
  await adminPage
    .locator(`app-configure-report-preview-parameter`)
    .filter({ hasText: `Channels 0 Selected` })
    .getByRole(`button`)
    .click();
  await adminPage.getByText(`Chats`).click();
  await adminPage.getByRole(`button`, { name: `Apply` }).click();
  await adminPage
    .locator(`app-configure-report-preview-parameter`)
    .filter({ hasText: `Skill 0 Selected` })
    .getByRole(`button`)
    .click();
  await adminPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text("${skill}")`)
    .click();
  await adminPage.getByRole(`button`, { name: `Apply` }).click();
  await adminPage
    .locator(
      `[data-cy="configure-cradle-to-grave-container-apply-button"]:has-text("Apply")`,
    )
    .click();
  
  // Sort by end timestamp descending
  await adminPage.getByRole(`button`, { name: `End Timestamp` }).click();
  await adminPage.getByRole(`button`, { name: `End Timestamp` }).click();
  
  // Assert record appears
  try {
    // Click on kebab menu of first record
    await adminPage.locator(`[data-cy="cradle-to-grave-table-cell-INFO"] >>nth=0 >> mat-icon >>nth=0`).click();
    
    // Click View Chat
    await adminPage.getByRole(`menuitem`, { name: `View Chat` }).click({ timeout: 5000 });
  
    // Assert Details contains sender number
    await expect(
      adminPage.locator(
        `.chat-details-item:has-text("Name 1${process.env.TWILIO_NUMBER}")`,
      ),
    ).toBeVisible({ timeout: 5000 });
  
    // Assert Details contains correct skill
    await expect(
      adminPage.locator(`.chat-details-item:has-text("Target Skill ${skill}")`),
    ).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole(`button`, { name: `Close` }).click();
  
    // Expand target call row
    await adminPage
      .locator(
        `[data-cy="cradle-to-grave-table-row"]:has(:text("${skill}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
      )
      .first()
      .click({ timeout: 5000 });
  
  } catch {
    // If we cannot find a record with the correct text message & skill
    // Keep refreshing table until we do
    let tries = 0;
    let foundRow = false;
    while (tries < 5 && !foundRow) {
      tries++;
  
      // Wait 15 seconds and refresh table
      await adminPage.waitForTimeout(3 * 1000);
      try {
        await adminPage.getByRole(`button`, { name: `Close` }).click({ timeout: 3000 });
      } catch { console.log("No modal opened") }
      await adminPage
        .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
        .click();
      await adminPage.waitForTimeout(3000);
  
      // Sort by end timestamp descending
      await adminPage
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
      await adminPage
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
      await adminPage
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
      await adminPage.waitForTimeout(3000);
  
      // Expand target call row
      await adminPage
        .locator(
          `[data-cy="cradle-to-grave-table-row"]:has(:text("${skill}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
        )
        .first()
        .click();
  
      try {
        // Click on kebab menu of first record
        await adminPage.locator(`[data-cy="cradle-to-grave-table-cell-INFO"] >>nth=0 >> mat-icon >>nth=0`).click();
        
        // Click View Chat
        await adminPage.getByRole(`menuitem`, { name: `View Chat` }).click({ timeout: 5000 });
  
        // Assert Details contains sender number
        await expect(
          adminPage.locator(
            `.chat-details-item:has-text("Name 1${process.env.TWILIO_NUMBER}")`,
          ),
        ).toBeVisible({ timeout: 5000 });
  
        // Assert Details contains correct skill
        await expect(
          adminPage.locator(`.chat-details-item:has-text("Target Skill ${skill}")`),
        ).toBeVisible({ timeout: 5000 });
        foundRow = true;
      } catch { console.log("Record not found.") }
    }
  }
  
  // Assert rows in record
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"]:has-text("Queue")`,
    ),
  ).toBeVisible();
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"]:has-text("Chatting")`,
    ),
  ).toBeVisible();
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"]:has-text("Chat End Internal")`,
    ),
  ).toBeVisible();
  
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  await page.bringToFront();
  await toggleStatusOff(page);
  
});
import { logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("send_5_mb_email_attachment_as_an_agent", async () => {
 // Step 1. Send 5mb Email Attachment As An Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Store current datetime for later use in identifying correct email
  const afterNow = new Date();
  
  // login to WEBRTCAGENT_72_EMAIL
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_72_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // set agent to Ready
  await page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // toggle skill in order to enable toggling status
  await toggleSkillsOn(page, 21);
  
  // channel states on
  await toggleStatusOn(page);
  
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch {
    // If there is an email visible the email icon will not be green
    await expect(
      page.locator(`[data-cy="active-media-chat-email"] >>nth=0`),
    ).toBeVisible();
  }
  
  // clean up emails
  const emails = page.locator(`xima-active-media-tile`);
  let counter = 0;
  while ((await emails.count()) && counter < 10) {
    await page.locator(`xima-active-media-tile`).click();
    await page.locator(`:text("Mark as Complete")`).click();
  
    try {
      // wait for next email to come in, if any
      await expect(
        page.locator('[data-cy="channel-state-channel-EMAIL-icon"]'),
      ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 8000 }); // check the color of the email channel, if it's green then no more emails will come in
    } catch (err) {
      console.log(err);
    }
  
    counter += 1;
  }
  
  // Set up email for sending
  const { emailAddress, sendMessage, waitForMessage, waitForMessages } =
    await getInbox();
  
  // Set up email for receiving
  const emailWithAttachment = `xima+agent72@qawolf.email`;
  const { emailAddress: emailAddress5mb, waitForMessage: waitForMessage5mb } =
    await getInbox({
      address: emailWithAttachment,
    });
  
  // Send Email to 'ximaqawolf1@ximasoftwaretest.onmicrosoft.com'
  const email = await sendMessage({
    html: "<body>5mb</body>",
    subject: "Send 5mb",
    to: ["ximaqawolf1@ximasoftwaretest.onmicrosoft.com"],
  });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // click on email
  await page
    .locator(`[data-cy="active-media-chat-email"]`)
    .click({ timeout: 60000 });
  
  // to:
  // await page.locator(`[role="button"]`).click();
  await page.locator(`#to`).fill(emailWithAttachment);
  await page.waitForTimeout(3000);
  
  // fill subject
  await page.getByRole(`textbox`, { name: `Subject` }).fill(`test${Date.now()}`);
  
  // fill body
  await page.locator(`[contenteditable="true"]`).fill(`test${Date.now()}`);
  
  // attach file
  const fileName = `5mb.txt`;
  page.once("filechooser", (chooser) =>
    chooser.setFiles(`/home/wolf/team-storage/${fileName}`).catch(console.error),
  );
  await page.click(`[data-mat-icon-name="attach-files"]`);
  await expect(
    page.locator(`xima-email-attachment:has-text("${fileName}")`),
  ).toBeVisible();
  await page.waitForTimeout(3000);
  
  // send email
  await page.locator(`[data-cy="email-footer-send-button"]`).click();
  
  // click done
  await page.locator(`:text("Done")`).click();
  
  // wait for message
  const messages = await waitForMessage5mb({ after: afterNow, timeout: 60000 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert attachment is in email
  expect(messages.attachments.length).toEqual(1);
  expect(messages.attachments[0].fileName).toBe(`${fileName}`);
  
});
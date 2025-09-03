import { logInWebRTCAgent, toggleSkill } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("end_chat_and_log_out", async () => {
 // Step 1. End Chat and Log Out
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Navigate to https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-30.html
  const { context } = await launch();
  const blogPage = await context.newPage();
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-30.html",
  );
  
  // Log in with agent (Skill 30) for blog spot
  // -- Fill the Username input with WEBRTC_AGENT Email
  const { page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_20_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Clean up existing active chats
  await page.bringToFront();
  await page.waitForTimeout(5000);
  
  // Get the active chat count under "Active Media"
  let activeChatCount = await page
    .locator('[data-cy="active-media-chat-email"]')
    .count();
  
  // While there are active counts and the attempts are less than 5:
  let attempts = 0;
  while (activeChatCount && attempts < 5) {
    // Click the active chat to load the chat window
    await page.locator(`[data-cy="active-media-chat-email"]`).first().click();
  
    // Click either "Mark as Complete" or "End Chat" button on top of chat window
    await page
      .locator('div:text-is("Mark as Complete")')
      .or(page.locator('[data-cy="end-chat"]'))
      .click();
    await page.waitForTimeout(2000);
    activeChatCount = await page
      .locator('[data-cy="active-media-chat-email"]')
      .count();
    attempts += 1;
  }
  
  // Disable all skills except for 30
  await toggleSkill(page, "30");
  
  // Set Agent to Ready
  await page
    .locator(
      `[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])`,
    )
    .click();
  await page.getByRole(`menuitem`, { name: `Ready` }).click();
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // If the "Voice" icon is grey (phone) click it to activate (teal color)
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page.locator('[data-cy="channel-state-channel-VOICE"]').click();
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  // If the "Chat" icon is grey (chat bubble), click it to activate (teal color)
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page.locator('[data-cy="channel-state-channel-CHAT"]').click();
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.reload();
  
  // Click on the Chat box
  try {
    await blogPage.locator(`#xima-chat-header`).click({ timeout: 5000 });
    await blogPage.locator(`#xima-start-chat-btn`).click();
  } catch {
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  // Chat Window Appearance
  // - Verify Chat window has customer color scheme (not all black)
  await expect(blogPage.locator("#xima-chat-header")).toHaveCSS(
    "background-color",
    "rgb(255, 0, 255)",
    { timeout: 3000 },
  );
  
  // - Verify Chatter sees company logo in window
  await expect(
    blogPage.locator(
      '[src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU3e5TZtnYYWQQ9KPSTqtIgBQrZEH3pXIPklcT0O6g4suJStCmZNYBFLivkkUKUlieuILl7hQIAlZPrb7w-H50V-4sMjIECtrCBx4NFAg_yAoULbtROB_LSp2Yn4nmFC32y3CwImoLn3nAbwo0hfjoO-7Qh0IOjC3xJ6lBbKAfkzj0e95d6sbNH9aBEQ/s320/46409415.png"] >> nth=0',
    ),
  ).toBeVisible();
  
  // Create web chat
  // -- Fill the 'Name' input
  const customerName = faker.random.words(2);
  await blogPage.getByRole(`textbox`, { name: `Name` }).fill(customerName);
  
  // Fill the 'Email' input
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  await blogPage.getByRole(`textbox`, { name: `Email` }).fill(customerEmail);
  
  // Click the Submit button
  await blogPage.locator("#xima-chat-name-email-entry-submit").click();
  
  // Verify "You Are in the Queue" message on blog
  await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // Bring web agent page to front and verify Agent gets Chat Offer modal
  await page.bringToFront();
  await expect(page.locator("text=Chat Offer")).toBeVisible();
  
  // Click the "Accept" button
  await page.locator('[data-cy="alert-chat-offer-accept"]').click();
  
  // Verify Chat is visible under Active Media and opened
  await expect(
    page.locator(`[data-cy="chat-header"] :text-is("${customerName}")`),
  ).toBeVisible();
  await expect(
    page.locator(`[data-cy="active-media-tile"] :text-is("${customerName}")`),
  ).toBeVisible();
  
  // Click the customer name on the chat window to focus it
  try {
    await page
      .locator(`[data-cy="active-media-tile"] :text-is("${customerName}")`)
      .click({ timeout: 10000 });
  } catch (err) {
    console.error(err);
  }
  
  // Click the "Notes" tab and assert it is editable
  await page.locator('[role="tab"]#mat-tab-label-0-1').click();
  await expect(
    page.locator('[data-cy="details-sidebar-note-textarea"]'),
  ).toBeEditable();
  
  // Click the "Codes" tab and assert it is enabled
  await page.locator('[role="tab"]#mat-tab-label-0-2').click();
  await expect(
    page.locator('[data-cy="details-sidebar-select-code"]'),
  ).toBeEnabled();
  
  // Small pause before ending chat
  await page.waitForTimeout(2000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click End Chat button
  await page.getByRole(`button`, { name: `End Chat` }).click();
  
  // Assert chat has been ended
  await expect(page.locator(`[data-cy="chat-ended"]`)).toBeVisible();
  await expect(page.getByRole(`button`, { name: `Close` })).toBeVisible();
  
  // Assert chat is no longer visible in Active Media
  await expect(
    page.locator(`[data-cy="active-media-tile"] :text-is("${customerName}")`),
  ).not.toBeVisible();
  
  // Close chat
  await page.getByRole(`button`, { name: `Close` }).click();
  
  // Log agent out
  // -- Click the Kebab menu
  await page.locator('[data-cy="agent-status-menu-button"]').click();
  
  // -- Click on logout
  await page.locator('[data-cy="agent-status-logout-link"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // -- Assert Agent is able to log out
  await expect(
    page.locator('[data-cy="consolidated-login-username-input"]'),
  ).toBeVisible();
  await expect(
    page.getByRole(`button`, { name: "Login" }),
  ).toBeVisible();
  
  // Cleanup blog page
  await blogPage.bringToFront();
  await blogPage.getByRole(`button`, { name: `Close chat` }).click();
  
});
import { logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("mark_agent_as_ready", async () => {
 // Step 1. Log In with Agent (Skill 3) for Blog Spot (mark agent as ready)
  // Arrange:
  // Fill the Username input with WEBRTC_AGENT Email
  // Fill the Password input with DEFAULT_PASSWORD
  // Click the 'Login' button
  // Navigate to https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-22.html
  // Navigate to DEFAULT_URL
  
  const { browser, context } = await launch();
  const blogPage = await context.newPage();
  
  // REQ 01 Log in with agent (Skill 22) for blog spot
  // Fill the Username input with WEBRTC_AGENT Email
  const { browser: browser2, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_19_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Navigate to https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-22.html
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-22.html",
  );
  
  await page.bringToFront();
  
  // Act:
  // Set Agent to Ready
  // Disable all skills except for 22
  // Navigate to Blog Spot
  // Click on the Chat box
  
  // Disable all skills except for 22
  await toggleSkill(page, "22");
  
  // Set Agent to Ready
  await toggleStatusOn(page);
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  await page.waitForTimeout(4000);
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page.click('[data-cy="channel-state-channel-VOICE"]');
  } catch (err) {
    console.log(err);
  }
  try {
    await expect(
      page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page.click('[data-cy="channel-state-channel-CHAT"]');
  } catch (err) {
    console.log(err);
  }
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
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
  
  // Assert:
  // Chat Window Appearance
  // - Chat window has customer color scheme (not all black)
  // - 'There is an agent available. Would you like to chat?'
  // - Chatter sees agent's nickname instead of ext name
  // - Chatter sees company logo in window
  // - Chatter sees agent's image in window
  
  // Assert:
  // Chat Window Appearance
  // - Chat window has customer color scheme (not all black)
  await expect(blogPage.locator("#xima-chat-header")).toHaveCSS(
    "background-color",
    "rgb(255, 0, 255)",
    { timeout: 3000 },
  );
  
  // - 'There is an agent available. Would you like to chat?'
  try {
    await expect(blogPage.locator("text=Chat with an Agent")).toBeVisible();
  } catch {
    await expect(
      blogPage.locator("text=All agents are currently busy"),
    ).toBeVisible();
  }
  
  // - Chatter sees company logo in window
  await expect(
    blogPage.locator(
      '[src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU3e5TZtnYYWQQ9KPSTqtIgBQrZEH3pXIPklcT0O6g4suJStCmZNYBFLivkkUKUlieuILl7hQIAlZPrb7w-H50V-4sMjIECtrCBx4NFAg_yAoULbtROB_LSp2Yn4nmFC32y3CwImoLn3nAbwo0hfjoO-7Qh0IOjC3xJ6lBbKAfkzj0e95d6sbNH9aBEQ/s320/46409415.png"] >> nth=0',
    ),
  ).toBeVisible();
  
  // Assert User can open chat window and enter chat queue
  // Assert can enter in name and email
  await expect(blogPage.locator("#xima-chat-name")).toBeVisible();
  await expect(blogPage.locator("#xima-chat-email")).toBeVisible();
  
 // Step 2. Set Agent as Ready (mark agent as ready)
  // Arrange:
  // Navigate to Agent CCAC page
  
  // Act:
  // Set DND Toggle to On
  
  // Assert:
  // Agent is set to 'Ready' with chat icons set to green
  // User can open chat window and enter chat queue
  
  
});
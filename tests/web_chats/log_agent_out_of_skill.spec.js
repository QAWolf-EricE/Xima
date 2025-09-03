import { logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("log_agent_out_of_skill", async () => {
 // Step 1. Log In with Agent (Skill 63) for Blog Spot (log agent out of skill)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in with web agent with skill 63
  const { context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_43_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Set agent to ready and toggle skill 63
  await toggleSkill(page, "63");
  await toggleStatusOn(page);
  
  // Navigate to blogspot
  const blogPage = await context.newPage();
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/12/qa-wolf-skill-63.html",
  );
  
  // Click on the Chat box
  try {
    await blogPage.locator(`#xima-chat-header`).click({ timeout: 3000 });
    await blogPage.locator(`#xima-start-chat-btn`).click();
  } catch {
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert a chat window pops up with text "Skill 63 - Chat with an Agent"
  await expect(
    blogPage.locator(':text("Skill 63 - Chat with an Agent")'),
  ).toBeVisible();
  
  // Assert the Name field is visible
  await expect(blogPage.locator("#xima-chat-name")).toBeVisible();
  
  // Assert the Email address field is visilbe
  await expect(blogPage.locator("#xima-chat-email")).toBeVisible();
  
  // Chat Window Appearance
  // - Assert Chat window has customer color scheme (not all black)
  await expect(blogPage.locator("#xima-chat-header")).toHaveCSS(
    "background-color",
    "rgb(255, 0, 255)",
    { timeout: 3000 },
  );
  
  // - Assert Chatter sees company logo in window
  await expect(
    blogPage.locator(
      '[src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU3e5TZtnYYWQQ9KPSTqtIgBQrZEH3pXIPklcT0O6g4suJStCmZNYBFLivkkUKUlieuILl7hQIAlZPrb7w-H50V-4sMjIECtrCBx4NFAg_yAoULbtROB_LSp2Yn4nmFC32y3CwImoLn3nAbwo0hfjoO-7Qh0IOjC3xJ6lBbKAfkzj0e95d6sbNH9aBEQ/s320/46409415.png"] >> nth=0',
    ),
  ).toBeVisible();
  
 // Step 2. Remove Skill from Agent (log agent out of skill)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Navigate to Agent CCAC page
  // -- Bring the first page to the front
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Log out of skill 63
  // -- Click the Manage Skills button
  await page.locator('[data-cy="channel-state-manage-skills"]').click();
  
  // -- On the Manage Skills pop up, click "All Skills Off" button
  await page.locator(':text("All Skills Off")').click();
  await page.waitForTimeout(1000);
  
  // -- Click the "Close" (x) button on the pop up and wait for setting to update
  await page.locator("xima-dialog-header button").click();
  await page.waitForTimeout(5000);
  
  // Bring the blogspot page to the front and reload the page
  await blogPage.bringToFront();
  await blogPage.reload();
  
  // Click on the chat
  try {
    await blogPage.locator(`#xima-chat-header`).click({ timeout: 3000 });
  } catch {
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // After removing Expected Skill (63), Blog Spot no longer displays chat
  try {
    // Assert that the message "No agents are currently logged in" is visible
    await expect(
      blogPage.locator(':text("No agents are currently logged in")'),
    ).toBeVisible();
  } catch {
    // Assert that the message "No agents are currently logged in" is visible
    await expect(
      blogPage.locator(':text("All agents are currently busy")'),
    ).toBeVisible();
  }
  
});
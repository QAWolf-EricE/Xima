import { logInSupervisor, logInWebRTCAgent, reportCleanupFailed, supervisorFilterAgents, supervisorToggleAgentSkills, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("log_agent_out_of_skill_group", async () => {
 // Step 1. Log Agent out of skill group
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const agentName = `WebRTC Agent 41`;
  const skillName = `Skill 5`;
  
  // Login with web agent with skill 3
  const { context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_41_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Login as a SUPERVISOR
  const { page: supervisorPage } = await logInSupervisor();
  
  // Go back to Agent page
  await page.bringToFront();
  
  // Click on "Got it" to close popup message, if needed
  try {
    await page.getByText("Got it").click({ timeout: 5 * 1000 });
  } catch (err) {
    console.log(err);
  }
  
  // Toggle on Skill 5
  await toggleSkill(page, skillName.at(-1));
  
  // Set agent to ready
  await toggleStatusOn(page);
  
  // Open a new tab to Skill 5 chat
  const blogPage = await context.newPage();
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2023/03/qa-wolf-skill-5.html",
  );
  
  // Soft assert blog works as expected
  try {
    // Use chat header, if present
    await blogPage.locator(`#xima-chat-header`).click({ timeout: 3 * 1000 });
    await blogPage.locator(`#xima-start-chat-btn`).click();
  } catch {
    // If not, use chat widget icon
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  // Soft assert "Skill 5 Chat" is visible
  await expect(blogPage.getByText(`${skillName} Chat`)).toBeVisible();
  
  // Soft assert "Name" field is visible
  await expect(blogPage.locator("#xima-chat-name")).toBeVisible();
  
  // Soft assert "Email" field is visible
  await expect(blogPage.locator("#xima-chat-email")).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Go back to Supervisor page
  await supervisorPage.bringToFront();
  
  // Hover over side menu option with "arrow trending upward" icon
  await supervisorPage
    .locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]')
    .hover();
  
  // Click "Supervisor View" menu option
  await supervisorPage.getByRole(`button`, { name: `Supervisor View` }).click();
  
  // Filter for just our agent
  await supervisorFilterAgents(supervisorPage, { agentName });
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  // Toggle "Skill 5" off
  await supervisorToggleAgentSkills(supervisorPage, { agentName, skillName });
  
  // Click the Kebab menu on the Agent matching `agentName`
  await supervisorPage
    .locator(
      `app-agent-status-container:has-text("${agentName}") [data-cy="agent-tile-more-menu"]`,
    )
    .click();
  
  // Click on the "Toggle Skills" menu option
  await supervisorPage.getByRole(`menuitem`, { name: `Toggle Skills` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert "Skill 5" is off
  await expect(
    supervisorPage
      .locator(`form div`)
      .filter({ hasText: skillName })
      .locator(`[aria-checked="false"]`),
  ).toBeVisible();
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.reload();
  
  try {
    // Click on chat header, if present
    await blogPage.locator(`#xima-chat-header`).click({ timeout: 3 * 1000 });
  } catch {
    // If not, click on chat widget icon
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  // Assert no agents are logged in
  await expect(
    blogPage.locator(':text("No agents are currently logged in")'),
  ).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  
  // Go back to Supervisor page
  await supervisorPage.bringToFront();
  
  try {
    // Toggle "Skill 5" back on
    await supervisorToggleAgentSkills(supervisorPage, {
      skillName,
      allOff: true,
    });
  } catch (e) {
    await reportCleanupFailed({
      dedupKey: "supervisorToggleAgentSkillsPostTest",
      errorMsg: e.message,
    });
  }
  
  try {
    // Reset filter
    await supervisorFilterAgents(supervisorPage, { clearFilters: true });
  } catch (e) {
    await reportCleanupFailed({
      dedupKey: "supervisorFilterAgentsPostTest",
      errorMsg: e.message,
    });
  }
  
});
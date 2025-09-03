import { createCall, inputDigits, logInSupervisor, logInWebRTCAgent } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_supervisor_view_transfer_to_agent_not_ready", async () => {
 // Step 1. Supervisor can transfer a webRTC call that is queued on a skill to an agent that does not have that skill ready
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Test 2: Call comes into the system and queues a skill. 
  // An Agent (WebRTC user) is logged in but is not ready in the skill. 
  // The call is transferred from the skill to the agent via Supervisor View. 
  // The agent answers the call and shortly after ends the call.
  
  // Declare constants
  const agentName = 'WebRTC Agent 42'
  const skillNumber = 57
  const email = process.env.WEBRTCAGENT_42_EMAIL
  
  // Login to a UC Agent stephanie (do not Ready this agent)
  const { page: agentPage, browser: agentBrowser, context: agentContext } = await logInWebRTCAgent(email, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  })
  
  const { page: supervisorPage, browser: supervisorBrowser, context: supervisorContext } = await logInSupervisor()
  
  
  // Toggle all skills off
  await agentPage.bringToFront()
  await agentPage.locator('[data-cy="channel-state-manage-skills"]').click()
  await agentPage.locator(':text("All Skills Off")').click()
  await agentPage.waitForTimeout(1000);
  
  // Close skill modal
  await agentPage.locator(`[data-unit="close"]`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Use helper inputDigits(callId, [enter skill number here])  to make a call
  let callId = await createCall({ number: "4352551623" });
  console.log({ callId });
  await supervisorPage.waitForTimeout(3000);
  await inputDigits(callId, [7]);
  
  // Go to Supervisor View on supervisor page
  await supervisorPage.bringToFront()
  
  // Using supervisor view, transfer the call from the skill # you select
  // Hover over real time displays
  await supervisorPage.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
  // Click supervisor view
  await supervisorPage.locator(`:text("Supervisor View")`).click();
  
  // Click the settings menu button
  await supervisorPage.locator(`[data-cy="settings-menu-button"]`).click();
  
  // Click the "calls queue" option in the settings menu
  await supervisorPage.locator(`[data-cy="settings-menu-views-calls-queue"]`).click();
  await supervisorPage.waitForTimeout(1000);
  
  // Click the skill/group selection dropdown
  await expect(supervisorPage.locator(`.queued-calls-dropdown`)).toBeEnabled();
  await supervisorPage.waitForTimeout(1500);
  await supervisorPage.locator(`.queued-calls-dropdown`).click();
  
  // Select the last visible option "Skill ${skillNumber}" from the skill/group dropdown
  await expect(supervisorPage.locator(`:text-is("Skill ${skillNumber}"):visible >> nth=-1`)).toBeEnabled();
  await supervisorPage.waitForTimeout(1500);
  await supervisorPage.locator(`:text-is("Skill ${skillNumber}"):visible >> nth=-1`).click();
  
  const callIdentifier = await supervisorPage.locator(`.queued-calls-content-row-name>>span`).innerText()
  console.log({ callIdentifier })
  
  // Expect the item with text "In Queue (1)" under the header of the queued calls accordion to be visible
  await expect(
    supervisorPage.locator(`.queued-calls-accordion-header:has-text("In Queue (1)")`)
  ).toBeVisible();
  
  // Expect the element with id "accordion-body-0" that has the text "Xima Live Media" to be visible
  await expect(
    supervisorPage.locator(`#accordion-body-0:has-text("Xima Live Media")`)
  ).toBeVisible();
  
  // Click the phone forward button
  await supervisorPage.locator(`#phone-forward`).click();
  
  // Click Transfer to Agent
  await supervisorPage.locator(`:text("Transfer to Agent")`).click();
  
  // Click the trasfer to agent drop down
  await expect(supervisorPage.locator(`[data-cy="dropdown-property-container"]:below(:text("Transfer to Agent"))>>nth=0`)).toBeEnabled();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(`[data-cy="dropdown-property-container"]:below(:text("Transfer to Agent"))>>nth=0`).click();
  
  // Click agent ${agentName}
  await supervisorPage.locator(`[data-cy="dropdown-property-options"] :text("${agentName}")`).click();
  
  // Click Transfer
  await supervisorPage.locator(`app-transfer-destination-mapper button`).click();
  
  // Click Confirm
  await supervisorPage.locator(`[data-cy="confirmation-dialog-okay-button"]`).click();
  
  // Answer the call on the UC Agent page
  // Agent page to front
  await agentPage.bringToFront()
  
  // Accept call
  await agentPage.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert correct call was accepted grab call number from supervisor and assert here
  await expect(agentPage.locator(`:text("${callIdentifier}")>>nth=0`)).toBeVisible();
  
  // Expect "Call Active" text to be visible
  await expect(agentPage.locator(`xima-call span:has-text("Call Active")`)).toBeVisible();
  
  // Agent name is visible
  await expect(agentPage.locator(`:text("${agentName}")>>nth=0`)).toBeVisible();
  
  // Wait 10 seconds on call before endign call
  await agentPage.waitForTimeout(10 * 1000)
  
  // Click end call
  await agentPage.locator(`[data-cy="end-call-btn"]`).click();
  
  // Assert call has ended
  await expect(agentPage.locator(`xima-call span:has-text("Call Ended")`)).toBeVisible();
  
  // Click Close
  await agentPage.locator(`[data-cy="finish-btn"]`).click();
  
  // Assert callIdentifier is not visible anymore
  await expect(agentPage.locator(`:text("${callIdentifier}")>>nth=0`)).not.toBeVisible();
  
  // Bring supervisor page to front
  await supervisorPage.bringToFront()
  
  // Expect the item with text "In Queue (0)" under the header of the queued calls accordion to be visible
  await expect(
    supervisorPage.locator(`.queued-calls-accordion-header:has-text("In Queue (0)")`)
  ).toBeVisible();
  
});
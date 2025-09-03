import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleOffAllSkills, toggleSkill, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("handset_registration_srv_failover_tests_responds_with_all_503", async () => {
 // Step 1. Handset Registration SRV Failover Tests - RESPONDS_WITH_ALL_503
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const skill = "17";
  const skillDigit = [7];
  const email = "xima+webrtcagent75@qawolf.email";
  const number = "4352437430";
  const srvLookupURL = "https://www.nslookup.io/srv-lookup/";
  const integrationTestURL =
    "https://dev-bwhit.chronicallcloud-staging.com/service/primary/diag?page=integrationTestPage";
  const sipOutageOption = "RESPONDS_WITH_ALL_503";
  let callId;
  
  // Log in as Agent 75
  const { page: agentPage, browser } = await logInWebRTCAgent(email, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Create a new context
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  
  // Create a new page
  const adminPage = await context.newPage();
  
  // Navigate to the default URL
  await adminPage.goto(buildUrl("/"));
  
  // Fill the username input with supervisor username
  await adminPage
    .locator('[data-cy="consolidated-login-username-input"]')
    .fill(process.env.SUPERVISOR_USERNAME);
  
  // Fill the password input with supervisor password
  await adminPage
    .locator('[data-cy="consolidated-login-password-input"]')
    .fill(process.env.SUPERVISOR_PASSWORD);
  
  // Click the login button
  await adminPage.locator('[data-cy="consolidated-login-login-button"]').click();
  
  // Bring the agentPage to the front
  await agentPage.bringToFront();
  
  // Toggle skill
  await toggleSkill(agentPage, skill);
  
  // Toggle Agent status to Ready
  await toggleStatusOn(agentPage);
  
  try {
    // Simulate an incoming call directly to agent
    callId = await createCall({ number });
  
    // Wait for a few seconds for call to setup
    await agentPage.waitForTimeout(3 * 1000);
  
    // Input digit corresponding to skill
    await inputDigits(callId, skillDigit);
  
    // Answer the incoming call
    await agentPage.locator('[data-cy="alert-incoming-call-accept"]').click({
      force: true,
      delay: 500,
      timeout: 2 * 60 * 1000,
    });
  
    // Soft assert the call is active
    await expect(
      agentPage.locator(`xima-dialog-header:has-text("Call Active")`),
    ).toBeVisible();
  } catch {
    /* Try a second time - sometimes first call does not go through */
  
    // Simulate an incoming call directly to agent
    callId = await createCall({ number });
  
    // Wait for a few seconds for call to setup
    await agentPage.waitForTimeout(3 * 1000);
  
    // Input digit corresponding to skill
    await inputDigits(callId, skillDigit);
  
    // Answer the incoming call
    await agentPage.locator('[data-cy="alert-incoming-call-accept"]').click({
      force: true,
      delay: 500,
      timeout: 2 * 60 * 1000,
    });
  
    // Soft assert the call is active
    await expect(
      agentPage.locator(`xima-dialog-header:has-text("Call Active")`),
    ).toBeVisible();
  }
  
  // Bring the admin agentPage back into view
  await adminPage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Try multiple times
  await expect(async () => {
    // Hover over the settings icon in the sidebar
    await adminPage
      .locator(`[role="button"] [data-cy="sidenav-menu-ADMIN_SYSTEM"]`)
      .hover();
  
    // Click the "Target Platform" button
    await adminPage
      .getByRole(`button`, { name: `Target Platform` })
      .click({ timeout: 3 * 1000 });
  
    // Soft assert the "SRV Record" label is visible
    await expect(
      adminPage.locator(`mat-label:has(:text("SRV Record"))`),
    ).toBeVisible({ timeout: 10 * 1000 });
  }).toPass({ timeout: 60 * 1000 });
  
  // Store the value of the "SRV Record" input
  const srvRecord = await adminPage
    .locator(`mat-label:has(:text("SRV Record")) + div input`)
    .inputValue();
  
  // Go to the SRV Lookup Page
  await adminPage.goto(srvLookupURL);
  
  // Fill the "Domain name" textbox with the {srvRecord}
  await adminPage
    .getByRole(`textbox`, { name: `Domain name`, exact: true })
    .fill(srvRecord);
  
  // Click the "Find SRV records" button in the main
  await adminPage
    .getByRole(`main`)
    .getByRole(`button`, { name: `Find SRV records` })
    .click();
  
  // Store the target from the "10 primary" row
  const target = await adminPage
    .locator(`tr:has-text("10 primary") a`)
    .innerText();
  
  // Store the IP Address of the target
  const { address } = await dns.lookup(target);
  
  // Go to the Integration Test Page
  await adminPage.goto(integrationTestURL);
  
  // Select the {sipOutageOption} option
  await adminPage.locator(`[name="scenario"]`).selectOption(sipOutageOption);
  
  // Fill in the IP Address field
  await adminPage.locator(`input[name="ipAddress"]`).fill(address);
  
  // Click the "Set SIP Outage Test Parameters" button
  await adminPage
    .getByRole(`button`, { name: `Set SIP Outage Test Parameters` })
    .click();
  
  // Wait 10 minutes
  await adminPage.waitForTimeout(10 * 60 * 1000);
  
  // Bring the agentPage to the front
  await agentPage.bringToFront();
  
  // Make another incoming call
  callId = await createCall({ number });
  
  // Wait for a few seconds for call to setup
  await agentPage.waitForTimeout(3 * 1000);
  
  // Input digit corresponding to skill
  await inputDigits(callId, skillDigit);
  
  // Answer the incoming call
  await agentPage.locator('[data-cy="alert-incoming-call-accept"]').click({
    force: true,
    delay: 500,
    timeout: 2 * 60 * 1000,
  });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert the call is active
  await expect(
    agentPage.locator(`xima-dialog-header:has-text("Call Active")`),
  ).toBeVisible();
  
  //--------------------------------
  // Clean up:
  //--------------------------------
  
  // Bring adminPage back to front
  await adminPage.bringToFront();
  
  // Reset the Outage option
  await adminPage.locator(`[name="scenario"]`).selectOption("NO_OUTAGE");
  
  // Empty the IP Address field
  await adminPage.locator(`input[name="ipAddress"]`).fill("");
  
  // Click the "Set SIP Outage Test Parameters" button
  await adminPage
    .getByRole(`button`, { name: `Set SIP Outage Test Parameters` })
    .click();
  
  // Bring the agentPage to the front
  await agentPage.bringToFront();
  
  // Click the "End Call" button
  await agentPage.locator(`[data-cy="end-call-btn"]`).click();
  
  // Click the "I Am Done" button
  await agentPage.getByRole(`button`, { name: `I Am Done` }).click();
  
  // Click the "Close" button
  await agentPage.getByRole(`button`, { name: `Close` }).click();
  
  // Toggle skills off
  await toggleOffAllSkills(agentPage);
  
  // Toggle Agent status to "Do Not Disturb"
  await toggleStatusOff(agentPage);
  
});
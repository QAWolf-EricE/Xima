import { logInStaggeringSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("takeover_call_monitoring_for_another_supervisor", async () => {
 // Step 1. Monitor an Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! call logInStaggeringSupervisor with provided arguments and permissions, destructuring the result to {supervisorBrowser, supervisorContext, supervisorPage}
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInStaggeringSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Navigate to the "Supervisor View" in "REALTIME_DISPLAYS"
  
  //!! click on "REALTIME_DISPLAYS" from the menu on the {supervisorPage}
  await supervisorPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click on "Supervisor View" text on the {supervisorPage}
  await supervisorPage.click(':text("Supervisor View")');
  
  //! ----
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Wait for 10 seconds then apply filters to the supervisor page
  
  //!! wait for 10 seconds
  await supervisorPage.waitForTimeout(10000);
  
  //!! click on the filter icon on the {supervisorPage}
  await supervisorPage.click('[data-mat-icon-name="filter"]');
  
  // click Selection mode dropdown
  await supervisorPage.locator('[placeholder="Select type"]').click();
  
  // select Agent option
  await supervisorPage.locator('mat-option:has-text("Agent")').click();
  
  // click Agents dropdown
  await supervisorPage
    .locator(
      'app-configure-report-preview-parameter:has-text("Agents") [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! Check if "Select All Agents" checkbox is not checked. If it is not, click it
  if (
    !(await supervisorPage
      .locator(
        '[data-cy="xima-list-select-select-all"]:has-text("Select All Agents") [type="checkbox"]',
      )
      .isChecked())
  ) {
    await supervisorPage
      .locator(
        '[data-cy="xima-list-select-select-all"]:has-text("Select All Agents")',
      )
      .click();
  }
  
  //!! click on the apply button in the agents roles dialog on the {supervisorPage}
  await supervisorPage.click('[data-cy="agents-roles-dialog-apply-button"]');
  
  //!! click on the apply button in the supervisor view filter on the {supervisorPage}
  await supervisorPage.click('[data-cy="supervisor-view-filter-apply-button"]');
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  //!! click on the first agent container on the {supervisorPage}
  await supervisorPage.locator(`app-agent-status-container >> nth=0`).click();
  
  //!! loop 15 times/down pages to find the "WebRTC Agent 11", breaking the loop if found
  for (let i = 0; i < 15; i++) {
    // check if agent present
    const agents = supervisorPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 11") mat-icon',
    );
  
    if ((await agents.count()) > 0) {
      break;
    }
  
    await supervisorPage.keyboard.press("PageDown");
    await supervisorPage.waitForTimeout(2000);
  }
  
  // Try this sequence of actions until it passes
  await expect(async () => {
    //!! click on the more menu of "WebRTC Agent 11 (215)" on the {supervisorPage}
    await supervisorPage.click(
      'app-agent-status-container:has-text("WebRTC Agent 11 (215)") [data-cy="agent-tile-more-menu"]',
    );
  
    //! ----
  
    //! Wait for 5 seconds then live listen the selected agent
  
    //!! wait for 5 seconds
    await supervisorPage.waitForTimeout(5000);
  
    //!! click on the "live-listen" option in the more menu on the {supervisorPage}
    await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
  
    //! ----
    // Replace supervisor if prompted
    try {
      await supervisorPage.click('button:has-text("Confirm")', {
        timeout: 10000,
      });
    } catch (err) {
      console.log(err);
    }
  
    //--------------------------------
    // Assert:
    //--------------------------------
  
    //! Verify that the supervisor is listening to the agent
  
    //!! expect toolbar of supervisor observation to be visible on the {supervisorPage}
    await expect(
      supervisorPage.locator("xima-supervisor-observation-toolbar"),
    ).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 1000 * 120 });
  
  //!! expect the LISTEN element to be visible on the {supervisorPage}
  await expect(supervisorPage.locator(".LISTEN")).toBeVisible();
  
 // Step 2. Attempt to Monitor Same Agent with new Supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! call logInStaggeringSupervisor with custom parameters and credentials, destructuring the result to {managerBrowser}, {managerContext}, and {managerPage}
  const { browser: managerBrowser, context: managerContext, page: managerPage } = await logInStaggeringSupervisor(
    {
      username: 'Manager 3',
      password: 'Password07272023!',
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    }
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! click on the "REALTIME_DISPLAYS" link in the side navigation menu
  await managerPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click on the "Supervisor View" link
  await managerPage.click(':text("Supervisor View")');
  
  //!! wait for 10 seconds
  await managerPage.waitForTimeout(10000);
  
  //!! click on the first agent status container
  await managerPage.locator(`app-agent-status-container >> nth=0`).click();
  
  //!! perform an iterative operation, checking for the presence of "WebRTC Agent 11", pressing "PageDown", and waiting for 2 seconds each iteration
  for (let i = 0; i < 15; i++) {
    // check if agent present
    const agents = managerPage.locator(
      'app-agent-status-container:has-text("WebRTC Agent 11") mat-icon'
    );
  
    if ((await agents.count()) > 0) {
      break;
    }
  
    await managerPage.keyboard.press("PageDown");
    await managerPage.waitForTimeout(2000);
  }
  
  //!! click on the "agent-tile-more-menu" button for "WebRTC Agent 11 (215)"
  await managerPage.click('app-agent-status-container:has-text("WebRTC Agent 11 (215)") [data-cy="agent-tile-more-menu"]');
  
  //!! wait for 5 seconds
  await managerPage.waitForTimeout(5000);
  
  //!! click on the "agent-more-menu-live-listen" button
  await managerPage.click('[data-cy="agent-more-menu-live-listen"]');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! expect the system administrator currently in a STANDBY session with WebRTC Agent 11(215) text to be visible
  await expect(managerPage.locator('text=System Administrator is currently in a STANDBY session with WebRTC Agent 11(215).')).toBeVisible();
  
  //!! expect the "Cancel" text to be visible
  await expect(managerPage.locator(':text("Cancel")')).toBeVisible();
  
  //!! expect the "confirm-replace" element to be visible
  await expect(managerPage.locator(".confirm-replace")).toBeVisible();
  
 // Step 3. Cancel Monitor Takeover
  //--------------------------------
  // Act:
  //--------------------------------
  //!! on the managerPage, click the "Cancel" button
  await managerPage.locator(':text("Cancel")').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! expect the "xima-supervisor-observation-toolbar" not to be visible
  await expect(managerPage.locator("xima-supervisor-observation-toolbar")).not.toBeVisible();
  
  //!! expect the web agent status container for "WebRTC Agent 11 (215)" to be visible
  await expect(managerPage.locator('app-agent-status-container:has-text("WebRTC Agent 11 (215)")')).toBeVisible();
  
 // Step 4. Confirm Monitor Takeover
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! on managerPage, click 'app-agent-status-container:has-text("WebRTC Agent 11 (215)") [data-cy="agent-tile-more-menu"]' button
  await managerPage.click('app-agent-status-container:has-text("WebRTC Agent 11 (215)") [data-cy="agent-tile-more-menu"]');
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! wait for 5 seconds on managerPage
  await managerPage.waitForTimeout(5000);
  
  //!! click the '[data-cy="agent-more-menu-live-listen"]' button on managerPage
  await managerPage.click('[data-cy="agent-more-menu-live-listen"]');
  
  //!! click the ".confirm-replace" button on managerPage
  await managerPage.locator(".confirm-replace").click();
  
  //!! expect the "xima-supervisor-observation-toolbar" element to be visible on managerPage
  await expect(managerPage.locator("xima-supervisor-observation-toolbar")).toBeVisible();
  
  //!! bring supervisorPage to the front
  await supervisorPage.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! expect the text 'Manager 3 has replaced you on this call monitoring session with WebRTC Agent 11(215).' to be visible on supervisorPage
  await expect(supervisorPage.locator('text=Manager 3 has replaced you on this call monitoring session with WebRTC Agent 11(215).')).toBeVisible();
  
  //!! expect the "xima-supervisor-observation-toolbar" to not be visible on supervisorPage
  await expect(supervisorPage.locator("xima-supervisor-observation-toolbar")).not.toBeVisible();
  
  //!! on supervisorPage, click the ":text("OK")" button
  await supervisorPage.locator(':text("OK")').click();
  
  //!! bring managerPage to the front
  await managerPage.bringToFront();
  
  //!! on managerPage, click the ':text("End Call Monitoring")' button
  await managerPage.locator(':text("End Call Monitoring")').click();
  
  //!! close supervisorPage
  await supervisorPage.close();
  
  //!! close managerPage
  await managerPage.close();
  
});
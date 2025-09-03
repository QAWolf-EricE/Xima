import { buildUrl, getOutBoundNumber, logInAgent, logUCAgentIntoUCWebphone, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_outbound_assisted_transfer_to_uc_agent", async () => {
 // Step 1. Simulate an outbound call to 8889449462
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // state machine: workflow has started running
  await setState({
    id: "group4",
    state: "wf1running",
  });
  
  try {
    for (let i = 0; i < 3; i++) {
      // Login as a UC Agent (Xima Agent 4)
      const { page, browser, context } = await logInAgent({
        email: process.env.UC_AGENT_4_EXT_104,
        password: process.env.UC_AGENT_4_EXT_104_PASSWORD,
        args: [
          "--use-fake-ui-for-media-stream",
          "--use-fake-device-for-media-stream",
        ],
        permissions: ["microphone", "camera"],
      });
  
      // Login as a UC Agent (Xima Agent 5)
      const {
        page: page2,
        browser: browser2,
        context: context2,
      } = await logInAgent({
        email: process.env.UC_AGENT_5_EXT_105,
        password: process.env.UC_AGENT_5_EXT_105_PASSWORD,
        args: [
          "--use-fake-ui-for-media-stream",
          "--use-fake-device-for-media-stream",
        ],
        permissions: ["microphone", "camera"],
      });
  
      try {
        // inner try/catch
  
        // log into webphone for uc agent
        await page.waitForTimeout(3000);
        const webPhoneURL = `https://voice.ximasoftware.com/webphone`;
        const { ucWebPhonePage: webPhonePageFirst } =
          await logUCAgentIntoUCWebphone(
            context,
            process.env.UC_AGENT_4_EXT_104_WEBPHONE_USERNAME,
          );
        await page.waitForTimeout(3000);
  
        // Toggle Xima Agent 4 status to Ready
        await page.bringToFront();
        await toggleSkillsOn(page, "66");
        await toggleStatusOn(page);
  
        // log into webphone for uc agent
        const { ucWebPhonePage: webPhonePageSecond } =
          await logUCAgentIntoUCWebphone(
            context2,
            process.env.UC_AGENT_5_EXT_105_WEBPHONE_USERNAME,
          );
        await page.waitForTimeout(3000);
  
        // toggle agent skills on
        await page2.bringToFront();
        await toggleSkillsOn(page2, "67");
        await toggleStatusOn(page2);
  
        // create new context and log in as Supervisor
        const context3 = await browser.newContext({
          timezoneId: "America/Denver",
        });
        const page3 = await context3.newPage();
        await page3.bringToFront();
        await page3.goto(buildUrl("/"));
        await page3.fill(
          '[data-cy="consolidated-login-username-input"]',
          process.env.SUPERVISOR_USERNAME,
        );
        await page3.fill(
          '[data-cy="consolidated-login-password-input"]',
          process.env.SUPERVISOR_PASSWORD,
        );
        await page3.click('[data-cy="consolidated-login-login-button"]');
  
        //--------------------------------
        // Act:
        //--------------------------------
        // Simulate an outbound call through agent 4
        await webPhonePageFirst.bringToFront();
        await webPhonePageFirst.locator(`[data-testid="DialpadIcon"]`).click();
  
        // get phone number to make an outbound call
        const outboundNumberToCall = await getOutBoundNumber();
        console.log(outboundNumberToCall);
  
        // dial number to call
        await webPhonePageFirst
          .locator(`.dialer-number:visible`)
          .fill(`${outboundNumberToCall}`);
        await webPhonePageFirst.waitForTimeout(2000);
        await webPhonePageFirst
          .locator(`[data-testid="CallIcon"]:visible`)
          .click();
        await webPhonePageFirst.waitForTimeout(10000);
  
        //--------------------------------
        // Assert:
        //--------------------------------
        // assert call active
        await expect(
          webPhonePageFirst.locator(`[data-testid="CallEndIcon"]:visible`),
        ).toBeVisible();
  
        //--------------------------------
        // Arrange:
        //--------------------------------
  
        //--------------------------------
        // Act:
        //--------------------------------
        // transfer call from agent 4 to agent 5
        await webPhonePageFirst
          .locator(`[data-testid="PhoneForwardedIcon"]`)
          .click();
        await webPhonePageFirst.waitForTimeout(1000);
  
        // dial new number
        await webPhonePageFirst
          .getByRole(`menuitem`, { name: `Dial a new number` })
          .click();
        await webPhonePageFirst.waitForTimeout(1000);
  
        // call xima agent 4 (ext 105)
        await webPhonePageFirst
          .getByPlaceholder(`Search Contacts`)
          .first()
          .fill(`105`);
        await webPhonePageFirst
          .locator(`[data-testid="CallIcon"]:visible`)
          .first()
          .click({ delay: 1000 });
        await webPhonePageFirst
          .locator(`.MuiAvatar-root:has-text("X5"):visible >> nth=1`)
          .click();
        await webPhonePageFirst.waitForTimeout(5000);
  
        // click assisted transfer
        await webPhonePageFirst
          .locator(`li[role="menuitem"]:has-text("Assisted transfer")`)
          .waitFor();
        await webPhonePageFirst
          .getByRole(`menuitem`, { name: ` Assisted transfer` })
          .click({ position: { x: 10, y: 0 }, delay: 1000 });
        await webPhonePageFirst.waitForTimeout(1000);
  
        // If transfer was not successful, try again
        try {
          // await expect(page.getByText(`Two calls`).first()).toBeVisible({ timeout: 10 * 1000 });
          await expect(
            webPhonePageFirst
              .locator(`.MuiTypography-root:has-text("Xima Agent 5"):visible`)
              .first(),
          ).toBeVisible({ timeout: 10 * 1000 });
        } catch {
          // transfer call from agent 4 to agent 5
          await webPhonePageFirst
            .locator(`[data-testid="PhoneForwardedIcon"]`)
            .click();
          await webPhonePageFirst.waitForTimeout(1000);
  
          // dial new number
          await webPhonePageFirst
            .getByRole(`menuitem`, { name: `Dial a new number` })
            .click();
          await webPhonePageFirst.waitForTimeout(1000);
  
          // call xima agent 4 (ext 105)
          await webPhonePageFirst
            .getByPlaceholder(`Search Contacts`)
            .first()
            .fill(`105`);
          await webPhonePageFirst
            .locator(`[data-testid="CallIcon"]:visible`)
            .first()
            .click({ delay: 1000 });
          await webPhonePageFirst
            .locator(`.MuiAvatar-root:has-text("X5"):visible >> nth=1`)
            .click();
          await webPhonePageFirst.waitForTimeout(5000);
  
          // click assisted transfer
          await webPhonePageFirst
            .locator(`li[role="menuitem"]:has-text("Assisted transfer")`)
            .waitFor();
          await webPhonePageFirst.mouse.click(970, 435);
          await webPhonePageFirst.waitForTimeout(1000);
          // await expect(page.getByText(`Two calls`).first()).toBeVisible({ timeout: 10 * 1000 });
        }
  
        //--------------------------------
        // Assert:
        //--------------------------------
        // assert calling agent 5
        await expect(
          webPhonePageFirst
            .locator(`.MuiTypography-root:has-text("Xima Agent 5"):visible`)
            .first(),
        ).toBeVisible();
  
        // assert agent 5 gets the call
        await webPhonePageSecond.bringToFront();
        await expect(
          webPhonePageSecond.locator(`:text("Incoming Call")`),
        ).toBeVisible();
        await expect(
          webPhonePageSecond.locator(
            `h5:has-text("Xima Agent 4") + h6:has-text("104")`,
          ),
        ).toBeVisible();
        await webPhonePageSecond.waitForTimeout(2000);
  
        // answer call
        await webPhonePageSecond
          .locator(`button:has(+ p:text-is("ANSWER"))`)
          .click();
  
        //--------------------------------
        // Arrange:
        //--------------------------------
        // Supervisor can view new transferred agent is now talking
        await page3.bringToFront();
        await page3.hover('[data-mat-icon-name="realtime-display"]');
        await page3.click(':text-is("Supervisor View")');
  
        // cleanup - make sure 0 agents are selected
        await page3.click('[data-mat-icon-name="filter"]');
        await page3.click('[data-mat-icon-name="edit"]');
        await page3.waitForTimeout(4000);
        try {
          await expect(page3.locator(`:text("0 Agents Selected")`)).toBeVisible({
            timeout: 3000,
          });
        } catch {
          try {
            // if select all checkbox is checked, uncheck it
            await expect(
              page3.locator(
                `[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected`,
              ),
            ).toBeVisible({
              timeout: 3000,
            });
            // await page3.waitForTimeout(1000);
            // await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
            await page3
              .locator(`[data-cy="xima-list-select-select-all"]`)
              .click();
            await page3.waitForTimeout(1000);
          } catch (err) {
            console.log(err);
          }
          // Check and uncheck the box
          await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
          await page3.waitForTimeout(1000);
          await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
          await page3.waitForTimeout(1000);
        }
  
        //--------------------------------
        // Act:
        //--------------------------------
        // filter by uc agent (xima agent 5)
        await page3
          .locator(`[data-cy="xima-list-select-search-input"]`)
          .fill(`Xima Agent 4`);
        await page3.waitForTimeout(1000);
        await page3
          .locator(`[data-cy="xima-list-select-option"] div`)
          .first()
          .click();
        await page3.waitForTimeout(1000);
        await page3
          .locator(`[data-cy="xima-list-select-search-input"]`)
          .fill(`Xima Agent 5`);
        await page3.waitForTimeout(1000);
        await page3
          .locator(`[data-cy="xima-list-select-option"] div`)
          .first()
          .click();
        await page3.waitForTimeout(1000);
        await page3.locator('button.apply> span:text-is(" Apply ")').click();
        await page3.waitForTimeout(1000);
        await page3
          .locator('[data-cy="supervisor-view-filter-apply-button"]')
          .click();
  
        // See refresh dialog
        await expect(page3.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
        // Click OK
        await page3.getByRole(`button`, { name: `Ok` }).click();
  
        //--------------------------------
        // Assert:
        //--------------------------------
        // Assert that agent was found "Talking"
        await expect(
          page3.locator('[translationset="CALL_EVENT_TYPE"]:has-text("Talking")'),
        ).toHaveCount(2);
  
        // Clean up - reset filter
        await page3.keyboard.press("Escape");
        await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
        await page3
          .locator(
            '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
          )
          .click();
        await page3.locator('[data-cy="xima-list-select-select-all"]').click();
        await page3.waitForTimeout(1200);
        await page3.locator('button.apply> span:text-is(" Apply ")').click();
        await page3.waitForTimeout(1200);
        await page3
          .locator('[data-cy="supervisor-view-filter-apply-button"]')
          .click();
        
        // See refresh dialog
        await expect(page3.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
        // Click OK
        await page3.getByRole(`button`, { name: `Ok` }).click();
  
        //--------------------------------
        // Arrange:
        //--------------------------------
        // agent 3 press complete transfer
        await webPhonePageFirst.bringToFront();
        await webPhonePageFirst
          .getByRole(`button`, { name: `Complete Transfer` })
          .click();
        await expect(
          webPhonePageFirst.locator(`:text("Transfer completed")`),
        ).toBeVisible();
  
        // wait a few seconds
        await webPhonePageSecond.waitForTimeout(3000);
  
        // agent 4 end call
        await webPhonePageSecond.bringToFront();
        await webPhonePageSecond
          .locator(`[data-testid="CallEndIcon"]:visible`)
          .click();
  
        // Log back into Admin user and assert call correctness
        await page3.bringToFront();
        await page3.hover('[data-mat-icon-name="reports"]');
        await page3.click(
          'app-navigation-menu-translation:has-text("Cradle to Grave")',
        );
        await page3.click('[aria-label="Open calendar"]');
        await page3.click(`.mat-calendar-body-cell :text-is("1")`);
        await page3.click(".mat-calendar-body-today");
        await page3.waitForTimeout(1000);
        await page3.click(
          '[data-cy="configure-cradle-to-grave-container-apply-button"]',
        ); // click apply
        await page3.waitForTimeout(1000);
  
        // include filter to have unique agent to avoid collisions
        await page3.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
        try {
          await page3
            .locator(
              '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
            )
            .click();
        } catch {
          await page3.locator(`xima-header-add`).getByRole(`button`).click();
          await page3
            .locator(`[data-cy="xima-criteria-selector-search-input"]`)
            .fill(`Agent`);
          await page3.getByText(`Agent`, { exact: true }).click();
          await page3
            .locator(
              '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
            )
            .click();
        }
        await page3
          .locator('[data-cy="xima-list-select-search-input"]')
          .fill("Xima Agent 4");
        await page3.waitForTimeout(2000);
        await page3.locator('[data-cy="xima-list-select-select-all"]').click();
        await page3
          .locator('[data-cy="agents-roles-dialog-apply-button"]')
          .click();
        await page3.waitForTimeout(2000);
        await page3
          .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
          .click();
  
        //--------------------------------
        // Act:
        //--------------------------------
        // expand last oubound call report
        await page3.click(
          '.mat-sort-header-container:has-text("START TIME") >> nth=1',
        );
        await page3.click(
          '.mat-sort-header-container:has-text("START TIME") >> nth=1',
        );
        await expect(
          page3.locator(`.mdc-linear-progress__bar-inner`),
        ).toHaveCount(0);
        await page3.waitForTimeout(2000);
  
        //--------------------------------
        // Assert:
        //--------------------------------
        // assert C2G correctness
        await page3.click(
          'mat-row:has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
        );
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing") >>nth=0`,
          ),
        ).toBeVisible();
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
          ),
        ).toHaveCount(2);
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Transfer Hold") >>nth=0`,
          ),
        ).toBeVisible();
        await page3
          .locator(
            `[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`,
          )
          .click();
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing")`,
          ),
        ).toHaveCount(2);
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
          ),
        ).toHaveCount(3);
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Transfer") >>nth=0`,
          ),
        ).toBeVisible();
        await expect(
          page3.locator(
            `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Drop") >>nth=0`,
          ),
        ).toBeVisible();
  
        // break loop if attempt is successful
        break;
      } catch (err) {
        // if all loops failed
        if (i >= 2) {
          throw Error(`All retries failed! Error: ${err}`);
        }
  
        // close browsers before next loop starts
        await browser2.close();
        await browser.close();
      }
    }
  } catch (err) {
    // state machine: workflow has finished running
    await setState({
      id: "group4",
      state: "wf2done",
    });
  
    throw Error(`Test failed. Needs investigating. Error: ${err}`);
  }
  
  // state machine: workflow has finished running
  await setState({
    id: "group4",
    state: "wf2done",
  });
  
 // Step 2. Assisted transfer by dial pad (outbound call assisted transfer to UC extension)
  
 // Step 3. Supervisor can view new transferred agent is now talking (outbound call assisted transfer to UC extension)
  
 // Step 4. View Call in C2G (outbound call assisted transfer to UC extension)
  
});
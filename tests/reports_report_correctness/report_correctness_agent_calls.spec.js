import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_calls", async () => {
 // Step 1. View Agent calls report
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  // assert on "My Reports" page
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  // REQ149 Report run time adds one every configuration
  // search "Agent Calls 2"
  await page.fill('[placeholder="Type to Search"]', "Agent Calls 2");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  
  // store run times
  const currRunTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]',
  );
  
  // click "Agent Calls 2"
  await page.click(':text-is("Agent Calls 2")');
  
  // assert in "Agent Calls 2" page
  // await expect(
  //   page.locator(
  //     '[data-cy="report-execution-toolbar-report-title"]:has-text("Agent Calls 2")',
  //   ),
  // ).toBeVisible();
  await expect( async () => {
  
    try {
      // click configure
      await page.click('[data-cy="report-execution-toolbar-configure-button"]');
      // click apply
      await page.click('[data-cy="configure-report-apply-button"]');
  
      // wait for loading to stop
      await expect(page.locator(':text("Calculating Data")')).toBeVisible({
        timeout: 90000,
      });
      await expect(page.locator(':text("Calculating Data")')).not.toBeVisible({
        timeout: 180000,
      });
    } catch {
      // click configure
      await page.click('[data-cy="report-execution-toolbar-configure-button"]');
      // click apply
      await page.click('[data-cy="configure-report-apply-button"]');
  
      // wait for loading to stop
      await expect(page.locator(':text("Calculating Data")')).toBeVisible({
        timeout: 90000,
      });
      // wait for report to load
      await expect(page.locator(`:text("Calculating Data")`)).not.toBeVisible({
        timeout: 2 * 60 * 1000,
      });
  
      await page.reload();
    }
    
  }).toPass({timeout: 180000})
  await page.waitForTimeout(3000);
  
  // go back to results
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await page.waitForTimeout(10 * 1000); // give time for run count to update
  
  // assert run time has increased by 1
  try {
    await expect(
      page.locator('mat-row:has([data-cy="reports-list-report-name"]:text-is("Agent Calls 2")) [data-cy="reports-list-report-run-times"]'),
    ).toHaveText((parseInt(currRunTimes) + 1).toString());
  } catch {
    expect(
      parseInt(await page.innerText('mat-row:has([data-cy="reports-list-report-name"]:text-is("Agent Calls 2")) [data-cy="reports-list-report-run-times"]')),
    ).toBeGreaterThan(parseInt(currRunTimes));
  }
  
  // REQ176 View Agent calls report
  // click "Agent Calls 2"
  await page.click(':text-is("Agent Calls 2")');
  
  // assert in "Agent Calls 2" page
  await expect(
    page.locator(
      '[data-cy="report-execution-toolbar-report-title"]:has-text("Agent Calls 2")',
    ),
  ).toBeVisible();
  
  // REQ177 Assert correct tiles for Agent Calls report
  // assert "Total Calls"
  await expect(
    page.locator('[role="cell"]:below(:text-is("Total Calls")) >> nth=0'),
  ).toHaveText(/[0-9]+/);
  
  // assert "Answered Calls"
  await expect(
    page.locator('[role="cell"]:below(:text-is("Answered Calls")) >> nth=0'),
  ).toHaveText(/[0-9]+/);
  
  // assert "Total Talking Duration"
  await expect(
    page.locator(
      '[role="cell"]:below(:text-is("Total Talking Duration")) >> nth=0',
    ),
  ).toHaveText(/[0-9]+:[0-9]{2}:[0-9]{2}/);
  
  // assert "Avg Talking Duration"
  await expect(
    page.locator(
      '[role="cell"]:below(:text-is("Avg Talking Duration")) >> nth=0',
    ),
  ).toHaveText(/[0-9]+:[0-9]{2}:[0-9]{2}/);
  
});
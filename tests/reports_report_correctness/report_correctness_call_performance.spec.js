import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_call_performance", async () => {
 // Step 1. View Call Performance report
  // REQ01 login
  const { page } = await logInSupervisor();
  
  // REQ09 - Navigate to my reports
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]', { timeout: 1 * 60 * 1000 }
  );
  
  // search "Call Performance"
  await page.fill('[placeholder="Type to Search"]', "Call Performance");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  
  // get run times for Call Performance report
  const currRunTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]'
  );
  
  // REQ164 - View Call Performance report
  await page.click(
    '[data-cy="reports-list-report-name"]:has-text("Call Performance")'
  );
  await expect(
    page.locator(
      '[data-cy="report-execution-toolbar-report-title"]:has-text("Call Performance")'
    )
  ).toBeVisible();
  
  // REQ165 - Assert correct tiles for Call Performance report
  await expect(page.locator(':text-is("HOUR OF DAY")')).toBeVisible();
  await expect(page.locator(':text-is("CALLS PRESENTED")')).toBeVisible();
  await expect(page.locator(':text-is("CALLS ANSWERED")')).toBeVisible();
  await expect(page.locator(':text-is("CALLS MISSED")')).toBeVisible();
  await expect(page.locator(':text-is("ANSWERED CALLS PERCENT")')).toBeVisible();
  await expect(
    page.locator(':text-is("CALLS ANSWERED WITHIN 15 SEC")')
  ).toBeVisible();
  await expect(
    page.locator(':text-is("CALLS ANSWERED WITHIN 30 SEC")')
  ).toBeVisible();
  await expect(
    page.locator(':text-is("CALLS ANSWERED WITHIN 60 SEC")')
  ).toBeVisible();
  await expect(
    page.locator(':text-is("CALLS ANSWERED AFTER 60 SEC")')
  ).toBeVisible();
  await expect(page.locator(':text-is("CALLBACKS SCHEDULED")')).toBeVisible();
  await expect(page.locator(':text-is("CALLBACKS ACCEPTED")')).toBeVisible();
  await expect(
    page.locator(':text-is("CALLBACKS CANCELLED / ABORTED")')
  ).toBeVisible();
  await expect(
    page.locator(':text-is("ACCEPTED CALLBACK PERCENT")')
  ).toBeVisible();
  await expect(page.locator(':text-is("AVG TALKING DURATION")')).toBeVisible();
  await expect(page.locator(':text-is("AVG CALL DURATION")')).toBeVisible();
  
  // REQ149 - Report run time adds one every configuration
  // click configure -> click apply
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // assert loading report
  try {
    await expect(page.locator(':text("Gathering Report...")')).toBeVisible();
    await expect(page.locator(':text("Gathering Report...")')).not.toBeVisible();
  } catch {
    await page.reload();
    await expect(page.locator(':text("Gathering Report...")')).not.toBeVisible();
  }
  
  
  // go back
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  // assert report run time is increased by 1
  var newRunTimes = parseInt(currRunTimes) + 1;
  await expect(
    page.locator(
      'mat-row:has-text("Call Performance") >> [data-cy="reports-list-report-run-times"] >> nth=0'
    )
  ).toHaveText(newRunTimes.toString());
});
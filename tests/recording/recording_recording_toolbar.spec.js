import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("recording_recording_toolbar", async () => {
 // Step 1. Navigate to Recording Toolbar
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor({ slowMo: 500 });
  
  // get email
  const { emailAddress, waitForMessage } = await getInbox({
    address: `xima+recordingtoolbar@qawolf.email`,
  });
  
  // navigate to cradle to grave
  await page.click('[data-cy="reports-c2g-component-tab-ctog"]');
  await page.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // // Click the "Close" button
  // await page.getByRole(`button`, { name: `Close` }).click();
  
  // set date range to last month
  await page.click(':text-is("Filters")');
  await page.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
  );
  await page.click('[aria-label="Previous month"]');
  await page.click('[aria-label="Previous month"]');
  await page.click('td[role="gridcell"] :text-is("1")');
  await page.click('[aria-label="Next month"]');
  await page.click('td[role="gridcell"] :text-is("25")');
  
  // select agent that records
  try {
    await page
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page.locator(`xima-header-add`).getByRole(`button`).click();
    await page
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page.getByText(`Agent`, { exact: true }).click();
    await page
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  
  await page.waitForTimeout(1000);
  await page.fill('[formcontrolname="searchInput"]', "WebRTC Agent 69");
  await page.waitForTimeout(1000);
  await page.click(
    '[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 69")',
  );
  await page.waitForTimeout(1000);
  await page.click('[class*="overlay"] button:has-text("Apply")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(3000);
  
  // Navigate to first recording
  await page.click('[data-cy="cradle-to-grave-table-recording-button"]');
  await page.waitForTimeout(5000);
  
  // adjust playback speed
  await page.locator("#Layer_1").waitFor();
  await page.locator("#Layer_1").click({ delay: 300 });
  await page.locator(':text("0.25x")').click();
  
  // confirm adjustment persists
  await page.locator("#Layer_1").click();
  try {
    await expect(page.locator(`button:has-text("check0.25x")`)).toBeVisible();
  } catch {
    await expect(page.locator("text=0.25xcheck")).toBeVisible();
  }
  
  // close speed adjust
  await page.click("body");
  
  // adjust volume
  await page.click('[data-cy="c2g-recordings-volume-button"]');
  await page.locator(`[min="0"]:visible >> nth=0`).click();
  
  // close volume adjust
  await page.click('[data-cy="c2g-recordings-volume-button"]');
  
  // open volume adjust and confirm adjustment persisted
  await page.click('[data-cy="c2g-recordings-volume-button"]');
  await expect(page.locator('[aria-valuetext="50"]')).toBeVisible();
  
  // close volume adjust
  await page.click('[data-cy="c2g-recordings-volume-button"]');
  
  // email recording
  await page.click('[data-cy="c2g-recordings-options-button"]');
  await page.click('[data-cy="c2g-recordings-email-button"]');
  await page.click("mat-form-field");
  
  await page.fill('[data-cy="app-prompt-input"]', emailAddress);
  const after = new Date();
  await page.click('[data-cy="app-prompt-submit"]');
  const msg = await waitForMessage({ after });
  
  expect(msg.attachments.length).toBe(1);
  expect(msg.subject).toContain("Xima CCaaS Recorded Call");
  
  // create snippet of recording
  await page.click('[data-cy="c2g-recordings-options-button"]');
  await page.click('[data-cy="c2g-recordings-create-snippet-button"]');
  
  // assert snipped editor visible
  await expect(
    page.locator('[data-cy="c2g-recordings-left-snippet"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-cy="c2g-recordings-right-snippet"]'),
  ).toBeVisible();
  
  // download snippet
  const snippetPromise = page.waitForEvent("download");
  await expect(
    page.locator('[data-cy="c2g-recording-snippet-download-btn"]'),
  ).toBeVisible();
  await page.click('[data-cy="c2g-recording-snippet-download-btn"]');
  const snippet = await snippetPromise;
  
  // Wait for the snippet to complete
  console.log(await snippet.path());
  
  // close editor
  await page.click('[data-cy="c2g-recordings-back-button"]');
  
  // download recording
  const downloadPromise = page.waitForEvent("download");
  await expect(
    page.locator('[data-cy="c2g-recordings-download-button"]'),
  ).toBeVisible();
  await page.click('[data-cy="c2g-recordings-download-button"]');
  const download = await downloadPromise;
  
  // Wait for the download to complete
  console.log(await download.path());
  
 // Step 2. Download/Playback recordings
  // Arrange
  // navigate to recordings toolbar (cradle to grave)
  // play a recording
  
  // Act:
  // download recording
  
  // Assert:
  // assert recording able to be downloaded
  
 // Step 3. Adjust playback speed of recording
  // Arrange:
  // navigate to recordings toolbar (cradle to grave)
  // play a recording
  
  // Act:
  // adjust playback speed
  
  // Assert:
  // assert playback speed able to be adjusted
  
 // Step 4. Adjust playback volume of recording
  // Arrange:
  // navigate to recordings toolbar (cradle to grave)
  // play a recording
  
  // Act:
  // adjust playback volume
  
  // Assert:
  // assert playback volume able to be adjusted
  
 // Step 5. Snip recording
  // Arrange:
  // navigate to recordings toolbar (cradle to grave)
  
  // Act:
  // snip recording
  
  // Assert:
  // assert recording able to be snipped
  
 // Step 6. Email Recording
  // Arrange:
  // navigate to recordings toolbar (cradle to grave)
  
  // Act:
  // email a recording
  
  // Assert:
  // assert recording emailed
  
});
import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_custom_8_14_widgets", async () => {
 // Step 1. Add widget: Widget group
  //--------------------------------
  // Arrange:
  //--------------------------------
  const wallboardPrefix = `QA Wallboard 8-14`;
  const wallboardName = `${wallboardPrefix} ` + Date.now().toString().slice(-4);
  const widgetGroupTitle = `Widget Group Title`;
  const widgetPageTitle = `Widget Page Title`;
  const widgetURL = `www.google.com`;
  const widgetTitleName = `Widget Name`;
  const widgetTextTitle = `Widget Text Title`;
  const widgetTextContent = faker.random.words(4);
  const widgetPieChartTitle = `Widget Pie Chart Title`;
  const widgetMarqueeTitle = `Widget Marquee Title`;
  const widgetMarqueeContent = faker.random.words(4);
  
  // Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to realtime wallboards
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  await page.locator(':text("Realtime Wallboards")').click();
  
  // Ensure page loads
  await expect(page.locator(`button:has-text("New Wallboard")`)).toBeVisible({
    timeout: 60000,
  });
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first(),
  ).toBeVisible();
  
  // Clean test if needed
  await page.locator('[placeholder="Type to Search"]').fill(wallboardPrefix);
  await page.keyboard.press("Enter");
  
  // Wait for search results to load
  await page.waitForTimeout(5000);
  
  // Cleanup existing wallboards
  while (await page.locator(`:text("${wallboardPrefix}")`).count()) {
    await page
      .locator(
        `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardPrefix}")) >> nth=0`,
      )
      .click();
    await page.locator('[data-cy="realtime-wallboards-item-delete"]').click();
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await page.waitForTimeout(5000);
  }
  
  // Create Custom Real wallboard
  await page.locator(`button:has-text("New Wallboard")`).click();
  await expect(
    page.getByRole(`heading`, { name: `Select a template` }),
  ).toBeVisible();
  
  // Click Custom Wallboard option
  await page.locator(`.card:has(p:text-is("Custom"))`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Edit Wallboard")`),
  ).toBeVisible();
  
  // Fill in 'Edit Wallboard' modal information
  await page.locator(`mat-label:text("Title") ~ mat-form-field`).click();
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(wallboardName);
  await page.keyboard.press("Enter");
  
  // Click the Apply button in the modal
  await page.locator(`xima-dialog button:has-text("Apply")`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Edit Wallboard")`),
  ).not.toBeVisible();
  await expect(page.getByRole(`button`, { name: `Save and Exit` })).toBeVisible();
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Widget group on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Widget Group")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Widget Group")`)
    .click();
  
  // Verify Widget group is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(widgetGroupTitle);
  
  // Click Apply button
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the widget group updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
 // Step 2. Add widget: Web page
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Web Page on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Web Page")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Web Page")`)
    .click();
  
  // Verify Web Page is added
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(
    page.locator(`mat-label:text("URL") ~ mat-form-field`),
  ).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(widgetPageTitle);
  await page.keyboard.press("Enter");
  
  // Fill in URL field
  await page
    .locator(`mat-label:text("URL") ~ mat-form-field input`)
    .fill(widgetURL);
  await page.keyboard.press("Enter");
  
  // Click Apply button
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the Web Page updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
  // Assert the Widget Group is still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  
 // Step 3. Add widget: Title value
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Title Value on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Title Value")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Title Value")`)
    .click();
  
  // Verify Title Value is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select Metric"]`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(widgetTitleName);
  await page.keyboard.press("Enter");
  
  // Click Metric dropdown
  await page.locator(`[placeholder="Select Metric"]`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Metric Selector")`),
  ).toBeVisible();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`Abandoned Call Count`).click();
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the Abandoned Call Count modal
  await expect(
    page.locator(`xima-dialog:has-text("Abandoned Call Count")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("Abandoned Call Count") button:has-text("Apply")`,
    )
    .click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the Title Value updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetTitleName}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
  // Assert metric is visible
  await expect(page.locator("app-metric >> nth=0")).toBeVisible({
    timeout: 1 * 60 * 1000,
  });
  
  // Assert the other widgets are still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  
 // Step 4. Add widget: Text
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Text on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Text")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Text")`)
    .click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  // Verify Text is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select Metric"]`)).toBeVisible();
  await expect(page.locator(`mat-label:text("Text") ~ textarea`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(widgetTextTitle);
  await page.keyboard.press("Enter");
  
  // Click Metric dropdown
  await page.locator(`[placeholder="Select Metric"]`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Metric Selector")`),
  ).toBeVisible();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`Abandoned Call Count`).click();
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the Abandoned Call Count modal
  await expect(
    page.locator(`xima-dialog:has-text("Abandoned Call Count")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("Abandoned Call Count") button:has-text("Apply")`,
    )
    .click();
  
  // Fill in content section
  await page.locator(`mat-label:text("Text") ~ textarea`).fill(widgetTextContent);
  await page.keyboard.press("Enter");
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the Text updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetTextTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
  // Assert Text content
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTextTitle}"):has-text("${widgetTextContent}")`,
    ),
  ).toBeVisible();
  
  // Assert the other widgets are still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTitleName}"):has(app-metric)`,
    ),
  ).toBeVisible();
  
 // Step 5. Add widget: Pie Chart
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Pie Chart on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Pie Chart")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Pie Chart")`)
    .click();
  
  // Verify Pie Chart Widget is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select a Category"]`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(widgetPieChartTitle);
  await page.keyboard.press("Enter");
  
  // Click Category dropdown
  await page.locator(`[placeholder="Select a Category"]`).click();
  
  // Select a Category
  await expect(page.getByRole(`option`, { name: `Account Code` })).toBeVisible();
  await page.getByRole(`option`, { name: `Account Code` }).click();
  
  // Click the Pencil edit icon
  await page.getByRole(`region`, { name: `Values` }).getByRole(`button`).click();
  
  // Select All in the Account Codes modal
  await expect(
    page.locator(`app-configure-report-parameter:has-text("Account Codes")`),
  ).toBeVisible();
  await page
    .locator(`[type="checkbox"]:left-of(:text("All")) >> nth=0`)
    .evaluate((node) => node.click());
  
  // Apply changes
  await page
    .locator(
      `app-configure-report-parameter:has-text("Account Codes") button:has-text("Apply")`,
    )
    .click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the Text updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPieChartTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
  // Assert pie chart is visible
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetPieChartTitle}") .pie-chart`,
    ),
  ).toBeVisible();
  
  // Assert the other widgets are still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTitleName}"):has(app-metric)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTextTitle}"):has-text("${widgetTextContent}")`,
    ),
  ).toBeVisible();
  
 // Step 6. Add widget: Marquee
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Marquee on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Marquee")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Marquee")`)
    .click();
  
  // Verify Marquee Widget is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select Metric"]`)).toBeVisible();
  await expect(page.locator(`mat-label:text("Text") ~ textarea`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(widgetMarqueeTitle);
  await page.keyboard.press("Enter");
  
  // Click Metric dropdown
  await page.locator(`[placeholder="Select Metric"]`).click();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`Abandoned Call Count`).click();
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the Abandoned Call Count modal
  await expect(
    page.locator(`xima-dialog:has-text("Abandoned Call Count")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("Abandoned Call Count") button:has-text("Apply")`,
    )
    .click();
  
  // Fill in content section
  await page
    .locator(`mat-label:text("Text") ~ textarea`)
    .fill(widgetMarqueeContent);
  await page.keyboard.press("Enter");
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the title of the Text updated
  await expect(
    page.locator(`app-widget-container:has-text("${widgetMarqueeTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
  // Assert Marquee is visible
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetMarqueeTitle}") .marquee:has-text("${widgetMarqueeContent}")`,
    ),
  ).toBeVisible();
  
  // Assert the other widgets are still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTitleName}"):has(app-metric)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTextTitle}"):has-text("${widgetTextContent}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetPieChartTitle}") .pie-chart`,
    ),
  ).toBeVisible();
  
 // Step 7. Add widget: Line
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Line on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Line")`)
    .scrollIntoViewIfNeeded();
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Line")`)
    .click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Line widget is added
  await expect(
    page.locator(`app-line-widget-container:has(app-line-widget)`),
  ).toBeVisible();
  
  // Assert the other widgets are still visible
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTitleName}"):has(app-metric)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTextTitle}"):has-text("${widgetTextContent}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetPieChartTitle}") .pie-chart`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetMarqueeTitle}") .marquee:has-text("${widgetMarqueeContent}")`,
    ),
  ).toBeVisible();
  
  // Click the kebab button next to the Save and Exit button
  await page.locator('button:has-text("Save and Exit") ~ button').click();
  
  // Click go to Preview
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click();
  await expect(page.locator(`button:has-text("Full Screen")`)).toBeVisible();
  await page.waitForTimeout(2000);
  
  // Assert all widgets are visible
  await expect(
    page.locator(`app-line-widget-container:has(app-line-widget)`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetGroupTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("${widgetPageTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTitleName}"):has(app-metric)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetTextTitle}"):has-text("${widgetTextContent}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetPieChartTitle}") .pie-chart`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${widgetMarqueeTitle}") .marquee:has-text("${widgetMarqueeContent}")`,
    ),
  ).toBeVisible();
  //----------------------
  // Cleanup:
  //----------------------
  // Click the kebab button next to the Full Screen button
  await page.locator("app-fullscreen-btn ~ button").click();
  
  await page.locator('button:has-text("Edit Wallboard")').click();
  await expect(page.locator('button:has-text("Save and Exit")')).toBeVisible();
  await page.locator('button:has-text("Save and Exit")').click();
  
  // Wait for page to load
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible({
    timeout: 60000,
  });
  
  // Delete wallboard
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).toBeVisible();
  
  // Click the kebab menu
  await page
    .locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}")) button`,
    )
    .click();
  
  // Click the Delete option
  await page.getByRole(`menuitem`, { name: `Delete` }).click();
  
  // Click Confirm in the delete modal
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  // Verify Wallboard card disappears
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).not.toBeVisible();
  
});
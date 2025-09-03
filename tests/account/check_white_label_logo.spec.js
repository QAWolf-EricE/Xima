import { buildUrl } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("check_white_label_logo", async () => {
 // Step 1. Check White Label Logo
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  const { browser, context } = await launch({
    username: "Manager 1",
    password: "Password07272023!",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
    const page = await context.newPage();
    await page.goto(buildUrl("/"));
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Context: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1738704756489859?thread_ts=1738248162.003129&cid=C03PG5DB4N9
  await expect(page).toHaveScreenshot("WhiteLogo.png", {
    maxDiffPixelRatio: 0.01
  });
});
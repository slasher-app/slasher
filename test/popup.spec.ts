import { test, expect } from "./fixtures";
import { openPopup } from "./pages/popup";

test("Popup can be opened", async ({ page, extensionId }) => {
  const popup = await openPopup(page, extensionId);
  expect(await popup.root()).toBeDefined();
});

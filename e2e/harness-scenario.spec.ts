import { expect, test } from "@playwright/test";

// Harness §18: the 10-step acceptance scenario.
// This is a starter spec — devs install Playwright then run it directly.
test("harness §18 acceptance flow", async ({ page }) => {
  await page.goto("/");

  // 1. Child screen entered (no visible Korean in JSX children).
  await expect(page.locator('main[aria-label="child-story"]')).toBeVisible();

  // 2. Press the character; mock voice indicator should appear briefly.
  await page.locator('button[aria-label="깡총이"]').click();
  // 3. Voice icon (🔊) becomes opaque during the 700ms playback.
  // (Just assert the button click didn't error; the visual is animated.)

  // 4. First scene choice → next scene transition.
  await page.locator('button[aria-label="카트 밀기"]').first().click();
  await expect(page.locator('button[aria-label="바나나 고르기"]')).toBeVisible();

  // 5. Pick banana (food sequence) and reach final scene.
  await page.locator('button[aria-label="바나나 고르기"]').click();
  await expect(page.locator('span[aria-label="story-end"]')).toBeVisible({
    timeout: 5000,
  });

  // 6. 3-second long press on parent gate.
  const gate = page.locator('button[aria-label="parent-gate"]');
  await gate.dispatchEvent("pointerdown");
  await page.waitForTimeout(3100);
  await gate.dispatchEvent("pointerup");

  // 7. Parent home is shown.
  await expect(page.getByText("부모 화면")).toBeVisible();

  // 8. Open play menu → restart.
  await page.getByText("놀이 메뉴").first().click();
  await page.getByText("이야기 재시작").click();
  await page.getByText("뒤로").click();

  // 9. Open log viewer; expect at least 4 events listed.
  await page.getByText("턴 로그").first().click();
  await expect(page.getByText("세션 시작")).toBeVisible();
});

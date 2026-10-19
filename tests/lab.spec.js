import { test, expect } from "@playwright/test";
import path from "node:path";

const shot = path.join("docs", "screenshots");

test("home, guide, and a lesson render", async ({ page }, info) => {
  const size = info.project.name;
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.screenshot({ path: path.join(shot, `wave-home-${size}.png`), fullPage: false });
  await page.locator(".cg-monkey").click();
  await expect(page.locator("#cg-panel")).toBeVisible();
  await page.screenshot({ path: path.join(shot, `wave-bot-${size}.png`), fullPage: false });
  await page.goto("/rooms/T02-dialogs.html");
  await expect(page.locator("h1")).toContainText("Dialog");
  await page.screenshot({ path: path.join(shot, `wave-lesson-${size}.png`), fullPage: false });
});

test("short screen keeps the chat input visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 430 });
  await page.goto("/");
  await page.locator(".cg-monkey").click();
  const input = page.locator(".cg-form input");
  const send = page.locator(".cg-form button[type=submit]");
  await expect(input).toBeVisible();
  await expect(send).toBeVisible();
  const covered = await input.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight || rect.top < 0) return true;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !(hit === el || el.contains(hit));
  });
  expect(covered).toBe(false);
  await expect(page.locator(".phone-dock")).toBeHidden();
  await expect(page.locator("[data-voice-row]")).toBeHidden();
});

test("simulator gives instant feedback", async ({ page }) => {
  await page.goto("/simulator.html");
  await expect(page.locator(".sim-banner")).toContainText("Simulation");
  await page.getByRole("button", { name: "Send INVITE" }).click();
  await expect(page.locator("[data-result]")).toContainText("100 Trying");
  await page.locator("[data-port]").fill("0");
  await page.getByRole("button", { name: "Send 180" }).click();
  await page.getByRole("button", { name: "Send 200 and ACK" }).click();
  await expect(page.locator("[data-result]")).toContainText("port 0");
});

test("offline lesson and chat", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return ready.active && ready.active.scriptURL;
  });
  await page.reload();
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto("/rooms/T02-dialogs.html");
  await expect(page.locator("h1")).toContainText("Dialog");
  await page.locator(".cg-monkey").click();
  await page.locator(".cg-form input").fill("How is a SIP dialog identified?");
  await page.locator(".cg-form button[type=submit]").click();
  await expect(page.locator("#cg-panel")).toContainText(/dialog/i, { timeout: 10000 });
});

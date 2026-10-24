import { expect, test, type Page } from "@playwright/test";

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function counts(page: Page) {
  return page.evaluate(() => ({
    enter: Number(document.documentElement.dataset.viewEnter ?? 0),
    exit: Number(document.documentElement.dataset.viewExit ?? 0),
  }));
}

for (const mode of ["native", "fallback"] as const) {
  test(`UX-013 / CHATT-016: ${mode} view transitions preserve state and the latest navigation wins`, async ({
    page,
  }) => {
    await page.addInitScript((fallback) => {
      const record = (key: "viewEnter" | "viewExit") => {
        const data = document.documentElement.dataset;
        data[key] = String(Number(data[key] ?? 0) + 1);
      };
      if (fallback) {
        Object.defineProperty(document, "startViewTransition", {
          value: undefined,
        });
        const original = Element.prototype.animate;
        Element.prototype.animate = function (
          ...args: Parameters<Element["animate"]>
        ) {
          if (this.matches(".ordering-app")) {
            const frames = args[0] as Keyframe[];
            record(frames[0]?.opacity === 0 ? "viewEnter" : "viewExit");
          }
          return original.apply(this, args);
        };
      } else {
        document.addEventListener("animationstart", (event) => {
          if (event.animationName === "view-in") record("viewEnter");
          if (event.animationName === "view-out") record("viewExit");
        });
      }
    }, mode === "fallback");
    let posts = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/chat") && request.method() === "POST")
        posts++;
    });
    await page.goto("/");
    const input = page.getByRole("textbox", {
      name: "Meddelande till Gulo Gulo",
    });
    await input.fill("Vem gör korven?");
    await page
      .getByRole("button", { name: "Skicka meddelande", exact: true })
      .click();
    await expect(page.getByRole("log")).toContainText("Niklas på plats");
    await input.fill("Min påbörjade fråga");
    for (const name of [
      "Välj från menyn",
      "Mina beställningar",
      "Chatta med oss",
      "varukorg",
      "Chatta med oss",
    ]) {
      const before = await counts(page);
      if (name === "varukorg") {
        await page
          .getByRole("button", {
            name: "Visa beställning, 0 varor",
            exact: true,
          })
          .click();
      } else await navigate(page, name);
      await expect
        .poll(async () => (await counts(page)).exit)
        .toBeGreaterThan(before.exit);
      await expect
        .poll(async () => (await counts(page)).enter)
        .toBeGreaterThan(before.enter);
    }
    await expect(input).toHaveValue("Min påbörjade fråga");
    await expect(page.getByRole("log")).toContainText("Niklas på plats");
    expect(posts).toBe(1);
    await page
      .getByRole("navigation", { name: "Beställningssätt" })
      .evaluate((element) => {
        const buttons = element.querySelectorAll("button");
        for (const index of [0, 1, 2]) buttons[index]!.click();
      });
    await expect(
      page.getByRole("heading", { name: "Mina beställningar", exact: true }),
    ).toBeVisible();
    await page.evaluate(() =>
      Promise.allSettled(
        document.getAnimations().map((animation) => animation.finished),
      ),
    );
    const beforeReduced = await counts(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await navigate(page, "Välj från menyn");
    await expect(page.getByRole("heading", { name: /Bra korv/ })).toBeVisible();
    await navigate(page, "Chatta med oss");
    await expect(input).toHaveValue("Min påbörjade fråga");
    expect(await counts(page)).toEqual(beforeReduced);
    expect(posts).toBe(1);
  });
}

test("UX-011/012: button, Escape and backdrop close info with an inert exit and restored focus", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await navigate(page, "Välj från menyn");
  const opener = page.getByRole("button", {
    name: "Mer om GHOSTDOG",
    exact: true,
  });
  const dialog = page.locator('dialog.sheet[aria-label="Om GHOSTDOG"]');
  for (const method of ["button", "escape", "backdrop"]) {
    await opener.click();
    await expect(dialog).toBeVisible();
    if (method === "button")
      await dialog.getByRole("button", { name: "Stäng", exact: true }).click();
    else if (method === "escape") await page.keyboard.press("Escape");
    else await page.mouse.click(4, 4);
    await expect(dialog).toHaveClass(/is-closing/);
    await expect(dialog).toHaveAttribute("inert", "");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    if (method === "button") {
      await dialog.evaluate((element) => {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = 210;
        }
      });
      await page.screenshot({ path: testInfo.outputPath("closing-info.png") });
      await dialog.evaluate((element) =>
        element.getAnimations().forEach((animation) => animation.play()),
      );
    }
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  }
});

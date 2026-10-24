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
    direction: document.documentElement.dataset.viewLast ?? "",
  }));
}

for (const mode of ["native", "fallback"] as const) {
  test(`UX-013 / CHATT-016: ${mode} view transitions move in the navigation direction, preserve state and the latest navigation wins`, async ({
    page,
  }) => {
    await page.addInitScript((fallback) => {
      const record = (key: "viewEnter" | "viewExit", direction: string) => {
        const data = document.documentElement.dataset;
        data[key] = String(Number(data[key] ?? 0) + 1);
        data.viewLast = direction;
      };
      if (fallback) {
        Object.defineProperty(document, "startViewTransition", {
          value: undefined,
        });
        const directions: Record<string, string> = {
          "translateX(30%)": "forward",
          "translateX(-30%)": "back",
          "translateY(40px)": "up",
          "translateY(-16px)": "down",
        };
        const original = Element.prototype.animate;
        Element.prototype.animate = function (
          ...args: Parameters<Element["animate"]>
        ) {
          if (this.matches(".experience-main, .cart-pane")) {
            const frames = args[0] as Keyframe[];
            record(
              "viewEnter",
              directions[String(frames[0]?.transform)] ?? "continued",
            );
          }
          return original.apply(this, args);
        };
      } else {
        document.addEventListener("animationstart", (event) => {
          const match = /^view-(in|out)-(\w+)$/.exec(event.animationName);
          if (match)
            record(match[1] === "in" ? "viewEnter" : "viewExit", match[2]!);
        });
        // A shorthand without a name was once minified to `animation: none`,
        // so the snapshots never moved and lay on top of each other.
        document.addEventListener("animationend", (event) => {
          const data = document.documentElement.dataset;
          if (
            /^(view-(in|out)-\w+|header-(up|down))$/.test(event.animationName)
          ) {
            if (event.elapsedTime < 0.4)
              data.viewTooShort = event.animationName;
            if (event.animationName.startsWith("header-"))
              data.viewHeader =
                `${data.viewHeader ?? ""} ${event.animationName}`.trim();
          }
        });
      }
    }, mode === "fallback");
    let posts = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/chat") && request.method() === "POST")
        posts++;
    });
    await page.goto("/bestall");
    const wide = (page.viewportSize()?.width ?? 0) > 760;
    const input = page.getByRole("textbox", {
      name: "Meddelande till Gulo Gulo",
    });
    await input.fill("Vem gör korven?");
    await page
      .getByRole("button", { name: "Skicka meddelande", exact: true })
      .click();
    await expect(page.getByRole("log")).toContainText("Niklas på plats");
    await input.fill("Min påbörjade fråga");
    for (const [name, direction] of [
      ["Välj från menyn", "back"],
      ["Mina beställningar", "forward"],
      ["Chatta med oss", "back"],
      // The cart rises as its own view on phones; on wide screens it is the
      // side panel next to the menu, which lies before the chat.
      ["varukorg", wide ? "back" : "up"],
      ["Chatta med oss", wide ? "forward" : "down"],
    ] as const) {
      const before = await counts(page);
      if (name === "varukorg") {
        await page
          .getByRole("button", {
            name: "Visa beställning, 0 varor",
            exact: true,
          })
          .click();
      } else await navigate(page, name);
      if (mode === "native")
        await expect
          .poll(async () => (await counts(page)).exit)
          .toBeGreaterThan(before.exit);
      await expect
        .poll(async () => (await counts(page)).enter)
        .toBeGreaterThan(before.enter);
      expect((await counts(page)).direction).toBe(direction);
      await page.evaluate(() =>
        Promise.allSettled(
          document.getAnimations().map((animation) => animation.finished),
        ),
      );
    }
    if (mode === "native") {
      const data = await page.evaluate(() => ({
        ...document.documentElement.dataset,
      }));
      expect(data.viewTooShort).toBeUndefined();
      // The header folds down when leaving the chat and up when returning.
      expect(data.viewHeader).toMatch(/^header-down header-up/);
    }
    await expect(input).toHaveValue("Min påbörjade fråga");
    await expect(page.getByRole("log")).toContainText("Niklas på plats");
    expect(posts).toBe(1);
    // Real pointer clicks during a running transition reach the page.
    await navigate(page, "Välj från menyn");
    await navigate(page, "Chatta med oss");
    await navigate(page, "Mina beställningar");
    await expect(
      page.getByRole("heading", { name: "Mina beställningar", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Beställningssätt" })
        .getByRole("button", { name: "Mina beställningar", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
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

test("UX-013: each view keeps its own scroll position and new views start at the top", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/bestall");
  await navigate(page, "Välj från menyn");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
  // Dispatch the clicks so Playwright does not scroll the page to the button first.
  const nav = page.getByRole("navigation", { name: "Beställningssätt" });
  await nav
    .getByRole("button", { name: "Mina beställningar", exact: true })
    .dispatchEvent("click");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await nav
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .dispatchEvent("click");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
});

test("UX-011/012: button, Escape and backdrop close info with an inert exit and restored focus", async ({
  page,
}, testInfo) => {
  await page.goto("/bestall");
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

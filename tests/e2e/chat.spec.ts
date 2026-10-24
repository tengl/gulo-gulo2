import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function view(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function ask(page: Page, text: string) {
  await page
    .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
    .fill(text);
  await page
    .getByRole("button", { name: "Skicka meddelande", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Avbryt svar", exact: true }),
  ).not.toBeVisible();
}
async function addFromMenu(page: Page, product = "GHOSTDOG") {
  await view(page, "Välj från menyn");
  await page
    .getByRole("button", { name: `Välj ${product}`, exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /Enkel wrap/ }).check();
  await dialog
    .getByRole("button", { name: /Lägg till i beställningen/ })
    .click();
}
async function saveOrder(page: Page) {
  await page
    .getByRole("button", { name: /Visa beställning, \d+ varor/, exact: true })
    .click();
  await page
    .getByRole("complementary", { name: "Beställningsöversikt" })
    .getByRole("button", { name: "Granska beställningen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Spara demobeställning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mina beställningar", exact: true }),
  ).toBeVisible();
}

test("CHATT-001/002/005: graphical and chat choices share one remembered cart", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await addFromMenu(page);
  await view(page, "Chatta med oss");
  await ask(page, "en Loka");
  await page
    .getByRole("button", { name: "Lägg till dessa val", exact: true })
    .click();
  await ask(page, "Vad har jag i varukorgen?");
  const last = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(last).toContainText("1 × 7. GHOSTDOG · enkel wrap");
  await expect(last).toContainText("1 × Loka");
  await expect(last).toContainText(/160\s*kr/);
  await page.screenshot({
    path: testInfo.outputPath("chat-shared-cart.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 2 varor",
      exact: true,
    }),
  ).toBeVisible();
  await ask(page, "Vad har jag i varukorgen?");
  await expect(page.getByRole("log")).toContainText("GHOSTDOG");
  await expect(page.getByRole("log")).toContainText("Loka");
});

test("CHATT-003/008: product and manufacturing questions leave the cart intact", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Begränsad demo", { exact: true })).toBeVisible();
  await ask(page, "Vem gör korven?");
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  await ask(page, "Berätta om Ghostdog");
  await expect(page.getByRole("log")).toContainText(
    "Fermenterad och kallrökt korv på gris",
  );
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 0 varor",
      exact: true,
    }),
  ).toBeVisible();
});

test("CHATT-005/007 / ORD-016: save, reload and cancel a specific order through chat", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await addFromMenu(page);
  await saveOrder(page);
  const reference = (await page
    .locator(".saved-order .order-reference")
    .textContent())!;
  await expect(page.getByText("Sparad demo", { exact: true })).toBeVisible();
  await page.reload();
  await view(page, "Mina beställningar");
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
  await view(page, "Chatta med oss");
  await expect(
    page
      .getByRole("group", { name: "Snabbval i chatten", exact: true })
      .getByRole("button", { name: "Mina beställningar", exact: true }),
  ).toBeVisible();
  await ask(page, `Avboka ${reference}`);
  await page
    .getByRole("button", { name: "Granska avbokningen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Bekräfta avbokning",
    exact: true,
  });
  await expect(dialog).toContainText(reference);
  await expect(dialog).toContainText("efter betalning kontaktar du personalen");
  await dialog
    .getByRole("button", { name: "Ja, avboka demobeställningen", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText(
    "Demobeställningen är avbokad",
  );
  await expect(
    page
      .getByRole("group", { name: "Snabbval i chatten", exact: true })
      .getByRole("button", { name: "Mina beställningar", exact: true }),
  ).toHaveCount(0);
  await view(page, "Mina beställningar");
  await expect(page.getByText("Avbokad", { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("saved-orders.png"),
    fullPage: true,
  });
  await page.reload();
  await view(page, "Mina beställningar");
  await expect(page.getByText("Avbokad", { exact: true })).toBeVisible();
});

test("CHATT-006/007: GUI cancellation selects one order and clearing memory is explicit", async ({
  page,
}) => {
  await page.goto("/");
  await addFromMenu(page);
  await saveOrder(page);
  const first = (await page
    .locator(".saved-order .order-reference")
    .textContent())!;
  await addFromMenu(page, "BRÖL");
  await saveOrder(page);
  await page
    .getByRole("article", { name: `Demobeställning ${first}`, exact: true })
    .getByRole("button", { name: "Avboka demobeställning", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Behåll beställningen", exact: true })
    .click();
  await expect(page.getByText("Sparad demo", { exact: true })).toHaveCount(2);
  await page
    .getByRole("article", { name: `Demobeställning ${first}`, exact: true })
    .getByRole("button", { name: "Avboka demobeställning", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ja, avboka demobeställningen", exact: true })
    .click();
  await expect(page.getByText("Avbokad", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Sparad demo", { exact: true })).toHaveCount(1);
  await page
    .getByRole("button", { name: "Rensa lokalt minne", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "avbokar inga riktiga beställningar",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ja, rensa lokalt minne", exact: true })
    .click();
  await expect(page.locator(".saved-order")).toHaveCount(0);
  await page.reload();
  await view(page, "Mina beställningar");
  await expect(page.locator(".saved-order")).toHaveCount(0);
});

test("CHATT-004: Claude receives current menu choices and late proposals cannot replace newer choices", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let incoming: Record<string, unknown> | undefined;
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { mode: "claude" } });
    incoming = route.request().postDataJSON();
    await pending;
    await route.fulfill({
      json: {
        text: "Kontrollera förslaget.",
        mode: "claude",
        action: {
          kind: "add",
          items: [{ productId: "loka", quantity: 1, omissions: [] }],
        },
      },
    });
  });
  await page.goto("/");
  await addFromMenu(page);
  await view(page, "Chatta med oss");
  await page
    .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
    .fill("Jag vill ha något att dricka");
  await page
    .getByRole("button", { name: "Skicka meddelande", exact: true })
    .click();
  await expect.poll(() => incoming).toBeTruthy();
  expect(incoming!.cart).toMatchObject([
    { productId: "ghostdog", variant: "single", quantity: 1 },
  ]);
  await addFromMenu(page, "BRÖL");
  release();
  await view(page, "Chatta med oss");
  await expect(page.getByRole("log")).toContainText(
    "Varukorgen har ändrats sedan förslaget gjordes",
  );
  await expect(
    page.getByRole("button", { name: "Lägg till dessa val", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 2 varor",
      exact: true,
    }),
  ).toBeVisible();
});

test("CHATT-008: retry after service failure keeps choices and does not duplicate user messages", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { mode: "claude" } });
    calls += 1;
    return calls === 1
      ? route.fulfill({
          status: 502,
          json: { error: "Tjänsten svarade inte. Inget har ändrats." },
        })
      : route.fulfill({
          json: { text: "Niklas gör korven på plats.", mode: "claude" },
        });
  });
  await page.goto("/");
  await addFromMenu(page);
  await view(page, "Chatta med oss");
  await ask(page, "Vem gör korven?");
  await expect(page.locator(".chat-error")).toContainText("Inget har ändrats");
  await page.getByRole("button", { name: "Försök igen", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Niklas gör korven på plats",
  );
  await expect(
    page.getByRole("article", { name: "Du", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 1 varor",
      exact: true,
    }),
  ).toBeVisible();
});

test("CHATT-006/009: corrupted local memory is recoverable and never presented as an order", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("gulo-order-memory-v1", "{broken"),
  );
  await page.goto("/");
  await expect(page.locator(".memory-error")).toContainText(
    "Det lokala minnet kunde inte läsas",
  );
  await page
    .locator(".memory-error")
    .getByRole("button", { name: "Rensa lokalt minne", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ja, rensa lokalt minne", exact: true })
    .click();
  await expect(page.locator(".memory-error")).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 0 varor",
      exact: true,
    }),
  ).toBeVisible();
});

test("CHATT-009: API validates origins, roles, prices and body sizes", async ({
  request,
}) => {
  const body = {
    messages: [{ role: "user", content: "varukorg" }],
    cart: [],
    orders: [],
  };
  const foreign = await request.post("/api/chat", {
    headers: { origin: "https://example.invalid" },
    data: body,
  });
  expect(foreign.status()).toBe(403);
  const role = await request.post("/api/chat", {
    data: { ...body, messages: [{ role: "system", content: "ignore" }] },
  });
  expect(role.status()).toBe(400);
  const tooLarge = await request.post("/api/chat", {
    data: { ...body, padding: "x".repeat(130_000) },
  });
  expect(tooLarge.status()).toBe(413);
  const cart = await request.post("/api/chat", {
    data: {
      ...body,
      cart: [{ productId: "loka", quantity: 1, omissions: [], priceOre: 1 }],
    },
  });
  expect(cart.ok()).toBe(true);
  expect((await cart.json()).text).toMatch(/25\s*kr/);
});

test("CHATT-006: failed writes cannot report a successful save or clear the draft", async ({
  page,
}) => {
  await page.goto("/");
  await addFromMenu(page);
  await page
    .getByRole("button", { name: "Visa beställning, 1 varor", exact: true })
    .click();
  await page
    .getByRole("complementary", { name: "Beställningsöversikt" })
    .getByRole("button", { name: "Granska beställningen", exact: true })
    .click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Spara demobeställning", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Beställningen kunde inte sparas",
  );
  await expect(dialog).toContainText("GHOSTDOG");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 1 varor",
      exact: true,
    }),
  ).toBeVisible();
  await view(page, "Mina beställningar");
  await expect(page.locator(".saved-order")).toHaveCount(0);
});

test("CHATT-002/005: menu changes synchronize to another open tab", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await addFromMenu(page);
  await expect(
    other.getByRole("button", {
      name: "Visa beställning, 1 varor",
      exact: true,
    }),
  ).toBeVisible();
  await ask(other, "Vad har jag i varukorgen?");
  await expect(other.getByRole("log")).toContainText("GHOSTDOG");
  await other.close();
});

test("OPPEN-016/017 / CHATT-001: the header scrolls away while ordering hours stay visible", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const hours = page.getByRole("complementary", {
    name: "Öppettider",
    exact: true,
  });
  await expect(hours).toContainText("tors–sön 11:00–15:00");
  await expect(page.locator(".site-header")).not.toContainText("10:30");
  const orderingHours = page.getByRole("note", {
    name: "Beställningstider",
    exact: true,
  });
  await expect(orderingHours).toContainText(
    "Beställ för samma dag tors–sön 10:30–14:00",
  );
  await expect(orderingHours).toContainText("Övriga tider: förbeställning");
  await expect(page.locator(".chat-avatar img").first()).toBeVisible();
  await expect(page.locator(".chat-avatar").first()).not.toContainText("G");
  const initialChat = (await page.locator(".chat-panel").boundingBox())!;
  if (testInfo.project.name === "mobile")
    expect(initialChat.y).toBeLessThan(80);
  await expect(page.locator(".chat-log .site-header")).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("scrolling-chat-header.png"),
    fullPage: true,
  });
  await ask(page, "Vem gör korven?");
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  await expect(page.locator(".chat-log .site-header")).not.toBeInViewport();
  await expect(page.locator("#chat-title")).not.toBeInViewport();
  await expect(orderingHours).toBeInViewport();
  const activeChat = (await page.locator(".chat-panel").boundingBox())!;
  expect(activeChat.y).toBe(initialChat.y);
  if (testInfo.project.name === "mobile") {
    const sendBox = (await page
      .getByRole("button", { name: "Skicka meddelande", exact: true })
      .boundingBox())!;
    expect(sendBox.y + sendBox.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  }
  await page.screenshot({
    path: testInfo.outputPath("active-chat-header.png"),
    fullPage: true,
  });
  await expect
    .poll(() =>
      page
        .locator(".chat-log")
        .evaluate(
          (element) =>
            element.scrollHeight - element.clientHeight - element.scrollTop,
        ),
    )
    .toBeLessThan(2);
  await page.locator(".chat-log").dispatchEvent("wheel", { deltaY: -600 });
  await page.locator(".chat-log").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(page.locator(".chat-log .site-header")).toBeInViewport();
  await expect(orderingHours).toBeInViewport();
  await view(page, "Välj från menyn");
  await expect(hours).toBeVisible();
  await expect(orderingHours).toContainText("10:30–14:00");
  await expect(
    page.getByRole("heading", { level: 1, name: /Bra korv/ }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(orderingHours).toBeInViewport();
  await expect
    .poll(async () => (await orderingHours.boundingBox())!.y)
    .toBeLessThan(2);
  await page.screenshot({
    path: testInfo.outputPath("menu-ordering-hours.png"),
    fullPage: true,
  });
  await view(page, "Chatta med oss");
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  await expect(orderingHours).toBeInViewport();
  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
    await ask(page, "Vad har jag i varukorgen?");
    await expect(orderingHours).toBeInViewport();
    await expect(page.locator(".chat-log .site-header")).not.toBeInViewport();
    await expect(page.locator("#chat-title")).not.toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Skicka meddelande", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", {
        name: "Visa beställning, 0 varor",
        exact: true,
      }),
    ).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    await page.screenshot({
      path: testInfo.outputPath("small-active-chat.png"),
      fullPage: true,
    });
  }
});

test("CHATT-016: returning from every customer view shows the latest message without resending", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/chat") && request.method() === "POST")
      posts++;
  });
  await page.goto("/");
  await ask(page, "meny");
  const latest = page.getByRole("log").getByRole("article").last();
  await expect(latest).toContainText("Våra wraps och drycker");
  await expect(
    page.getByRole("button", {
      name: "Välj SPÄCK SABBATH i chatten",
      exact: true,
    }),
  ).toBeInViewport();
  const input = page.getByRole("textbox", {
    name: "Meddelande till Gulo Gulo",
  });
  await input.fill("Min nästa fråga");
  const before = posts;
  const scroller = page.locator(".chat-log");
  for (const destination of [
    "Välj från menyn",
    "varukorg",
    "Mina beställningar",
  ]) {
    // A user gesture takes over even while the longer menu scroll is running.
    await scroller.dispatchEvent("wheel", { deltaY: -600 });
    await scroller.evaluate((element) =>
      element.scrollTo({ top: 0, behavior: "instant" }),
    );
    await expect(page.locator(".chat-log .site-header")).toBeInViewport();
    if (destination === "varukorg") {
      await page
        .getByRole("button", { name: "Visa beställning, 0 varor", exact: true })
        .click();
    } else await view(page, destination);
    await view(page, "Chatta med oss");
    await expect
      .poll(() =>
        scroller.evaluate(
          (element) =>
            element.scrollHeight - element.clientHeight - element.scrollTop,
        ),
      )
      .toBeLessThan(2);
    await expect(
      latest.getByRole("button", {
        name: "Välj Björnåsen bärdryck i chatten",
        exact: true,
      }),
    ).toBeInViewport();
    await expect(input).toHaveValue("Min nästa fråga");
    expect(posts).toBe(before);
  }
});

test("CHATT-016: disappearing shortcuts animate and the scroll header respects reduced motion", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByText("Begränsad demo", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.shortcutMotion = "0";
    document.addEventListener("transitionstart", (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches(".chat-shortcut[inert]")
      )
        document.documentElement.dataset.shortcutMotion = "1";
    });
  });
  await page
    .getByRole("button", { name: "Vem gör korven?", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  await expect(
    page.getByRole("button", { name: "Vem gör korven?", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.shortcutMotion),
    )
    .toBe("1");
  const intro = page.locator(".chat-intro");
  await expect
    .poll(() =>
      page
        .locator(".chat-log")
        .evaluate(
          (element) =>
            element.scrollHeight - element.clientHeight - element.scrollTop,
        ),
    )
    .toBeLessThan(2);
  await page.locator(".chat-log").dispatchEvent("wheel", { deltaY: -600 });
  await page.locator(".chat-log").evaluate((element) => {
    const intro = element.querySelector<HTMLElement>(".chat-intro")!;
    element.scrollTo({ top: intro.offsetHeight / 3, behavior: "instant" });
  });
  await expect
    .poll(() =>
      intro.evaluate((element) => Number(getComputedStyle(element).opacity)),
    )
    .toBeLessThan(0.9);
  expect(
    await intro.evaluate((element) =>
      Number(getComputedStyle(element).opacity),
    ),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: testInfo.outputPath("fading-chat-header.png"),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(intro).toHaveCSS("opacity", "1");
  await expect(intro).toHaveCSS("transform", "none");
  await expect(page.locator(".chat-shortcut").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
});

test("CHATT-016: a customer's scroll gesture interrupts the slower automatic movement", async ({
  page,
}) => {
  let release!: () => void;
  const reply = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await reply;
    await route.fulfill({ json: { mode: "limited", text: "Ditt testsvar." } });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Vem gör korven?", exact: true })
    .click();
  const scroller = page.locator(".chat-log");
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(5);
  await scroller.hover();
  await scroller.evaluate((element) => {
    element.addEventListener(
      "wheel",
      () => {
        element.dataset.wheelReceived = "yes";
      },
      { once: true },
    );
  });
  await page.mouse.wheel(0, -600);
  await expect(scroller).toHaveAttribute("data-wheel-received", "yes");
  // Mobile emulation does not perform the wheel's default scrolling.
  await scroller.evaluate((element) =>
    element.scrollTo({ top: 0, behavior: "instant" }),
  );
  const furthest = await scroller.evaluate(async (element) => {
    const until = performance.now() + 650;
    let furthest = element.scrollTop;
    while (performance.now() < until) {
      await new Promise(requestAnimationFrame);
      furthest = Math.max(furthest, element.scrollTop);
    }
    return furthest;
  });
  expect(furthest).toBeLessThan(2);
  release();
  await expect(page.getByRole("log")).toContainText("Ditt testsvar.");
});

test("CHATT-010: ready-made messages send immediately and preserve the written draft", async ({
  page,
}) => {
  const cases = [
    {
      button: "Vem gör korven?",
      sent: "Vem gör korven?",
      reply: "Niklas på plats",
    },
    {
      button: "Berätta om Ghostdog",
      sent: "Berätta om Ghostdog",
      reply: "Fermenterad och kallrökt korv på gris",
    },
    {
      button: "Meny",
      sent: "meny",
      reply: "Våra wraps och drycker",
    },
  ];
  for (const choice of cases) {
    await page.goto("/");
    const input = page.getByRole("textbox", {
      name: "Meddelande till Gulo Gulo",
    });
    await input.fill("Min påbörjade fråga");
    const request = page.waitForRequest(
      (value) => value.url().endsWith("/api/chat") && value.method() === "POST",
    );
    await page
      .getByRole("button", { name: choice.button, exact: true })
      .click();
    expect((await request).postDataJSON().messages.at(-1).content).toBe(
      choice.sent,
    );
    await expect(
      page.getByRole("article", { name: "Du", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("article", { name: "Du", exact: true }),
    ).toContainText(choice.sent);
    await expect(page.getByRole("log")).toContainText(choice.reply);
    await expect(input).toHaveValue("Min påbörjade fråga");
  }
});

test("CHATT-011/012: persistent shortcuts and clickable menus share the graphical cart", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const shortcuts = page.getByRole("group", {
    name: "Snabbval i chatten",
    exact: true,
  });
  const menuButton = shortcuts.getByRole("button", {
    name: "Meny",
    exact: true,
  });
  await expect(menuButton).toBeVisible();
  await expect(
    shortcuts.getByRole("button", { name: "Visa varukorg", exact: true }),
  ).toHaveCount(0);
  await menuButton.click();
  const menu = page
    .getByRole("group", { name: "Meny i chatten", exact: true })
    .last();
  await expect(
    menu.getByRole("button", { name: /^Välj .+ i chatten$/ }),
  ).toHaveCount(17);
  await expect(menu.getByRole("button", { name: /^Mer om / })).toHaveCount(17);
  await expect(
    menu.getByRole("button", {
      name: "Välj SPÄCK SABBATH i chatten",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("clickable-chat-menu.png"),
    fullPage: true,
  });
  await menu
    .getByRole("button", { name: "Välj GHOSTDOG i chatten", exact: true })
    .click();
  const add = page.getByRole("button", {
    name: "Lägg till dessa val",
    exact: true,
  });
  const variants = page.getByRole("group", {
    name: "Variant för GHOSTDOG",
    exact: true,
  });
  await expect(variants.getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: /^Lägg till enkel wrap/ }).click();
  await expect(
    shortcuts.getByRole("button", { name: "Visa varukorg", exact: true }),
  ).toBeVisible();
  await expect(
    shortcuts.getByRole("button", { name: "Granska", exact: true }),
  ).toHaveCount(0);
  await menuButton.click();
  await expect(
    page.getByRole("group", { name: "Meny i chatten", exact: true }),
  ).toHaveCount(2);
  await menu
    .getByRole("button", { name: "Välj Loka i chatten", exact: true })
    .click();
  await add.click();
  await addFromMenu(page, "BRÖL");
  await view(page, "Chatta med oss");
  await shortcuts
    .getByRole("button", { name: "Visa varukorg", exact: true })
    .click();
  const answer = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(answer).toContainText("GHOSTDOG");
  await expect(answer).toContainText("Loka");
  await expect(answer).toContainText("BRÖL");
  await expect(answer).toContainText(/305\s*kr/);
  await expect(menuButton).toBeVisible();
  await page
    .getByRole("button", { name: "Visa beställning, 3 varor", exact: true })
    .click();
  const cart = page.getByRole("complementary", {
    name: "Beställningsöversikt",
  });
  for (const product of ["GHOSTDOG", "Loka", "BRÖL"])
    await cart
      .getByRole("button", { name: `Ta bort ${product}`, exact: true })
      .click();
  await view(page, "Chatta med oss");
  await expect(
    shortcuts.getByRole("button", { name: "Visa varukorg", exact: true }),
  ).toHaveCount(0);
  await expect(menuButton).toBeVisible();
});

test("CHATT-011/015: cart replies open editing and review in one click without another message", async ({
  page,
}, testInfo) => {
  let posts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/chat") && request.method() === "POST")
      posts++;
  });
  await page.goto("/");
  await addFromMenu(page);
  await view(page, "Chatta med oss");
  const shortcuts = page.getByRole("group", {
    name: "Snabbval i chatten",
    exact: true,
  });
  await expect(
    shortcuts.getByRole("button", { name: "Granska", exact: true }),
  ).toHaveCount(0);
  await expect(
    shortcuts.getByRole("button", { name: "Mina beställningar", exact: true }),
  ).toHaveCount(0);
  await shortcuts
    .getByRole("button", { name: "Visa varukorg", exact: true })
    .click();
  const answer = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(answer).toContainText("GHOSTDOG");
  await expect(
    answer.getByRole("button", { name: "Ändra", exact: true }),
  ).toBeVisible();
  await expect(
    answer.getByRole("button", { name: "Granska beställningen", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("flat-cart-actions.png"),
    fullPage: true,
  });
  const input = page.getByRole("textbox", {
    name: "Meddelande till Gulo Gulo",
  });
  await input.fill("Min nästa fråga");
  const before = posts;
  await answer.getByRole("button", { name: "Ändra", exact: true }).click();
  const cart = page.getByRole("complementary", {
    name: "Beställningsöversikt",
    exact: true,
  });
  await expect(cart).toBeVisible();
  await cart
    .getByRole("button", { name: "Öka antal GHOSTDOG", exact: true })
    .click();
  await view(page, "Chatta med oss");
  await expect(input).toHaveValue("Min nästa fråga");
  await answer
    .getByRole("button", { name: "Granska beställningen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Granska din demobeställning",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/270\s*kr/);
  expect(posts).toBe(before);
  await dialog
    .getByRole("button", { name: "Fortsätt prova", exact: true })
    .click();
  await expect(input).toHaveValue("Min nästa fråga");
});

test("UX-011/012: names and info icons open animated facts without changing the order", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 568 });
  let posts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/chat") && request.method() === "POST")
      posts++;
  });
  await page.goto("/");
  const input = page.getByRole("textbox", {
    name: "Meddelande till Gulo Gulo",
  });
  await input.fill("Min påbörjade fråga");
  await addFromMenu(page);
  const menuInfo = page.getByRole("button", {
    name: "Mer om GHOSTDOG",
    exact: true,
  });
  await page.evaluate(() => {
    document.documentElement.dataset.dialogMotion = "0";
    document.documentElement.dataset.cartMotion = "0";
    document.addEventListener("animationstart", (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      const key = event.target.matches("dialog.sheet")
        ? "dialogMotion"
        : event.animationName.startsWith("view-in-")
          ? "cartMotion"
          : null;
      if (key)
        document.documentElement.dataset[key] = String(
          Number(document.documentElement.dataset[key]) + 1,
        );
    });
  });
  await menuInfo.getByText("GHOSTDOG", { exact: true }).click();
  const info = page.getByRole("dialog", { name: "Om GHOSTDOG", exact: true });
  await expect(info).toContainText("Fermenterad och kallrökt korv på gris");
  await expect(info).toContainText("ghost chili-pepparsås och rött vin");
  await expect(info).toContainText("lokalbakat mjukt tunnbröd");
  await expect(info).toContainText(/135\s*kr/);
  await expect(info).toContainText(/180\s*kr/);
  await expect(info.getByRole("radio")).toHaveCount(0);
  await expect(info.getByRole("button", { name: /Lägg till/ })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(document.documentElement.dataset.dialogMotion),
      ),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: testInfo.outputPath("product-info.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(info).not.toBeVisible();
  await expect(menuInfo).toBeFocused();
  await menuInfo.locator("svg").click();
  await expect(info).toBeVisible();
  await info.getByRole("button", { name: "Stäng", exact: true }).click();
  await expect(menuInfo).toBeFocused();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 1 varor",
      exact: true,
    }),
  ).toBeVisible();
  expect(posts).toBe(0);

  await view(page, "Chatta med oss");
  await expect(input).toHaveValue("Min påbörjade fråga");
  await page
    .getByRole("group", { name: "Snabbval i chatten", exact: true })
    .getByRole("button", { name: "Meny", exact: true })
    .click();
  const menu = page
    .getByRole("group", { name: "Meny i chatten", exact: true })
    .last();
  await expect(menu.getByRole("button", { name: /^Mer om / })).toHaveCount(17);
  const before = posts;
  const messages = await page.getByRole("log").getByRole("article").count();
  const chatInfo = menu.getByRole("button", {
    name: "Mer om GHOSTDOG",
    exact: true,
  });
  await chatInfo.getByText("GHOSTDOG", { exact: true }).click();
  await expect(info).toBeVisible();
  await info
    .getByRole("button", { name: "Tillbaka till menyn", exact: true })
    .click();
  await expect(chatInfo).toBeFocused();

  const drinkInfo = menu.getByRole("button", {
    name: "Mer om Loka",
    exact: true,
  });
  await drinkInfo.locator("svg").click();
  const drink = page.getByRole("dialog", { name: "Om Loka", exact: true });
  await expect(drink).toContainText(
    "Loka innehåller enligt underlaget inte socker",
  );
  await expect(drink).toContainText(/25\s*kr/);
  await expect(drink).not.toContainText("Bröd och tillbehör");
  await drink.getByRole("button", { name: "Stäng", exact: true }).click();
  await expect(drinkInfo).toBeFocused();
  expect(posts).toBe(before);
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(
    messages,
  );
  await expect(input).toHaveValue("Min påbörjade fråga");
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 1 varor",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visa beställning, 1 varor", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => Number(document.documentElement.dataset.cartMotion)),
    )
    .toBeGreaterThan(0);
  await view(page, "Chatta med oss");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motionBefore = await page.evaluate(
    () => document.documentElement.dataset.dialogMotion,
  );
  await chatInfo.getByText("GHOSTDOG", { exact: true }).click();
  await expect(info).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await page.evaluate(() => document.documentElement.dataset.dialogMotion),
  ).toBe(motionBefore);
  await page.keyboard.press("Escape");
  await expect(chatInfo).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("CHATT-014/017: either direct variant confirms the selected choices exactly once and preserves them", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 568 });
  let posts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/chat") && request.method() === "POST")
      posts++;
  });
  for (const choice of [
    { label: "enkel", price: 270 },
    { label: "dubbel", price: 360 },
  ]) {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await ask(page, "två Ghostdog utan senap");
    const variants = page.getByRole("group", {
      name: "Variant för GHOSTDOG",
      exact: true,
    });
    await expect(variants.getByRole("button")).toHaveCount(2);
    await expect(
      page.getByRole("button", {
        name: "Visa beställning, 0 varor",
        exact: true,
      }),
    ).toBeVisible();
    const button = variants.getByRole("button", {
      name: new RegExp(`^Lägg till ${choice.label} wrap`),
    });
    await expect(button).toContainText(new RegExp(`${choice.price}\\s*kr`));
    const input = page.getByRole("textbox", {
      name: "Meddelande till Gulo Gulo",
    });
    await input.fill("Min nästa fråga");
    await variants.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(`direct-${choice.label}-buttons.png`),
      fullPage: true,
    });
    const before = posts;
    await button.evaluate((element) => {
      // Two queued clicks on the same rendered button still approve only once.
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
    await expect(
      page.getByRole("button", {
        name: "Visa beställning, 2 varor",
        exact: true,
      }),
    ).toBeVisible();
    await expect(input).toHaveValue("Min nästa fråga");
    expect(posts).toBe(before);
    const receipt = page.locator(".proposal-done").first();
    const confirmed = page
      .getByRole("log")
      .getByRole("article", { name: "Gulo Gulo", exact: true })
      .last();
    for (const message of [receipt, confirmed]) {
      await expect(message).toContainText("Lagt till i varukorgen:");
      await expect(message).toContainText(
        `2 × GHOSTDOG · ${choice.label} wrap · utan senap`,
      );
      await expect(message).not.toContainText(
        `${choice.label === "enkel" ? "dubbel" : "enkel"} wrap`,
      );
    }
    await page
      .getByRole("group", { name: "Snabbval i chatten", exact: true })
      .getByRole("button", { name: "Visa varukorg", exact: true })
      .click();
    const answer = page
      .getByRole("log")
      .getByRole("article", { name: "Gulo Gulo", exact: true })
      .last();
    await expect(answer).toContainText(
      `2 × 7. GHOSTDOG · ${choice.label} wrap`,
    );
    await expect(answer).toContainText("utan senap");
    await expect(answer).toContainText(new RegExp(`${choice.price}\\s*kr`));
    await expect(input).toHaveValue("Min nästa fråga");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
    await addFromMenu(page, "BRÖL");
    await view(page, "Chatta med oss");
    await expect(receipt).toContainText(
      `2 × GHOSTDOG · ${choice.label} wrap · utan senap`,
    );
    await expect(receipt).not.toContainText("BRÖL");
    await expect(input).toHaveValue("Min nästa fråga");
  }
});

test("CHATT-004/014: multiple variants prepare one shared change and stale direct buttons disappear", async ({
  page,
}) => {
  await page.goto("/");
  await ask(page, "en Ghostdog och en Bröl");
  const add = page.getByRole("button", {
    name: "Lägg till dessa val",
    exact: true,
  });
  const ghostdog = page.getByRole("group", {
    name: "Variant för GHOSTDOG",
    exact: true,
  });
  const brol = page.getByRole("group", {
    name: "Variant för BRÖL",
    exact: true,
  });
  await expect(add).toBeDisabled();
  await ghostdog.getByRole("button", { name: /^Dubbel/ }).click();
  await ghostdog.getByRole("button", { name: /^Enkel/ }).click();
  await expect(
    ghostdog.getByRole("button", { name: /^Enkel/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(add).toBeDisabled();
  await brol.getByRole("button", { name: /^Dubbel/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 0 varor",
      exact: true,
    }),
  ).toBeVisible();
  await add.click();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 2 varor",
      exact: true,
    }),
  ).toBeVisible();
  const confirmation = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(confirmation).toContainText("1 × GHOSTDOG · enkel wrap");
  await expect(confirmation).toContainText("1 × BRÖL · dubbel wrap");
  await ask(page, "Vad har jag i varukorgen?");
  const answer = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(answer).toContainText("GHOSTDOG · enkel wrap");
  await expect(answer).toContainText("BRÖL · dubbel wrap");
  await expect(answer).toContainText(/325\s*kr/);

  await ask(page, "en Ghostdog");
  await expect(
    page.getByRole("button", { name: /^Lägg till enkel wrap/ }),
  ).toBeVisible();
  await addFromMenu(page, "BRÖL");
  await view(page, "Chatta med oss");
  await expect(
    page.getByRole("button", { name: /^Lägg till enkel wrap/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("log")).toContainText(
    "Varukorgen har ändrats sedan förslaget gjordes",
  );
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 3 varor",
      exact: true,
    }),
  ).toBeVisible();
});

test("CHATT-013: composer grows beyond two lines while focused and preserves text on collapse", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const input = page.getByRole("textbox", {
    name: "Meddelande till Gulo Gulo",
  });
  await expect(input).toHaveAttribute("rows", "1");
  const single = (await input.boundingBox())!.height;
  await input.focus();
  await expect(input).toHaveAttribute("rows", "2");
  const double = (await input.boundingBox())!.height;
  expect(double).toBeGreaterThan(single);
  const text = Array(20).fill("En lång fråga om våra wraps.").join("\n");
  await input.fill(text);
  await expect
    .poll(async () => (await input.boundingBox())!.height)
    .toBeGreaterThan(double + 20);
  const expanded = (await input.boundingBox())!.height;
  expect(expanded).toBeLessThanOrEqual(page.viewportSize()!.height * 0.35 + 2);
  expect(
    await input.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("expanded-composer.png"),
    fullPage: true,
  });
  await page
    .getByRole("group", { name: "Snabbval i chatten", exact: true })
    .getByRole("button", { name: "Meny", exact: true })
    .focus();
  await expect(input).toHaveAttribute("rows", "1");
  await expect(input).toHaveValue(text);
  await expect
    .poll(async () => (await input.boundingBox())!.height)
    .toBeLessThan(double);
  await input.focus();
  await expect
    .poll(async () => (await input.boundingBox())!.height)
    .toBeGreaterThan(double + 20);
  await expect(input).toHaveValue(text);
});

test("CHATT-008: a double click on send sends once and is not cancelled by the stop button", async ({
  page,
}) => {
  let posts = 0;
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
    .fill("Vem gör korven?");
  await page
    .getByRole("button", { name: "Skicka meddelande", exact: true })
    .dblclick();
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  await expect(page.getByText("Svaret avbröts")).toHaveCount(0);
  expect(posts).toBe(1);
});

test("CHATT-008: an HTML error page from the host gives a Swedish retry message", async ({
  page,
}) => {
  await page.route("**/api/chat", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 502,
          contentType: "text/html",
          body: "<!DOCTYPE html><title>Bad gateway</title>",
        })
      : route.continue(),
  );
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
    .fill("Vem gör korven?");
  await page
    .getByRole("button", { name: "Skicka meddelande", exact: true })
    .click();
  await expect(
    page.getByText("Chatten svarar inte just nu. Dina val är kvar, försök igen."),
  ).toBeVisible();
  await expect(page.getByText(/not valid JSON|Unexpected token/)).toHaveCount(0);
});

test("CHATT-006: choices kept after a failed local write are not replaced by the older stored cart", async ({
  page,
}) => {
  await page.goto("/");
  await addFromMenu(page);
  await expect(
    page.getByRole("button", { name: "Visa beställning, 1 varor", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await addFromMenu(page);
  const warning = page.getByRole("alert").filter({
    hasText: "Dina val finns bara kvar i den här vyn",
  });
  await expect(warning).toBeVisible();
  await view(page, "Chatta med oss");
  await view(page, "Välj från menyn");
  await expect(
    page.getByRole("button", { name: "Visa beställning, 2 varor", exact: true }),
  ).toBeVisible();
  await expect(warning).toBeVisible();
});

test("CHATT-013: a growing composer keeps the latest message in view", async ({
  page,
}) => {
  await page.goto("/");
  for (const text of [
    "Vem gör korven?",
    "Berätta om Ghostdog",
    "Vem gör korven?",
  ]) {
    await page
      .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
      .fill(text);
    await page
      .getByRole("button", { name: "Skicka meddelande", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Skicka meddelande", exact: true }),
    ).toBeVisible();
  }
  const log = page.locator(".chat-log");
  const gap = () =>
    log.evaluate(
      (element) => element.scrollHeight - element.scrollTop - element.clientHeight,
    );
  // Let the automatic scroll to the latest reply finish first.
  await expect.poll(gap).toBeLessThanOrEqual(2);
  const input = page.getByRole("textbox", { name: "Meddelande till Gulo Gulo" });
  await input.focus();
  await input.fill("rad 1\nrad 2\nrad 3\nrad 4\nrad 5\nrad 6");
  await expect
    .poll(() => input.evaluate((element) => element.clientHeight))
    .toBeGreaterThan(60);
  await expect.poll(gap).toBeLessThanOrEqual(2);
});

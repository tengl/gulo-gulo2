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

test("OPPEN-016/017 / CHATT-001: compact header and ordering hours stay with their ordering surface", async ({
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
    expect(initialChat.y).toBeLessThan(190);
  await page.screenshot({
    path: testInfo.outputPath("compact-chat-header.png"),
    fullPage: true,
  });
  await ask(page, "Vem gör korven?");
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  if (testInfo.project.name === "mobile") {
    const activeChat = (await page.locator(".chat-panel").boundingBox())!;
    expect(activeChat.y).toBeLessThan(initialChat.y - 30);
    expect(activeChat.y).toBeLessThan(120);
    await expect(page.locator(".chat-header")).not.toBeVisible();
    await expect(page.locator(".chat-panel .ordering-hours")).not.toBeVisible();
    const sendBox = (await page
      .getByRole("button", { name: "Skicka meddelande", exact: true })
      .boundingBox())!;
    expect(sendBox.y + sendBox.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  } else {
    await expect(orderingHours).toBeVisible();
  }
  await page.screenshot({
    path: testInfo.outputPath("active-chat-header.png"),
    fullPage: true,
  });
  await view(page, "Välj från menyn");
  await expect(hours).toBeVisible();
  await expect(orderingHours).toContainText("10:30–14:00");
  await expect(
    page.getByRole("heading", { level: 1, name: /Bra korv/ }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("menu-ordering-hours.png"),
    fullPage: true,
  });
  await view(page, "Chatta med oss");
  await expect(page.getByRole("log")).toContainText("Niklas på plats");
  if (testInfo.project.name === "mobile")
    await expect(page.locator(".chat-header")).not.toBeVisible();
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
  await expect(menu.getByRole("button")).toHaveCount(17);
  await expect(
    menu.getByRole("button", { name: "Beställ SPÄCK SABBATH", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("clickable-chat-menu.png"),
    fullPage: true,
  });
  await menu
    .getByRole("button", { name: "Beställ GHOSTDOG", exact: true })
    .click();
  const add = page.getByRole("button", {
    name: "Lägg till dessa val",
    exact: true,
  });
  await expect(add).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Variant för GHOSTDOG", exact: true })
    .selectOption("single");
  await add.click();
  await expect(
    shortcuts.getByRole("button", { name: "Visa varukorg", exact: true }),
  ).toBeVisible();
  await expect(
    shortcuts.getByRole("button", { name: "Granska", exact: true }),
  ).toBeVisible();
  await menuButton.click();
  await expect(
    page.getByRole("group", { name: "Meny i chatten", exact: true }),
  ).toHaveCount(2);
  await menu.getByRole("button", { name: "Beställ Loka", exact: true }).click();
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

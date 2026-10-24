import { test, expect } from "@playwright/test";

test("UX-003/006/007/009: build, edit and review an order through the menu", async ({
  page,
}, testInfo) => {
  await page.goto("/bestall");
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Bra korv.",
  );
  await page.screenshot({
    path: testInfo.outputPath("menu.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Välj GHOSTDOG", exact: true })
    .click();
  const product = page.getByRole("dialog", {
    name: "Välj GHOSTDOG",
    exact: true,
  });
  await expect(
    product.getByRole("button", { name: "Välj enkel eller dubbel" }),
  ).toBeDisabled();
  await product.getByRole("radio", { name: /Dubbel wrap/ }).check();
  await page.screenshot({ path: testInfo.outputPath("product.png") });
  await product.getByRole("button", { name: "Öka antal", exact: true }).click();
  await product.getByText("Välj bort tillbehör").click();
  await product
    .getByRole("checkbox", { name: "Utan senap", exact: true })
    .check();
  await product
    .getByRole("button", { name: /Lägg till i beställningen/ })
    .click();
  await expect(product).not.toBeVisible();
  await page
    .getByRole("button", { name: "Visa beställning, 2 varor", exact: true })
    .click();
  const cart = page.getByRole("complementary", {
    name: "Beställningsöversikt",
  });
  await expect(cart).toContainText("Dubbel wrap");
  await expect(cart).toContainText("Utan senap");
  await expect(cart).toContainText(/360\s*kr/);
  await page
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await page.getByRole("button", { name: /^Dryck/ }).click();
  await page.getByRole("button", { name: "Välj Loka", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Lägg till i beställningen/ })
    .click();
  await page
    .getByRole("button", { name: "Visa beställning, 3 varor", exact: true })
    .click();
  await expect(cart).toContainText(/385\s*kr/);
  await cart
    .getByRole("button", { name: "Minska antal GHOSTDOG", exact: true })
    .click();
  await expect(cart).toContainText(/205\s*kr/);
  await cart.getByRole("button", { name: "Ta bort Loka", exact: true }).click();
  await expect(cart).toContainText(/180\s*kr/);
  await cart
    .getByRole("button", { name: "Granska beställningen", exact: true })
    .click();
  const review = page.getByRole("dialog", {
    name: "Granska din demobeställning",
    exact: true,
  });
  await expect(review).toContainText(
    "ingen beställning skickas och ingen betalning görs",
  );
  await expect(review).toContainText(/180\s*kr/);
  await review
    .getByRole("button", { name: "Fortsätt prova", exact: true })
    .click();
  await expect(review).not.toBeVisible();
});

test("UX-008 / CHATT-001: safe text proposals and conversation survive view switches", async ({
  page,
}) => {
  await page.goto("/bestall");
  const input = page.getByRole("textbox", {
    name: "Meddelande till Gulo Gulo",
  });
  const send = page.getByRole("button", {
    name: "Skicka meddelande",
    exact: true,
  });
  await input.fill("två ghostdog och en pizza");
  await send.click();
  await expect(page.getByRole("log")).toContainText("Inget har ändrats");
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 0 varor",
      exact: true,
    }),
  ).toBeVisible();
  await input.fill("två Ghostdog utan senap och en Loka");
  await send.click();
  const add = page.getByRole("button", {
    name: "Lägg till dessa val",
    exact: true,
  });
  await expect(add).toBeDisabled();
  await input.fill("Min nästa fråga");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Chatta med oss", exact: true })
    .click();
  await expect(input).toHaveValue("Min nästa fråga");
  await expect(add).toBeDisabled();
  await page
    .getByRole("group", { name: "Variant för GHOSTDOG", exact: true })
    .getByRole("button", { name: /^Dubbel/ })
    .click();
  await add.click();
  const confirmed = page
    .getByRole("log")
    .getByRole("article", { name: "Gulo Gulo", exact: true })
    .last();
  await expect(confirmed).toContainText("Lagt till i varukorgen:");
  await expect(confirmed).toContainText("2 × GHOSTDOG · dubbel wrap · utan senap");
  await page
    .getByRole("button", { name: "Visa beställning, 3 varor", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Beställningsöversikt" }),
  ).toContainText(/385\s*kr/);
});

test("UX-010: narrow viewports and keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/bestall");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  const choose = page.getByRole("button", {
    name: "Välj GRILLOST",
    exact: true,
  });
  await choose.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(choose).toBeFocused();
});

async function addGhostdog(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: "Välj GHOSTDOG", exact: true })
    .click();
  const product = page.getByRole("dialog", {
    name: "Välj GHOSTDOG",
    exact: true,
  });
  await product.getByRole("radio", { name: /Enkel wrap/ }).check();
  await product
    .getByRole("button", { name: /Lägg till i beställningen/ })
    .click();
  return product;
}

test("UX-010: repeated statuses are announced again and the category switch is a labelled group", async ({
  page,
}) => {
  await page.goto("/bestall");
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Produktkategori", exact: true }),
  ).toBeVisible();
  const status = page.locator(".status-announcement");
  await expect(await addGhostdog(page)).not.toBeVisible();
  const first = await status.textContent();
  await expect(await addGhostdog(page)).not.toBeVisible();
  await expect(status).toContainText("Dina val har lagts till");
  expect(await status.textContent()).not.toBe(first);
});

test("UX-008: the product dialog reports the real limit once, without a toast behind it", async ({
  page,
}) => {
  await page.goto("/bestall");
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await expect(await addGhostdog(page)).not.toBeVisible();
  await page.evaluate(() => {
    const key = "gulo-order-memory-v1";
    const memory = JSON.parse(localStorage.getItem(key)!);
    memory.cart[0].quantity = 99;
    localStorage.setItem(key, JSON.stringify(memory));
  });
  await page.reload();
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  const product = await addGhostdog(page);
  await expect(product.getByRole("alert")).toHaveText(
    "Inget har lagts till. Demon stöder högst 99 av samma val. Du kan ändra antalet i beställningen.",
  );
  await expect(page.locator(".error-toast")).toHaveCount(0);
});

test("UX-010: focus lands in the new view after saving from a panel that becomes hidden", async ({
  page,
}) => {
  await page.goto("/bestall");
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await expect(await addGhostdog(page)).not.toBeVisible();
  await page
    .getByRole("button", { name: "Visa beställning, 1 varor", exact: true })
    .first()
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
  await expect(page.locator("#main-content")).toBeFocused();
});

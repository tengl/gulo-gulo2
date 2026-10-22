import { test, expect } from "@playwright/test";

test("UX-003/006/007/009: build, edit and review an order through the menu", async ({
  page,
}, testInfo) => {
  await page.goto("/");
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

test("UX-008: reject partially understood text and require review of missing variant", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Skriv din beställning", exact: true })
    .click();
  const input = page.getByRole("textbox", { name: "Din beställning i text" });
  await input.fill("två ghostdog och en pizza");
  await page
    .getByRole("button", { name: "Visa mitt förslag", exact: true })
    .click();
  await expect(
    page.getByText(/Jag kunde inte tolka hela texten/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Visa beställning, 0 varor",
      exact: true,
    }),
  ).toBeVisible();
  await input.fill("två Ghostdog utan senap och en Loka");
  await page
    .getByRole("button", { name: "Visa mitt förslag", exact: true })
    .click();
  const add = page.getByRole("button", {
    name: "Lägg till dessa val",
    exact: true,
  });
  await expect(add).toBeDisabled();
  await page
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Beställningssätt" })
    .getByRole("button", { name: "Skriv din beställning", exact: true })
    .click();
  await expect(input).toHaveValue("två Ghostdog utan senap och en Loka");
  await expect(add).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Variant för GHOSTDOG", exact: true })
    .selectOption("double");
  await add.click();
  await expect(
    page.getByText("Dina val är tillagda.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visa beställning, 3 varor", exact: true })
    .click();
  await expect(page.getByRole("complementary")).toContainText(/385\s*kr/);
});

test("UX-010: narrow viewports and keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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

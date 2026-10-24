import { expect, test } from "@playwright/test";

test("WEBB-001/002/009: the site leads to ordering and shows the menu as text", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Handgjord korv",
  );
  await expect(page.getByRole("region", { name: "Öppettider" })).toContainText(
    "tors–sön 11:00–15:00",
  );
  await page.getByRole("link", { name: "Beställ till hämtning" }).click();
  await expect(page).toHaveURL(/\/bestall$/);
  await expect(
    page.getByRole("textbox", { name: "Meddelande till Gulo Gulo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Gulo Gulo Deli, till startsidan" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/meny");
  const ghostdog = page.getByRole("listitem").filter({ hasText: "GHOSTDOG" });
  await expect(ghostdog).toContainText(/Enkel 135\s*kr/);
  await expect(ghostdog).toContainText(/Dubbel 180\s*kr/);
  await page.goto("/produkter");
  await page.getByRole("link", { name: /Färskt isterband/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Färskt isterband med rödbeta",
  );
  await expect(page.getByText("Gris och nöt 75 %")).toBeVisible();
});

test("WEBB-002: the phone menu opens the site's pages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the menu button is for narrow screens");
  await page.goto("/");
  await page.getByRole("button", { name: "Öppna menyn" }).click();
  const menu = page.getByRole("dialog", { name: "Webbplatsens meny" });
  await menu.getByRole("link", { name: "Event" }).click();
  await expect(page).toHaveURL(/\/event$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gulo Gulo Event");
});

test("WEBB-005: old Squarespace addresses redirect permanently", async ({ request }) => {
  for (const [from, to] of [
    ["/frskt-isterband", "/produkter/farskt-isterband"],
    ["/tevsj-bourbon", "/produkter/tevsjo-bourbon"],
    ["/hogrev-blumenthal", "/produkter/burgare-hogrev-blumenthal"],
    ["/info", "/om#niklas"],
    ["/jarven", "/om#jarven"],
  ]) {
    const response = await request.get(from!, { maxRedirects: 0 });
    expect(response.status(), from).toBe(301);
    expect(response.headers().location, from).toBe(to);
  }
});

test("WEBB-010/014: structured data and llms files match the sources; demos are not indexed", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const business = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(business["@type"]).toBe("FoodEstablishment");
  expect(business.openingHoursSpecification[0]).toMatchObject({
    dayOfWeek: ["Thursday", "Friday", "Saturday", "Sunday"],
    opens: "11:00",
    closes: "15:00",
  });
  await page.goto("/meny");
  const menu = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  const ghost = menu.hasMenuSection[0].hasMenuItem.find(
    (item: { name: string }) => item.name === "GHOSTDOG",
  );
  expect(ghost.offers.map((offer: { price: string }) => offer.price)).toEqual(["135", "180"]);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("# Gulo Gulo Deli");
  expect(llms).toContain("varor=ghostdog-dubbel:2,loka:1");
  expect(llms).toContain("demo");
  const full = await (await request.get("/llms-full.txt")).text();
  expect(full).toContain("Färskt isterband med rödbeta");
  expect(full).toMatch(/GHOSTDOG: .*Enkel 135\s*kr/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/\s*$/m);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("WEBB-012: an order link becomes a proposal the customer approves", async ({
  page,
}) => {
  await page.goto("/bestall?varor=ghostdog-dubbel:2,loka:1,pizza:1");
  const log = page.getByRole("log");
  await expect(log).toContainText("Inget är tillagt ännu");
  await expect(log).toContainText("pizza (okänd vara)");
  await expect(page).toHaveURL(/\/bestall$/);
  await expect(
    page.getByRole("button", { name: "Visa beställning, 0 varor", exact: true }),
  ).toBeVisible();
  await log.getByRole("button", { name: /Lägg till dessa val/ }).click();
  await expect(
    page.getByRole("button", { name: "Visa beställning, 3 varor", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("log")).not.toContainText("Inget är tillagt ännu");
});

test("WEBB-013: the newsletter needs consent and says honestly when it is not open", async ({
  page,
}) => {
  await page.goto("/");
  const form = page.locator("form.newsletter");
  await form.getByLabel("E-postadress").fill("kund@exempel.se");
  await form.getByRole("button", { name: "Anmäl" }).click();
  expect(
    await form.getByRole("checkbox").evaluate((box: HTMLInputElement) => box.validity.valid),
  ).toBe(false);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Anmäl" }).click();
  await expect(form.getByRole("alert")).toContainText(
    "Anmälan till nyhetsbrevet är inte öppen ännu",
  );
});

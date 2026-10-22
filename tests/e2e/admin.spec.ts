import { expect, test, type Page } from "@playwright/test";

const code = "browser-test-admin-code-only";
async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Superadmin-kod", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Logga in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Öppettider", exact: true }),
  ).toBeVisible();
}

test("BEH-005: server gate, incorrect code, cookie session and logout", async ({
  page,
  context,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Datumundantag", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Superadmin-kod", { exact: true }).fill("wrong-code");
  await page.getByRole("button", { name: "Logga in", exact: true }).click();
  await expect(page.locator("#login-error")).toHaveText("Fel superadmin-kod.");
  await page.getByLabel("Superadmin-kod", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Logga in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Öppettider", exact: true }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (item) => item.name === "gulo-admin",
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  expect(cookie.value).not.toContain(code);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Öppettider", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Logga ut", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
});

test("BEH-005: cross-origin login/logout and forged sessions are rejected", async ({
  request,
  page,
  context,
}) => {
  const response = await request.post("/api/admin/session", {
    data: { code },
    headers: { Origin: "https://other.example" },
  });
  expect(response.status()).toBe(403);
  const logout = await request.delete("/api/admin/session", {
    headers: { Origin: "https://other.example" },
  });
  expect(logout.status()).toBe(403);
  await context.addCookies([
    {
      name: "gulo-admin",
      value: "forged-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
  expect((await request.get("/api/admin/session")).status()).toBe(401);
});

test("OPPEN-005–009 / ADM-002: standard week and independent date override persist locally", async ({
  page,
}, testInfo) => {
  await login(page);
  await expect(
    page.getByText("Lokal förhandsvisning", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".admin-day")).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("admin-week.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Redigera standardvecka" }).click();
  const standardDialog = page.getByRole("dialog", {
    name: "Redigera standardvecka",
  });
  const monday = standardDialog.getByRole("group", {
    name: "Måndag",
    exact: true,
  });
  const opening = monday.getByRole("group", {
    name: "Öppet / hämtning",
    exact: true,
  });
  await opening.getByRole("combobox").selectOption("custom");
  await opening.getByLabel("Från", { exact: true }).fill("09:00");
  await opening.getByLabel("Till", { exact: true }).fill("12:00");
  await page.screenshot({ path: testInfo.outputPath("admin-editor.png") });
  await standardDialog
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(standardDialog).not.toBeVisible();
  await expect(page.locator(".admin-day").first()).toContainText("09:00–12:00");
  await page.locator(".admin-day").first().getByRole("button").click();
  const dialog = page.getByRole("dialog", {
    name: "Datumundantag",
    exact: true,
  });
  const date = await dialog.getByLabel("Datum", { exact: true }).inputValue();
  await dialog
    .getByRole("group", { name: "Öppet / hämtning", exact: true })
    .getByRole("combobox")
    .selectOption("closed");
  await dialog
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const day = page.locator(".admin-day").first();
  await expect(day.locator(".is-changed")).toHaveCount(1);
  await expect(day).toContainText("Standard: 09:00–12:00");
  await page.reload();
  await expect(page.locator(".admin-day").first()).toContainText(
    "Standard: 09:00–12:00",
  );
  await page.getByRole("button", { name: `Redigera undantag ${date}` }).click();
  await dialog
    .getByRole("group", { name: "Öppet / hämtning", exact: true })
    .getByRole("combobox")
    .selectOption("standard");
  await dialog
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.locator(".admin-day").first().locator(".is-changed"),
  ).toHaveCount(0);
  await expect(
    page.getByText("Standardveckan gäller alla dagar"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Anslutningar", exact: true }).click();
  await expect(page.getByText("Ej anslutet", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".opening-hours")).not.toContainText("09:00–12:00");
});

test("BEH-005: login rejects missing origin, oversized data, and repeated guesses", async ({
  request,
}, testInfo) => {
  const headers = {
    Origin: "http://127.0.0.1:3100",
    "x-forwarded-for":
      testInfo.project.name === "mobile" ? "192.0.2.1" : "192.0.2.2",
  };
  expect(
    (await request.post("/api/admin/session", { data: { code } })).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin/session", {
        data: { code: "x".repeat(3000) },
        headers: { ...headers, "x-forwarded-for": "192.0.2.3" },
      })
    ).status(),
  ).toBe(413);
  for (let index = 0; index < 8; index++) {
    expect(
      (
        await request.post("/api/admin/session", {
          data: { code: "wrong-guess" },
          headers,
        })
      ).status(),
    ).toBe(401);
  }
  expect(
    (
      await request.post("/api/admin/session", { data: { code }, headers })
    ).status(),
  ).toBe(429);
});

test("ADM-002: another tab cannot silently overwrite an open edit", async ({
  page,
  context,
}) => {
  await login(page);
  const other = await context.newPage();
  await other.goto("/admin");
  await page.locator(".admin-day").first().getByRole("button").click();
  const editor = page.getByRole("dialog", {
    name: "Datumundantag",
    exact: true,
  });
  await editor
    .getByRole("group", { name: "Öppet / hämtning", exact: true })
    .getByRole("combobox")
    .selectOption("closed");
  await other.locator(".admin-day").first().getByRole("button").click();
  const otherEditor = other.getByRole("dialog", {
    name: "Datumundantag",
    exact: true,
  });
  await otherEditor
    .getByRole("group", { name: "Sammadagsbeställning", exact: true })
    .getByRole("combobox")
    .selectOption("closed");
  await otherEditor
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(otherEditor).not.toBeVisible();
  await editor
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toContainText("annan flik");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("gulo-hours-preview-v1")!),
  );
  expect(Object.values(stored.overrides)).toEqual([{ sameDayOrdering: null }]);
});

test("ADM-002: blocked writes and expired sessions never report saved", async ({
  page,
  context,
}) => {
  await login(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.locator(".admin-day").first().getByRole("button").click();
  const editor = page.getByRole("dialog", {
    name: "Datumundantag",
    exact: true,
  });
  await editor
    .getByRole("group", { name: "Öppet / hämtning", exact: true })
    .getByRole("combobox")
    .selectOption("closed");
  await editor
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toContainText("Kunde inte spara");
  expect(
    await page.evaluate(() => localStorage.getItem("gulo-hours-preview-v1")),
  ).toBeNull();
  await context.clearCookies();
  await editor
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
});

test("ADM-002/003: invalid interval and broken local data give errors, no false save", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Lägg till datumundantag" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Datumundantag",
    exact: true,
  });
  const opening = dialog.getByRole("group", {
    name: "Öppet / hämtning",
    exact: true,
  });
  await opening.getByRole("combobox").selectOption("custom");
  await opening.getByLabel("Från", { exact: true }).fill("15:00");
  await opening.getByLabel("Till", { exact: true }).fill("11:00");
  await dialog
    .getByRole("button", { name: "Spara lokalt", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("från är före till");
  page.once("dialog", (confirmation) => confirmation.dismiss());
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  page.once("dialog", (confirmation) => confirmation.accept());
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("gulo-hours-preview-v1")),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() =>
    localStorage.setItem("gulo-hours-preview-v1", "broken-json"),
  );
  await page.reload();
  await expect(page.locator("main .admin-error")).toContainText(
    "Demotider visas",
  );
  await expect(
    page.getByRole("button", { name: "Redigera standardvecka" }),
  ).toBeDisabled();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Återställ lokal förhandsvisning" })
    .click();
  await expect(page.locator("main").getByRole("status")).toContainText(
    "återställd",
  );
});

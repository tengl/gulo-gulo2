import { expect, test, type Page, type TestInfo } from "@playwright/test";

// WEBB-015–018 against tests/fakes/github.mjs. Each test signs in with its own
// code, which gives it a private copy of the repository in the fake.
const fake = "http://127.0.0.1:3101";

function codeFor(info: TestInfo, role: "editor" | "reader" = "editor") {
  return `${role}-${info.project.name}-${info.testId}`;
}

async function signIn(page: Page, code: string) {
  await page.context().addCookies([{ name: "fake-github-code", value: code, url: fake }]);
  await page.goto("/admin/texter");
  await page.getByRole("link", { name: "Logga in med GitHub" }).click();
}

// Next's route announcer is also an alert/status; pick ours by its text.
const alert = (page: Page, text: string) => page.getByRole("alert").filter({ hasText: text });
const status = (page: Page, text: string) => page.getByRole("status").filter({ hasText: text });

async function openText(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Texter" }).getByRole("button", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

async function commits(page: Page, code: string) {
  const response = await page.request.get(`${fake}/__commits?token=token-${code}`);
  return (await response.json()) as { path: string; raw: string; login: string; message: string }[];
}

test("WEBB-018: only GitHub accounts with write access may edit texts", async ({ page }, info) => {
  await page.goto("/admin/texter");
  await expect(page.getByRole("heading", { name: "Webbplatsens texter" })).toBeVisible();
  await expect(page.getByLabel("Superadmin-kod")).toHaveCount(0);
  await signIn(page, codeFor(info, "reader"));
  await expect(page).toHaveURL(/\/admin\/texter\?fel=behorighet$/);
  await expect(alert(page, "inte skrivrätt")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Texter" })).toHaveCount(0);
  // A forged callback without the matching state is refused.
  await page.goto("/api/admin/github/callback?code=editor-forged&state=wrong");
  await expect(page).toHaveURL(/fel=inloggning$/);
  const response = await page.request.get("/api/admin/content?fil=sidor/om.md");
  expect(response.status()).toBe(401);
});

test("WEBB-015/016: a saved text is committed in the editor's name and previewed", async ({ page, context }, info) => {
  const code = codeFor(info);
  await signIn(page, code);
  await expect(page.getByText("Rut Redaktör")).toBeVisible();
  const cookie = (await context.cookies()).find((item) => item.name === "gulo-texter")!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.value).not.toContain("token-");
  await openText(page, "Om oss");
  await expect(page.getByLabel("Bild", { exact: true })).toHaveCount(0);
  const save = page.getByRole("button", { name: "Spara och publicera" });
  await expect(save).toBeDisabled();
  await page.getByLabel("Rubrik", { exact: true }).fill("Om oss: Niklas och järven");
  await page.getByLabel("Brödtext").fill("## Ny rubrik\n\nEtt nytt stycke med **fet** text.");
  const preview = page.getByRole("region", { name: "Förhandsvisning" });
  await expect(preview.getByRole("heading", { name: "Om oss: Niklas och järven" })).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Ny rubrik" })).toBeVisible();
  await expect(preview.locator("strong")).toHaveText("fet");
  await page.getByLabel("Vad har du ändrat? (valfritt)").fill("Kortare text om oss");
  await save.click();
  await expect(status(page, "Sparat i GitHub")).toBeVisible();
  await expect(status(page, "inom några minuter")).toBeVisible();
  await expect(save).toBeDisabled();
  const [commit] = await commits(page, code);
  expect(commit!.path).toBe("apps/web/content/sidor/om.md");
  expect(commit!.login).toBe("redaktor");
  expect(commit!.message).toBe("Ändra sidor/om.md i admin\n\nKortare text om oss");
  expect(commit!.raw).toContain('rubrik: "Om oss: Niklas och järven"\n');
  expect(commit!.raw).toContain("bild: /bilder/niklas.jpg\n");
  expect(commit!.raw.endsWith("---\n\n## Ny rubrik\n\nEtt nytt stycke med **fet** text.\n")).toBe(true);
  // The next save builds on the version just saved, without a conflict.
  await page.getByLabel("Ingress").fill("En ny ingress.");
  await save.click();
  await expect(status(page, "Sparat i GitHub")).toBeVisible();
  expect(await commits(page, code)).toHaveLength(2);
});

test("WEBB-016: invalid text is explained in the form and nothing is committed", async ({ page }, info) => {
  const code = codeFor(info);
  await signIn(page, code);
  await openText(page, "Event");
  await page.getByLabel("Rubrik", { exact: true }).fill("");
  await page.getByLabel("Brödtext").fill("Se [vår meny](/finns-inte).");
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(alert(page, "Rätta texten innan den sparas.")).toContainText("rubrik får inte vara tomt");
  await page.getByLabel("Rubrik", { exact: true }).fill("Gulo Gulo Event");
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(alert(page, "Rätta texten")).toContainText("länken /finns-inte leder inte till någon sida");
  expect(await commits(page, code)).toHaveLength(0);
});

test("WEBB-017: a text changed by someone else after opening is not overwritten", async ({ page }, info) => {
  const code = codeFor(info);
  await signIn(page, code);
  await openText(page, "Brewurst");
  await page.getByLabel("Slogan").fill("Korv på glasburk");
  await page.request.post(`${fake}/__touch`, {
    data: { token: `token-${code}`, file: "produkter/brewurst.md", raw: "---\nnamn: Brewurst\nslogan: Agentens text\nordning: 2\nfakta:\n  - rubrik: A\n    varden: [B]\n---\n\nText.\n" },
  });
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(alert(page, "Texten har ändrats sedan du öppnade den")).toBeVisible();
  await expect(page.getByLabel("Slogan")).toHaveValue("Korv på glasburk");
  expect((await commits(page, code)).map((commit) => commit.login)).toEqual(["agent"]);
  await page.getByRole("button", { name: "Öppna den nya versionen" }).click();
  await expect(page.getByLabel("Slogan")).toHaveValue("Agentens text");
});

test("WEBB-017: branch protection is not reported as someone else's change", async ({ page }, info) => {
  await signIn(page, `editor-protected-${info.project.name}-${info.testId}`);
  await openText(page, "Event");
  await page.getByLabel("Rubrik", { exact: true }).fill("Event och fest");
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(alert(page, "huvudgrenen är skyddad")).toBeVisible();
  await expect(page.getByRole("button", { name: "Öppna den nya versionen" })).toHaveCount(0);
  await expect(page.getByLabel("Rubrik", { exact: true })).toHaveValue("Event och fest");
});

test("WEBB-016: an earlier version can be opened and restored", async ({ page }, info) => {
  const code = codeFor(info);
  await signIn(page, code);
  await openText(page, "Integritet");
  const original = await page.getByLabel("Rubrik", { exact: true }).inputValue();
  await page.getByLabel("Rubrik", { exact: true }).fill("Tillfällig rubrik");
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(status(page, "Sparat i GitHub")).toBeVisible();
  await page.getByRole("button", { name: "Tidigare versioner" }).click();
  const versions = page.getByRole("region", { name: "Tidigare versioner" }).getByRole("listitem");
  await expect(versions).toHaveCount(2);
  await expect(versions.first()).toContainText("redaktor");
  await expect(versions.first()).toContainText("Gällande");
  await versions.nth(1).getByRole("button", { name: "Öppna" }).click();
  await expect(page.getByText("Du tittar på en tidigare version.")).toBeVisible();
  await expect(page.getByLabel("Rubrik", { exact: true })).toHaveValue(original);
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(status(page, "Sparat")).toBeVisible();
  const saved = await commits(page, code);
  expect(saved).toHaveLength(2);
  expect(saved[1]!.raw).toContain(`rubrik: ${original}\n`);
});

test("WEBB-015: unsaved changes are kept until the editor chooses to discard them", async ({ page }, info) => {
  await signIn(page, codeFor(info));
  await openText(page, "Om oss");
  await page.getByLabel("Rubrik", { exact: true }).fill("Inte sparad");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Alla texter" }).click();
  else await page.getByRole("navigation", { name: "Texter" }).getByRole("button", { name: "Event" }).click();
  await expect(page.getByText("Du har ändringar som inte är sparade.")).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt redigera" }).click();
  await expect(page.getByLabel("Rubrik", { exact: true })).toHaveValue("Inte sparad");
  await page.getByRole("button", { name: "Ångra ändringarna" }).click();
  await expect(page.getByLabel("Rubrik", { exact: true })).toHaveValue("Om oss");
});

test("WEBB-016: links are chosen from the site's pages and checked before saving", async ({ page }, info) => {
  const code = codeFor(info);
  await signIn(page, code);
  await openText(page, "Event");
  const body = page.getByLabel("Brödtext");
  await body.fill("Läs om Niklas här.");
  await body.evaluate((area: HTMLTextAreaElement) => area.setSelectionRange(7, 13));
  await page.getByRole("button", { name: "Infoga länk" }).click();
  const panel = page.getByRole("group", { name: "Infoga länk" });
  await expect(panel.getByLabel("Länktext")).toHaveValue("Niklas");
  await panel.getByLabel("Länka till").selectOption({ label: "Om oss › Niklas Bonnevier" });
  await panel.getByRole("button", { name: "Infoga" }).click();
  await expect(body).toHaveValue("Läs om [Niklas](/om#niklas) här.");
  await expect(body).toBeFocused();
  // An external address must be complete and use https.
  await page.getByRole("button", { name: "Infoga länk" }).click();
  await panel.getByLabel("Länktext").fill("Instagram");
  await panel.getByLabel("Länka till").selectOption({ label: "En annan webbplats…" });
  await panel.getByLabel("Webbadress").fill("http://instagram.com/gulogulo");
  await panel.getByRole("button", { name: "Infoga" }).click();
  await expect(panel.getByRole("alert")).toContainText("Skriv hela adressen");
  await panel.getByLabel("Webbadress").fill("https://www.instagram.com/gulogulo");
  await panel.getByRole("button", { name: "Infoga" }).click();
  await expect(body).toHaveValue(/\[Instagram\]\(https:\/\/www\.instagram\.com\/gulogulo\)/);
  // Preview links open in a new tab and the editor stays.
  const preview = page.getByRole("region", { name: "Förhandsvisning" });
  const [tab] = await Promise.all([
    page.waitForEvent("popup"),
    preview.getByRole("link", { name: "Niklas" }).click(),
  ]);
  await expect(tab).toHaveURL(/\/om#niklas$/);
  await tab.close();
  await expect(page.getByRole("heading", { level: 1, name: "Event" })).toBeVisible();
  // A mistyped place on a page is stopped with a suggestion.
  await body.fill("Läs om [Niklas](/om#nikals).");
  await page.getByRole("button", { name: "Spara och publicera" }).click();
  await expect(alert(page, "Rätta texten")).toContainText("menade du /om#niklas?");
  expect(await commits(page, code)).toHaveLength(0);
});

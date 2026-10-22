import { expect, test, type Page } from "@playwright/test";
import {
  addSelections,
  saveDemoOrder,
  type OrderMemory,
  type SavedOrder,
} from "../../apps/web/src/modules/ordering/index.ts";

const code = "browser-test-admin-code-only";
const key = "gulo-order-memory-v1";
function demoOrder(
  id: number,
  createdAt = new Date().toISOString(),
  productId = "ghostdog",
): SavedOrder {
  const cart = addSelections(
    [],
    [
      { productId, variant: "double", quantity: 2, omissions: ["senap"] },
      { productId: "loka", quantity: 1, omissions: [] },
    ],
  );
  return saveDemoOrder(
    { cart, orders: [] },
    `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    createdAt,
  ).orders[0]!;
}
async function seed(page: Page, orders: SavedOrder[]) {
  const memory: OrderMemory = {
    cart: addSelections(
      [],
      [{ productId: "loka", quantity: 1, omissions: [] }],
    ),
    orders,
  };
  await page.addInitScript(
    ({ memory, key }) => {
      if (localStorage.getItem(key) === null)
        localStorage.setItem(key, JSON.stringify({ version: 1, ...memory }));
    },
    { memory, key },
  );
}
async function login(page: Page) {
  await page.goto("/admin/bestallningar");
  await page.getByLabel("Superadmin-kod", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Logga in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Beställningar", exact: true }),
  ).toBeVisible();
}
async function writeOrder(page: Page, order: SavedOrder) {
  await page.evaluate(
    ({ key, order }) => {
      const data = JSON.parse(localStorage.getItem(key)!);
      data.orders.unshift(order);
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key, order },
  );
}

test("ADM-004/BEH-005: direct order and connection routes require a session", async ({
  page,
}) => {
  for (const path of ["/admin/bestallningar", "/admin/anslutningar"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Välkommen in." }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Administration", exact: true }),
    ).toHaveCount(0);
  }
});

test("ADM-004–006 / ORD-016: a customer order is shared with admin through payment and pickup", async ({
  page: customer,
  context,
}) => {
  await customer.goto("/");
  await customer
    .getByRole("button", { name: "Välj från menyn", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Välj GHOSTDOG", exact: true })
    .click();
  await customer.getByRole("radio", { name: /Dubbel wrap/ }).check();
  await customer
    .getByRole("button", { name: /Lägg till i beställningen/ })
    .click();
  await customer
    .getByRole("button", { name: /Visa beställning, 1 varor/ })
    .click();
  await customer
    .getByRole("complementary", { name: "Beställningsöversikt" })
    .getByRole("button", { name: "Granska beställningen", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Spara demobeställning", exact: true })
    .click();
  const reference = (await customer
    .locator(".saved-order .order-reference")
    .textContent())!;
  const admin = await context.newPage();
  await login(admin);
  await admin
    .getByRole("article", { name: `Beställning ${reference}`, exact: true })
    .getByRole("button", { name: /Visa beställning/ })
    .click();
  let detail = admin.getByRole("dialog");
  await expect(detail).toContainText("Dubbel wrap");
  for (const [action, customerStatus] of [
    ["Bekräfta mottagning", "Mottagning bekräftad · demo"],
    ["Påbörja tillagning", "Tillagas · demo"],
    ["Markera som tillagad", "Tillagad · demo"],
  ]) {
    await detail.getByRole("button", { name: action!, exact: true }).click();
    await detail
      .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
      .click();
    await expect(
      customer.getByText(customerStatus!, { exact: true }),
    ).toBeVisible();
    // Preparation is independent of payment: this remains an unpaid demo.
    await expect(
      customer.getByText("Sparad demo", { exact: true }),
    ).toBeVisible();
  }
  await detail
    .getByRole("button", { name: "Markera som betald", exact: true })
    .click();
  await expect(detail).toContainText(
    "Ingen Swish-betalning tas emot eller verifieras",
  );
  await detail
    .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
    .click();
  await expect(detail.getByRole("status")).toContainText("markerad som betald");
  await expect(
    customer.getByText("Betald · demo", { exact: true }),
  ).toBeVisible();
  await expect(
    customer.getByRole("button", {
      name: "Avboka demobeställning",
      exact: true,
    }),
  ).toHaveCount(0);
  await customer
    .getByRole("navigation", { name: "Beställningssätt", exact: true })
    .getByRole("button", { name: "Chatta med oss", exact: true })
    .click();
  await customer
    .getByRole("textbox", { name: "Meddelande till Gulo Gulo" })
    .fill(`Avboka ${reference}`);
  const outgoing = customer.waitForRequest(
    (request) =>
      request.url().endsWith("/api/chat") && request.method() === "POST",
  );
  await customer
    .getByRole("button", { name: "Skicka meddelande", exact: true })
    .click();
  expect((await outgoing).postDataJSON().orders[0].preparation).toBe(
    "prepared",
  );
  await expect(customer.getByRole("log")).toContainText(
    "kontaktar du personalen",
  );
  await expect(
    customer.getByRole("button", { name: "Granska avbokningen", exact: true }),
  ).toHaveCount(0);
  await detail
    .getByRole("button", { name: "Markera som hämtad", exact: true })
    .click();
  await detail
    .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
    .click();
  await expect(detail.getByRole("status")).toContainText("markerad som hämtad");
  await detail.getByRole("button", { name: "Stäng", exact: true }).click();
  await admin.reload();
  await expect(
    admin.getByRole("article", {
      name: `Beställning ${reference}`,
      exact: true,
    }),
  ).toContainText("Hämtad · demo");
  await admin.getByRole("button", { name: "Hämtade", exact: true }).click();
  await admin.getByRole("button", { name: /Visa beställning/ }).click();
  detail = admin.getByRole("dialog");
  await expect(detail).toContainText("Beställningen är avslutad");
  await expect(
    detail.getByRole("button", { name: "Markera som betald", exact: true }),
  ).toHaveCount(0);
});

test("ADM-004/007: filters, snapshots, details and cancellation", async ({
  page,
}, testInfo) => {
  const current = demoOrder(1);
  const older = {
    ...demoOrder(2, "2025-01-01T12:00:00Z", "brol"),
    status: "paid" as const,
  };
  const cancelled = { ...demoOrder(3), status: "cancelled" as const };
  await seed(page, [current, older, cancelled]);
  await login(page);
  await expect(page.locator(".admin-orders-list article")).toHaveCount(2);
  await expect(page.locator(".admin-order-stats")).toContainText(/385\s*kr/);
  await page.screenshot({
    path: testInfo.outputPath("admin-orders.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const controls = await Promise.all(
    [
      page.getByLabel("Sparad den", { exact: true }),
      page.getByLabel("Mottagning och tillagning", { exact: true }),
      page.getByRole("button", { name: "Alla datum", exact: true }),
    ].map((control) => control.boundingBox()),
  );
  for (let index = 0; index < controls.length; index++)
    for (let other = index + 1; other < controls.length; other++) {
      const a = controls[index]!;
      const b = controls[other]!;
      expect(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
      ).toBe(true);
    }
  await page.getByRole("button", { name: "Alla datum", exact: true }).click();
  await page.getByLabel("Sök beställning", { exact: true }).fill("brol");
  await expect(page.locator(".admin-orders-list article")).toHaveCount(1);
  await expect(page.locator(".admin-orders-list")).toContainText("BRÖL");
  await page.getByRole("button", { name: "Obetalda", exact: true }).click();
  await expect(page.getByText("Inga beställningar matchar")).toBeVisible();
  await page
    .getByRole("button", { name: "Visa alla beställningar", exact: true })
    .click();
  await expect(page.locator(".admin-orders-list article")).toHaveCount(3);
  await page
    .getByRole("article", {
      name: `Beställning ${current.reference}`,
      exact: true,
    })
    .getByRole("button")
    .click();
  const detail = page.getByRole("dialog");
  await expect(detail).toContainText("utan senap");
  await expect(detail).toContainText("Dubbel wrap");
  await page.screenshot({
    path: testInfo.outputPath("admin-order-details.png"),
  });
  await detail
    .getByRole("button", { name: "Avboka demobeställning", exact: true })
    .click();
  await detail
    .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
    .click();
  await expect(detail.getByRole("status")).toContainText("avbokad");
  const memory = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(memory.cart).toHaveLength(1);
  expect(
    memory.orders.find(
      (order: SavedOrder) => order.reference === current.reference,
    ).status,
  ).toBe("cancelled");
  expect(
    memory.orders.find(
      (order: SavedOrder) => order.reference === older.reference,
    ).status,
  ).toBe("paid");
});

test("ADM-006: another tab invalidates a pending status change", async ({
  page,
  context,
}) => {
  const order = demoOrder(1);
  await seed(page, [order]);
  await login(page);
  await page.getByRole("button", { name: /Visa beställning/ }).click();
  await page
    .getByRole("button", { name: "Markera som betald", exact: true })
    .click();
  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate(
    ({ key, reference }) => {
      const memory = JSON.parse(localStorage.getItem(key)!);
      memory.orders.find(
        (order: { reference: string }) => order.reference === reference,
      ).status = "cancelled";
      localStorage.setItem(key, JSON.stringify(memory));
    },
    { key, reference: order.reference },
  );
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Beställningen har ändrats",
  );
  await expect(
    page.getByRole("button", { name: "Bekräfta lokal ändring", exact: true }),
  ).toBeDisabled();
});

test("ADM-006: blocked writes and expired sessions cannot report success", async ({
  page,
  context,
}) => {
  await seed(page, [demoOrder(1)]);
  await login(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.getByRole("button", { name: /Visa beställning/ }).click();
  await page
    .getByRole("button", { name: "Markera som betald", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "kunde inte sparas",
  );
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).orders[0].status,
      key,
    ),
  ).toBe("saved");
  await context.clearCookies();
  await page
    .getByRole("button", { name: "Bekräfta lokal ändring", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Välkommen in." }),
  ).toBeVisible();
});

test("ADM-004: corrupted data is not an empty order list", async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "broken-json"),
    key,
  );
  await login(page);
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Beställningarna kunde inte läsas",
  );
  await expect(page.locator(".admin-order-stats")).toHaveCount(0);
  await expect(
    page.getByText("Inga sparade demobeställningar ännu"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Aktivera orderljud", exact: true }),
  ).toBeDisabled();
});

test("ADM-008: activate sound, detect new orders across tabs/views, ignore history and status changes", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    const audio = window as unknown as { starts: number };
    audio.starts = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = original.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (...args) => {
        audio.starts += 1;
        start(...args);
      };
      return oscillator;
    };
  });
  await seed(page, [demoOrder(1)]);
  await login(page);
  const starts = () =>
    page.evaluate(() => (window as unknown as { starts: number }).starts);
  expect(await starts()).toBe(0);
  await page
    .getByRole("button", { name: "Aktivera orderljud", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stäng av orderljud", exact: true }),
  ).toBeVisible();
  expect(await starts()).toBe(2);
  const writer = await context.newPage();
  await writer.goto("/");
  const second = demoOrder(2);
  await writeOrder(writer, second);
  await expect(
    page
      .getByRole("region", { name: "Orderljud", exact: true })
      .getByRole("status"),
  ).toContainText("Ny demobeställning");
  expect(await starts()).toBe(4);
  await writer.evaluate(
    ({ key, reference }) => {
      const data = JSON.parse(localStorage.getItem(key)!);
      data.orders.find(
        (order: { reference: string }) => order.reference === reference,
      ).status = "paid";
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key, reference: second.reference },
  );
  await expect(
    page.getByRole("article", {
      name: `Beställning ${second.reference}`,
      exact: true,
    }),
  ).toContainText("Betald · demo");
  expect(await starts()).toBe(4);
  await page.getByRole("link", { name: "Öppettider", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Öppettider", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Stäng av orderljud", exact: true }),
  ).toBeVisible();
  await writeOrder(writer, demoOrder(3));
  await expect.poll(starts).toBe(6);
  await page
    .getByRole("button", { name: "Stäng av orderljud", exact: true })
    .click();
  await writeOrder(writer, demoOrder(4));
  await page.getByRole("link", { name: "Beställningar", exact: true }).click();
  await expect(page.locator(".admin-orders-list article")).toHaveCount(4);
  expect(await starts()).toBe(6);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Aktivera orderljud", exact: true }),
  ).toBeVisible();
  expect(await starts()).toBe(0);
});

test("ADM-008: unavailable audio gives feedback without blocking orders", async ({
  page,
}) => {
  await seed(page, [demoOrder(1)]);
  await login(page);
  await page.evaluate(() => {
    window.AudioContext = class {
      constructor() {
        throw new Error("Audio unavailable");
      }
    } as unknown as typeof AudioContext;
  });
  await page
    .getByRole("button", { name: "Aktivera orderljud", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Orderljud", exact: true })
      .getByRole("status"),
  ).toContainText("Kunde inte aktivera ljudet");
  await page.getByRole("button", { name: /Visa beställning/ }).click();
  await expect(page.getByRole("dialog")).toContainText("GHOSTDOG");
});

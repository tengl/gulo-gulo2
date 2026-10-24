import assert from "node:assert/strict";
import test from "node:test";
import {
  brevoConfig,
  requestConfirmation,
} from "../../apps/web/src/server/brevo/newsletter.ts";

test("WEBB-013: Brevo is asked for double opt-in on the configured list only", async () => {
  const saved = { ...process.env };
  try {
    delete process.env.BREVO_API_KEY;
    assert.equal(brevoConfig("https://www.gulogulo.se/"), null);
    process.env.BREVO_API_KEY = "synthetic-key";
    process.env.BREVO_NEWSLETTER_LIST_ID = "7";
    process.env.BREVO_DOI_TEMPLATE_ID = "3";
    const config = brevoConfig("https://www.gulogulo.se/");
    let sent;
    const ok = await requestConfirmation(config, "a@b.se", async (url, init) => {
      sent = { url, init };
      return new Response(null, { status: 201 });
    });
    assert.equal(ok, true);
    assert.equal(sent.url, "https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
    assert.equal(sent.init.headers["api-key"], "synthetic-key");
    assert.deepEqual(JSON.parse(sent.init.body), {
      email: "a@b.se",
      includeListIds: [7],
      templateId: 3,
      redirectionUrl: "https://www.gulogulo.se/",
    });
    assert.equal(
      await requestConfirmation(config, "a@b.se", async () => new Response(null, { status: 400 })),
      false,
    );
  } finally {
    process.env = saved;
  }
});

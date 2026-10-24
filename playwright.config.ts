import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: [
    {
      command:
        "npm run dev --workspace @gulo/web -- --hostname 127.0.0.1 --port 3100",
      env: {
        ANTHROPIC_API_KEY: "",
        ANTHROPIC_MODEL: "",
        GULO_BROWSER_TEST: "1",
        ADMIN_ACCESS_CODE: "browser-test-admin-code-only",
        // WEBB-015–018: text editing talks to tests/fakes/github.mjs, never GitHub.
        GITHUB_CLIENT_ID: "browser-test-client",
        GITHUB_CLIENT_SECRET: "browser-test-github-secret-only",
        GITHUB_CONTENT_REPO: "gulo/test",
        GITHUB_CONTENT_BRANCH: "main",
        GITHUB_WEB_URL: "http://127.0.0.1:3101",
        GITHUB_API_URL: "http://127.0.0.1:3101",
      },
      url: "http://127.0.0.1:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "node tests/fakes/github.mjs",
      url: "http://127.0.0.1:3101/__health",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
  ],
});

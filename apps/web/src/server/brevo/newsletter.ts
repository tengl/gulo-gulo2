import "server-only";

// WEBB-013: Brevo sends the confirmation mail and keeps the list. The address
// is passed on and never stored or logged here.
export type BrevoConfig = {
  apiKey: string;
  listId: number;
  templateId: number;
  redirectUrl: string;
};

export function brevoConfig(redirectUrl: string): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  if (!apiKey || !Number.isSafeInteger(listId) || !Number.isSafeInteger(templateId))
    return null;
  return { apiKey, listId, templateId, redirectUrl };
}

export async function requestConfirmation(
  config: BrevoConfig,
  email: string,
  send: typeof fetch = fetch,
): Promise<boolean> {
  const response = await send(
    "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
    {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        includeListIds: [config.listId],
        templateId: config.templateId,
        redirectionUrl: config.redirectUrl,
      }),
      signal: AbortSignal.timeout(8000),
    },
  );
  return response.ok;
}

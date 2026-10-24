import { llmsText } from "@/modules/site";
import { loadSite } from "@/server/content/load";
import { siteUrl } from "@/server/site/config";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(loadSite(), siteUrl()), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

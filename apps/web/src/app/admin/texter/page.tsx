import Image from "next/image";
import Link from "next/link";
import { TextsAdmin } from "@/modules/site/ui";
import { editableFiles } from "@/server/content/editable";
import { contentRoot, githubConfig } from "@/server/github/config";
import { currentEditor } from "@/server/github/current";

export const metadata = { title: "Texter · Administration · Gulo Gulo" };

const problems: Record<string, string> = {
  inloggning: "Inloggningen med GitHub avbröts eller misslyckades. Försök igen.",
  behorighet:
    "Ditt GitHub-konto har inte skrivrätt till Gulo Gulos repo. Be den som administrerar repot att lägga till dig.",
  github: "GitHub svarade inte. Försök igen om en stund.",
};

// WEBB-018: text editing needs the person's own GitHub account; the shared
// admin code is neither needed nor enough here.
export default async function TextsPage({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  const config = githubConfig();
  const session = await currentEditor();
  if (config && session)
    return (
      <TextsAdmin
        editor={{ login: session.editor.login, name: session.editor.name }}
        files={editableFiles()}
        githubFiles={`${config.webUrl}/${config.repo}/blob/${config.branch}/${contentRoot}`}
      />
    );
  const { fel } = await searchParams;
  const problem = fel ? problems[fel] : undefined;
  return (
    <main className="admin-login admin-scope">
      <div className="admin-login-card">
        <Image src="/logo-light.png" alt="Gulo Gulo" width={80} height={80} priority />
        <span className="eyebrow">Gulo Gulo · internt</span>
        <h1>Webbplatsens texter</h1>
        <p>
          Logga in med ditt GitHub-konto för att ändra texterna på webbplatsen.
          Det du sparar blir en ändring i Gulo Gulos repo i ditt namn.
        </p>
        {problem && (
          <p role="alert" className="admin-error">
            {problem}
          </p>
        )}
        {config ? (
          // A full navigation: GitHub's sign-in page cannot load inside the app.
          <a className="admin-primary texts-login" href="/api/admin/github/login">
            Logga in med GitHub
          </a>
        ) : (
          <div className="admin-notice">
            <strong>Textredigeringen är inte ansluten</strong>
            <p>
              Sätt GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET och GITHUB_CONTENT_REPO
              från Gulo Gulos GitHub App i servermiljön. Se docs/deployment.md.
            </p>
          </div>
        )}
        <Link href="/admin">Till administrationen</Link>
      </div>
    </main>
  );
}

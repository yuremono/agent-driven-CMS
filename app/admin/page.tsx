import Link from "next/link";

import BridgeDashboard from "../components/BridgeDashboard";
import { BridgeSessionProvider } from "../components/BridgeSessionContext";

function GithubPagesAdminNotice() {
  return (
    <main className="min-h-screen bg-[var(--WH)] px-[var(--PX)] py-16 text-[var(--TC)]">
      <section className="mx-auto grid max-w-[60ch] gap-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--GR)]">
          GitHub Pages
        </p>
        <h1 className="text-[clamp(2.4rem,4.2vw,4.8rem)] leading-none">
          管理画面はローカル開発環境で使います。
        </h1>
        <p className="leading-8 text-[var(--TC70)]">
          GitHub Pages は静的ファイルだけを配信するため、編集用の bridge API
          と app-server 接続は利用できません。公開ページ本体は同じ app/
          から静的 export されています。
        </p>
        <Link
          href="/"
          className="w-fit rounded-full border border-[var(--TC10)] px-5 py-3 text-sm text-[var(--TC)]"
        >
          公開ページへ戻る
        </Link>
      </section>
    </main>
  );
}

export default function AdminPage() {
  if (process.env.GITHUB_PAGES === "true") {
    return <GithubPagesAdminNotice />;
  }

  return (
    <BridgeSessionProvider>
      <BridgeDashboard />
    </BridgeSessionProvider>
  );
}

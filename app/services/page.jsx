import Link from "next/link";

const serviceCards = [
  {
    title: "Brand Strategy",
    body: "企業のらしさを整理し、伝える順番と見せ方を設計します。",
  },
  {
    title: "Web Design",
    body: "情報の流れと余白を整え、読みやすく印象に残る画面に仕上げます。",
  },
  {
    title: "Content Support",
    body: "文章、写真、導線の見直しを通じて、更新しやすい状態を保ちます。",
  },
];

export default function ServicesPage() {
  return (
    <>
      <header className="pageHeader">

        <nav aria-label="Primary" className="pageNav">
          <Link className="pageNavLink" href="/">
            ホーム
          </Link>
          <Link aria-current="page" className="pageNavLink" href="/services">
            サービス
          </Link>
          <Link className="pageNavLink" href="/admin">
            お問い合わせ
          </Link>
        </nav>
      </header>

      <main className="pageMain" data-page="services">
        
      </main>

      <footer className="pageFooter">

      </footer>
    </>
  );
}

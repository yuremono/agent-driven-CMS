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
        <div>
          <p className="pageEyebrow">Northstar Studio Co., Ltd.</p>
          <strong className="block text-lg tracking-[0.02em] text-[#1d1712]">
            Services
          </strong>
        </div>
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
        <section className="pageArea" data-section="hero">
          <div className="pageAreaInner pageSection text-center">
            <p className="pageEyebrow">Services</p>
            <div className="pageMeasureLg pageGridTwo gap-4 mx-auto">
              <h1 className='font-["Iowan_Old_Style","Palatino_Linotype","Book_Antiqua",Georgia,serif] text-[clamp(2.6rem,4.8vw,4.7rem)] leading-[0.95] tracking-[-0.055em] text-[#1d1712]'>
                事業に合わせて、伝え方をしなやかに整える。
              </h1>
              <p className="pageLead text-[1.05rem]">
                企業紹介、採用、実績、問い合わせまで、目的の違うページでも一貫した印象になるように
                構成と文章を整えます。
              </p>
            </div>
          </div>
        </section>

        <section className="pageArea" data-section="capabilities">
          <div className="pageAreaInner pageSection">
            <div className="grid gap-2">
              <p className="pageEyebrow">Capabilities</p>
              <h2 className="pageSectionTitle text-[2rem]">
                ご相談いただくことの多い内容
              </h2>
              <p className="pageSectionCopy text-sm">
                立ち上げ前の整理から、公開後の運用改善まで、段階に応じて伴走します。
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {serviceCards.map((card) => (
                <article className="grid gap-2" key={card.title}>
                  <h3 className="text-base font-medium text-[#1d1712]">{card.title}</h3>
                  <p className="pageRowCopy">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="pageFooter">
        <p className="m-0">サービス内容はご要望に合わせて、単発の制作から継続運用まで対応します。</p>
        <p className="m-0">ご相談の段階から、伝え方と見せ方を一緒に整えます。</p>
      </footer>
    </>
  );
}

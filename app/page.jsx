import Image from "next/image";
import Link from "next/link";

const heroImageSrc = "/images/picsum/002.jpg";

const storyImageSrc = "/images/picsum/004.jpg";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/services", label: "サービス" },
  { href: "/admin", label: "お問い合わせ" },
];

const editorialUnits = [
  {
    title: "ブランドの印象を整える",
    copy: "言葉、写真、余白のバランスを見直し、伝わり方を丁寧に整えます。",
  },
  {
    title: "日々の運用を支える",
    copy: "更新のしやすさを意識した設計で、情報発信を無理なく続けられます。",
  },
  {
    title: "長く使える構成にする",
    copy: "必要な情報を整理して、事業の変化にも対応しやすい土台をつくります。",
  },
];

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="pageSectionHeading">
      <p className="pageEyebrow">{eyebrow}</p>
      <h2 className="pageSectionTitle text-[clamp(1.8rem,3vw,2.8rem)]">{title}</h2>
      <p className="pageSectionCopy text-[0.98rem]">{copy}</p>
    </div>
  );
}

function EditorialRow({ title, copy, index }) {
  return (
    <article className="pageRow">
      <p className="pageRowIndex">0{index + 1}</p>
      <div className="grid gap-2">
        <h3 className="pageRowTitle">{title}</h3>
        <p className="pageRowCopy">{copy}</p>
      </div>
    </article>
  );
}

function PlaceholderFigure({
  src,
  alt,
  caption,
  priority = false,
  ratioClass,
  align = "left",
}) {
  const alignmentClass = align === "right" ? "md:justify-self-end" : "";

  return (
    <figure className={`pageFigure group ${alignmentClass}`}>
      <div className={`pageFigureFrame ${ratioClass}`}>
        <Image
          alt={alt}
          className="object-cover transition duration-500"
          fill
          priority={priority}
          sizes="(min-width: 1024px) 48vw, 100vw"
          src={src}
        />
      </div>
      <figcaption className="pageFigureCaption">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function HomePage() {
  return (
    <>
      <header className="pageHeader">
        <div className="grid gap-1">
          <p className="pageEyebrow">Northstar Studio Co., Ltd.</p>
          <strong className="text-[1rem] font-medium tracking-[-0.02em] text-[#1d1712]">
            Brand Direction & Web Design
          </strong>
        </div>

        <nav aria-label="Primary" className="pageNav">
          {navItems.map((item) => (
            <Link
              aria-current={item.href === "/" ? "page" : undefined}
              className="pageNavLink"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="pageMain" data-page="home">
        <section className="pageArea pageHero" data-section="hero">
          <div className="pageAreaInner pageGridTwo lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="grid gap-6">
              <p className="pageEyebrow">Company Profile</p>
              <div className="grid gap-5">
                <h1 className="pageHeroTitle text-[clamp(3.2rem,6vw,6.3rem)]">
                  企業の個性を、静かな強さで伝える。
                </h1>
                <p className="pageLead pageMeasureHero text-[1.02rem]">
                  私たちは、ブランドの魅力がまっすぐ届くウェブ体験をつくるデザインスタジオです。
                  事業の背景や価値観を丁寧に言葉へ落とし込み、読みやすく印象に残るサイトへ整えます。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link className="pageButtonPrimary" href="/services">
                  事業内容を見る
                </Link>
                <Link className="pageButtonSecondary" href="/admin">
                  会社案内
                </Link>
              </div>

              <p className="m-0 pageMeasureWide text-[0.82rem] leading-6 text-[#685f55]">
                写真はイメージです。事業に合わせて、実際の製品、店舗、オフィス、人物写真へ差し替えられます。
              </p>
            </div>

            <PlaceholderFigure
              alt="ブランドイメージの写真"
              priority
              ratioClass="aspect-[4/5] min-h-[420px] w-full"
              src={heroImageSrc}
            />
          </div>
        </section>

        <section className="pageArea" data-section="manifesto">
          <div className="pageAreaInner pageSection md:grid-cols-[0.92fr_1.08fr] md:items-start">
            <SectionHeading
              copy="会社の価値観や姿勢を、短い文章でまっすぐ伝えます。"
              eyebrow="MANIFESTO"
              title="一つひとつの情報に、意味を持たせる。"
            />

            <div className="pageGridTwo">
              <PlaceholderFigure
                align="right"
                alt="事業紹介のイメージ写真"
                ratioClass="aspect-[16/10] min-h-[320px] w-full"
                src={storyImageSrc}
              />
              <p className="pageLead pageMeasureWide text-[1rem]">
                企業の第一印象は、事業内容だけでなく、文章の温度や画面の余白にも表れます。
                だからこそ私たちは、読みやすさと落ち着きを大切にした構成を提案しています。
              </p>
            </div>
          </div>
        </section>

        <section className="pageArea" data-section="structure">
          <div className="pageAreaInner pageSection md:grid-cols-[0.96fr_1.04fr]">
            <SectionHeading
              copy="サービスの流れが追いやすいよう、章ごとに情報を整理しています。"
              eyebrow="STRUCTURE"
              title="事業の特徴を、章立てでわかりやすく。"
            />

            <div className="grid">
              {editorialUnits.map((item, index) => (
                <EditorialRow copy={item.copy} index={index} key={item.title} title={item.title} />
              ))}
            </div>
          </div>
        </section>

        <section className="pageArea" data-section="workflow">
          <div className="pageAreaInner pageSection md:grid-cols-[0.92fr_1.08fr] md:items-end">
            <SectionHeading
              copy="更新しやすい構成は、継続的な情報発信と信頼の積み重ねにつながります。"
              eyebrow="WORKFLOW"
              title="日常の更新まで見据えた設計。"
            />

            <div className="grid gap-4">
              <p className="pageLeadSm pageMeasureWide text-[1rem]">
                案件ごとに情報量や見せ方を調整しながら、公開後の運用まで無理なく続けられるサイトを整えます。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link className="pageButtonPrimary" href="/services">
                  事業内容を見る
                </Link>
                <Link className="pageButtonSecondary" href="/admin">
                  会社案内
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pageFooter">
        <p className="m-0">Northstar Studio Co., Ltd. は、ブランドとWeb体験を丁寧に設計するデザインスタジオです。</p>
        <p className="m-0">掲載写真はイメージです。実際の素材に合わせて柔軟に更新できます。</p>
      </footer>
    </>
  );
}

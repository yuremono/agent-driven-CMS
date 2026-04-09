import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, "..");
const outDir = path.join(projectRoot, "dist", "github-pages");
const imagesDir = path.join(projectRoot, "public", "images", "picsum");

const styles = `:root {
  color-scheme: light;
  --primary: #b65325;
  --secondary: #204d66;
  --accent: #94431c;
  --background: #f8f2e8;
  --foreground: #1d1712;
  --muted: #6f665d;
  --border: rgba(45, 35, 25, 0.11);
  --surface: rgba(255, 255, 255, 0.68);
  --surface-strong: rgba(255, 255, 255, 0.88);
  --shadow: 0 18px 48px rgba(39, 24, 12, 0.12);
  --page-width: min(1240px, calc(100% - 2rem));
  --page-pad: clamp(1rem, 2vw, 1.5rem);
  --section-gap: clamp(4rem, 7vw, 6rem);
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {
  margin: 0;
  min-height: 100%;
  font-family: "Avenir Next", "Avenir", "Segoe UI", sans-serif;
  color: var(--foreground);
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.92), transparent 40%),
    radial-gradient(circle at right top, rgba(182, 83, 37, 0.08), transparent 22%),
    linear-gradient(180deg, #f8f2e8, #f1e8da 52%, #e8ddcf);
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

.siteBody {
  min-height: 100vh;
  overflow-x: hidden;
}

.pageHeader,
.pageFooter,
.pageArea {
  padding-inline: var(--page-pad);
}

.pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding-block: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.pageFooter {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem 2rem;
  padding-block: 1.35rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.9375rem;
  line-height: 1.75;
}

.pageMain {
  display: grid;
}

.pageArea {
  padding-block: var(--section-gap);
}

.pageAreaInner {
  margin-inline: auto;
  display: grid;
  gap: 3rem;
  width: var(--page-width);
}

.pageHero {
  border-block: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.9), rgba(242, 232, 218, 0.94));
}

.pageGridTwo {
  display: grid;
  gap: 2rem;
}

.pageNav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: center;
}

.pageNavLink {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.pageNavLink[aria-current="page"] {
  color: var(--foreground);
}

.pageEyebrow {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--secondary);
}

.pageLead,
.pageLeadSm,
.pageSectionCopy,
.pageFigureCaption,
.pageRowCopy {
  color: var(--muted);
}

.pageLead,
.pageSectionCopy,
.pageLeadSm {
  line-height: 2;
}

.pageHeroTitle,
.pageSectionTitle,
.pageRowTitle {
  margin: 0;
  color: var(--foreground);
  letter-spacing: -0.05em;
}

.pageHeroTitle {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: clamp(3.2rem, 6vw, 6.3rem);
  line-height: 0.92;
}

.pageSectionTitle {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 0.98;
}

.pageButtonPrimary,
.pageButtonSecondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.875rem 1.25rem;
  font-size: 0.9375rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pageButtonPrimary {
  background: var(--primary);
  color: #ffffff;
}

.pageButtonSecondary {
  border: 1px solid rgba(32, 77, 102, 0.16);
  background: rgba(255, 255, 255, 0.7);
  color: var(--secondary);
}

.pageButtonPrimary:hover,
.pageButtonSecondary:hover,
.pageNavLink:hover {
  transform: translateY(-2px);
}

.pageFigure {
  display: grid;
  gap: 0.75rem;
}

.pageFigureFrame {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 2.125rem;
  background: #e8dccd;
  box-shadow: var(--shadow);
}

.pageFigureFrame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pageFigureCaption {
  font-size: 0.82rem;
  line-height: 1.5;
}

.pageSection {
  display: grid;
  gap: 2rem;
}

.pageRow {
  display: grid;
  gap: 0.5rem;
  padding-block: 1.25rem;
  border-top: 1px solid var(--border);
}

.pageRowIndex {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--secondary);
}

.pageRowTitle {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: 1.1rem;
  line-height: 1.3;
}

.heroStack {
  display: grid;
  gap: 1.4rem;
}

.heroActions,
.pageActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.contentCard {
  display: grid;
  gap: 1rem;
}

.contentCard + .contentCard {
  margin-top: 1.25rem;
}

.adminNote {
  max-width: 64ch;
}

@media (min-width: 960px) {
  .pageGridTwo {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  .pageSection[data-section="manifesto"],
  .pageSection[data-section="workflow"] {
    grid-template-columns: 0.92fr 1.08fr;
  }

  .pageSection[data-section="structure"] {
    grid-template-columns: 0.96fr 1.04fr;
  }
}

@media (max-width: 767px) {
  .pageHeader,
  .pageFooter {
    gap: 1rem;
  }

  .pageHeroTitle {
    font-size: clamp(2.8rem, 14vw, 4.2rem);
  }
}
`;

function baseHtml({ title, bodyClass = "siteBody", body, stylesHref = "./styles.css" }) {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Northstar Studio の公開プレビュー" />
    <title>${title}</title>
    <link rel="stylesheet" href="${stylesHref}" />
  </head>
  <body class="${bodyClass}">
    ${body}
  </body>
</html>
`;
}

function pageShell({
  active,
  assetPrefix = "./",
  navPrefix = "./",
  stylesHref = "./styles.css",
  title,
  eyebrow,
  lead,
  ctaPrimary,
  ctaSecondary,
  heroImage,
  heroCaption,
  sections,
}) {
  const nav = [
    { href: `${navPrefix}`, label: "ホーム" },
    { href: `${navPrefix}services/`, label: "サービス" },
    { href: `${navPrefix}admin/`, label: "お問い合わせ" },
  ]
    .map(
      (item) => `<a class="pageNavLink" href="${item.href}"${active === item.href ? ' aria-current="page"' : ""}>${item.label}</a>`,
    )
    .join("");

  return baseHtml({
    title,
    stylesHref,
    body: `
      <header class="pageHeader">
        <div class="heroStack">
          <p class="pageEyebrow">Northstar Studio Co., Ltd.</p>
          <strong>Brand Direction & Web Design</strong>
        </div>
        <nav aria-label="Primary" class="pageNav">${nav}</nav>
      </header>
      <main class="pageMain">
        <section class="pageArea pageHero">
          <div class="pageAreaInner pageGridTwo">
            <div class="heroStack">
              <p class="pageEyebrow">${eyebrow}</p>
              <div class="heroStack">
                <h1 class="pageHeroTitle">${title}</h1>
                <p class="pageLead">${lead}</p>
              </div>
              <div class="heroActions">
                <a class="pageButtonPrimary" href="${ctaPrimary.href}">${ctaPrimary.label}</a>
                <a class="pageButtonSecondary" href="${ctaSecondary.href}">${ctaSecondary.label}</a>
              </div>
            </div>
            <figure class="pageFigure">
              <div class="pageFigureFrame">
                <img alt="${heroImage.alt}" src="${heroImage.src}" />
              </div>
              <figcaption class="pageFigureCaption">${heroCaption}</figcaption>
            </figure>
          </div>
        </section>
        ${sections}
      </main>
      <footer class="pageFooter">
        <p>Northstar Studio Co., Ltd. は、ブランドとWeb体験を丁寧に設計するデザインスタジオです。</p>
        <p>掲載写真はイメージです。実際の素材に合わせて柔軟に更新できます。</p>
      </footer>
    `,
  });
}

function homePage() {
  const assetPrefix = "./";
  const sections = `
    <section class="pageArea" data-section="manifesto">
      <div class="pageAreaInner pageSection">
        <div class="heroStack">
          <p class="pageEyebrow">MANIFESTO</p>
          <h2 class="pageSectionTitle">一つひとつの情報に、意味を持たせる。</h2>
          <p class="pageSectionCopy">会社の価値観や姿勢を、短い文章でまっすぐ伝えます。</p>
        </div>
        <div class="pageGridTwo">
          <figure class="pageFigure">
            <div class="pageFigureFrame">
              <img alt="事業紹介のイメージ写真" src="${assetPrefix}images/picsum/004.jpg" />
            </div>
          </figure>
          <p class="pageLead">企業の第一印象は、事業内容だけでなく、文章の温度や画面の余白にも表れます。だからこそ私たちは、読みやすさと落ち着きを大切にした構成を提案しています。</p>
        </div>
      </div>
    </section>
    <section class="pageArea" data-section="structure">
      <div class="pageAreaInner pageSection">
        <div class="heroStack">
          <p class="pageEyebrow">STRUCTURE</p>
          <h2 class="pageSectionTitle">事業の特徴を、章立てでわかりやすく。</h2>
          <p class="pageSectionCopy">サービスの流れが追いやすいよう、章ごとに情報を整理しています。</p>
        </div>
        <div>
          <article class="pageRow">
            <p class="pageRowIndex">01</p>
            <div>
              <h3 class="pageRowTitle">ブランドの印象を整える</h3>
              <p class="pageRowCopy">言葉、写真、余白のバランスを見直し、伝わり方を丁寧に整えます。</p>
            </div>
          </article>
          <article class="pageRow">
            <p class="pageRowIndex">02</p>
            <div>
              <h3 class="pageRowTitle">日々の運用を支える</h3>
              <p class="pageRowCopy">更新のしやすさを意識した設計で、情報発信を無理なく続けられます。</p>
            </div>
          </article>
          <article class="pageRow">
            <p class="pageRowIndex">03</p>
            <div>
              <h3 class="pageRowTitle">長く使える構成にする</h3>
              <p class="pageRowCopy">必要な情報を整理して、事業の変化にも対応しやすい土台をつくります。</p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <section class="pageArea" data-section="workflow">
      <div class="pageAreaInner pageSection">
        <div class="heroStack">
          <p class="pageEyebrow">WORKFLOW</p>
          <h2 class="pageSectionTitle">日常の更新まで見据えた設計。</h2>
          <p class="pageSectionCopy">更新しやすい構成は、継続的な情報発信と信頼の積み重ねにつながります。</p>
        </div>
        <div class="contentCard">
          <p class="pageLeadSm adminNote">案件ごとに情報量や見せ方を調整しながら、公開後の運用まで無理なく続けられるサイトを整えます。</p>
          <div class="pageActions">
            <a class="pageButtonPrimary" href="${assetPrefix}services/">事業内容を見る</a>
            <a class="pageButtonSecondary" href="${assetPrefix}admin/">会社案内</a>
          </div>
        </div>
      </div>
    </section>
  `;

  return pageShell({
    active: "./",
    assetPrefix,
    navPrefix: "./",
    stylesHref: "./styles.css",
    ctaPrimary: { href: "./services/", label: "事業内容を見る" },
    ctaSecondary: { href: "./admin/", label: "会社案内" },
    eyebrow: "Company Profile",
    heroCaption: "写真はイメージです。事業に合わせて、実際の製品、店舗、オフィス、人物写真へ差し替えられます。",
    heroImage: { alt: "ブランドイメージの写真", src: "./images/picsum/002.jpg" },
    lead:
      "私たちは、ブランドの魅力がまっすぐ届くウェブ体験をつくるデザインスタジオです。事業の背景や価値観を丁寧に言葉へ落とし込み、読みやすく印象に残るサイトへ整えます。",
    sections,
    title: "企業の個性を、静かな強さで伝える。",
  });
}

function servicesPage() {
  const assetPrefix = "../";
  const sections = `
    <section class="pageArea" data-section="capabilities">
      <div class="pageAreaInner pageSection">
        <div class="heroStack">
          <p class="pageEyebrow">Capabilities</p>
          <h2 class="pageSectionTitle">ご相談いただくことの多い内容</h2>
          <p class="pageSectionCopy">立ち上げ前の整理から、公開後の運用改善まで、段階に応じて伴走します。</p>
        </div>
        <div class="pageGridTwo">
          <article class="contentCard">
            <h3 class="pageRowTitle">Brand Strategy</h3>
            <p class="pageRowCopy">企業のらしさを整理し、伝える順番と見せ方を設計します。</p>
          </article>
          <article class="contentCard">
            <h3 class="pageRowTitle">Web Design</h3>
            <p class="pageRowCopy">情報の流れと余白を整え、読みやすく印象に残る画面に仕上げます。</p>
          </article>
          <article class="contentCard">
            <h3 class="pageRowTitle">Content Support</h3>
            <p class="pageRowCopy">文章、写真、導線の見直しを通じて、更新しやすい状態を保ちます。</p>
          </article>
        </div>
      </div>
    </section>
  `;

  return pageShell({
    active: "../services/",
    assetPrefix,
    navPrefix: "../",
    stylesHref: "../styles.css",
    ctaPrimary: { href: "../", label: "ホームへ戻る" },
    ctaSecondary: { href: "../admin/", label: "会社案内" },
    eyebrow: "Services",
    heroCaption: "公開の目的に応じて、構成と文章を整理し、全体の印象を揃えます。",
    heroImage: { alt: "サービス紹介のイメージ写真", src: `${assetPrefix}images/picsum/004.jpg` },
    lead:
      "企業紹介、採用、実績、問い合わせまで、目的の違うページでも一貫した印象になるように構成と文章を整えます。",
    sections,
    title: "事業の輪郭を、ことばと余白で整える。",
  });
}

function adminPage() {
  return baseHtml({
    title: "Northstar Studio | Admin Preview",
    stylesHref: "../styles.css",
    body: `
      <main class="pageMain">
        <section class="pageArea">
          <div class="pageAreaInner">
            <div class="heroStack">
              <p class="pageEyebrow">Agent Driven CMS</p>
              <h1 class="pageHeroTitle" style="font-size: clamp(2.2rem, 4vw, 4.4rem);">公開プレビューでは、管理ビューを静的表示に切り替えています。</h1>
              <p class="pageLead adminNote">GitHub Pages はサーバー側の bridge API を実行できないため、この環境では状態確認 UI ではなく、公開用の説明ページを表示します。ローカル開発では従来どおり /admin から bridge 状態を確認できます。</p>
              <div class="pageActions">
                <a class="pageButtonPrimary" href="../">トップへ戻る</a>
                <a class="pageButtonSecondary" href="../services/">サービスを見る</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    `,
  });
}

async function writePage(relativePath, html) {
  const filePath = path.join(outDir, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html);
}

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await writeFile(path.join(outDir, "styles.css"), styles);
  await cp(imagesDir, path.join(outDir, "images", "picsum"), { recursive: true });
  await writePage("index.html", homePage());
  await writePage(path.join("services", "index.html"), servicesPage());
  await writePage(path.join("admin", "index.html"), adminPage());

  console.log(`GitHub Pages site written to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

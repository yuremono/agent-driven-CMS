---
name: clone-website
description: Reverse-engineer and clone one or more websites in one shot — extracts assets, CSS, and content section-by-section and proactively dispatches parallel builder agents in worktrees as it goes. Use this whenever the user wants to clone, replicate, rebuild, reverse-engineer, or copy any website. Also triggers on phrases like "make a copy of this site", "rebuild this page", "pixel-perfect clone". Provide one or more target URLs as arguments.
argument-hint: "<url1> [<url2> ...]"
user-invocable: true
---

# Website をクローンする

あなたはこれから **$ARGUMENTS** を pixel-perfect なクローンとして reverse-engineer し、再構築します。

複数の URL が与えられた場合は、それぞれのサイトを独立して処理し、可能な限り並列で進めてください。同時に、各サイトの抽出成果物は専用フォルダ（例: `docs/research/<hostname>/`）に分離して保持します。

これは「inspect してから build する」という二段階プロセスではありません。あなたは **現場を歩き回る foreman** です。ページの各 section を調べるたびに詳細な specification をファイルへ書き出し、その内容を必要な情報ごと specialist builder agent に渡します。抽出と構築は並列で進みますが、抽出は徹底的で、監査可能な成果物を残す必要があります。

## Scope Defaults

対象は `$ARGUMENTS` が解決するページです。その URL に表示されているものを正確にクローンします。ユーザーから別指定がない限り、以下を既定値とします。

- **Fidelity level:** Pixel-perfect。色、余白、タイポグラフィ、animation を正確に一致させる
- **In scope:** ビジュアル layout と styling、component structure と interactions、responsive design、demo 用の mock data
- **Out of scope:** 実際の backend / database、authentication、real-time features、SEO optimization、accessibility audit
- **Customization:** なし。純粋な emulation のみ

ユーザーが追加指示（特定の fidelity level、customization、追加コンテキストなど）を与えた場合は、これらの既定値よりそちらを優先してください。

## Pre-Flight

1. **Browser automation は必須です。** 利用可能な browser MCP tools（agent-browser(推奨)、Chrome MCP、Playwright MCP、Browserbase MCP、Puppeteer MCP など）を確認してください。複数使える場合は Chrome MCP を優先します。何も見つからない場合は、どの browser tool を持っていて、どう接続するかをユーザーに確認してください。この skill は browser automation なしでは機能しません。
2. `$ARGUMENTS` を 1 つ以上の URL として解釈します。各 URL を normalize・validate し、無効な URL があれば先へ進む前に修正を依頼してください。各 valid URL について、browser MCP tool 経由でアクセス可能であることを確認します。
3. ベース project が build できることを確認します: `npm run build`。Next.js + shadcn/ui + Tailwind v4 の scaffold はあらかじめ用意されている前提です。そうでなければ、先にセットアップするようユーザーへ伝えてください。
4. 出力ディレクトリがなければ作成します: `docs/research/`、`docs/research/components/`、`docs/design-references/`、`scripts/`。複数サイトを扱う場合は `docs/research/<hostname>/` や `docs/design-references/<hostname>/` のようなサイト別フォルダも用意します。
5. 複数サイトを 1 回の command で処理する場合は、必要に応じて並列実行（推奨。リソースに余裕がある場合）にするか、過負荷回避のため逐次実行にするかを確認します。

## Guiding Principles

これらは、成功するクローンと「近いけど違う」粗い出来のクローンを分ける原則です。必ず腹落ちさせて、すべての判断に反映してください。

### 1. Completeness Beats Speed

すべての builder agent は、仕事を完璧にこなすために必要な **すべて** を受け取らなければなりません。screenshot、正確な CSS 値、ローカル path 付きのダウンロード済み asset、実際の text content、component structure。それらが欠けた状態で builder が色、font size、padding などを推測しなければならないなら、抽出は失敗です。不完全な brief を渡すくらいなら、追加で 1 つ property を抜くために 1 分使ってください。

### 2. Small Tasks, Perfect Results

agent に「features section 全体を build して」と渡すと、細部を雑に扱います。余白を近似し、font size を推測し、「だいたい合っている」けれど明らかに違うものを作ります。単一の焦点化された component と、その exact な CSS 値を渡したときに限って、きれいに再現できます。

各 section を見て、その複雑さを判断してください。見出しと button だけの単純な banner なら 1 agent。3 種類の異なる card variant があり、それぞれ固有の hover state と内部 layout を持つ複雑な section なら、card variant ごとに 1 agent、さらに section wrapper 用に 1 agent が必要です。迷ったら小さく分けてください。

**Complexity budget rule:** builder prompt の specification が約 150 行を超えるなら、その section は 1 agent には複雑すぎます。より小さい単位に分解してください。これは機械的な基準であり、「でも全部関連しているから」という理屈で上書きしてはいけません。

### 3. Real Content, Real Assets

live site から実際の text、images、videos、SVGs を抽出してください。これは mockup ではなく clone です。`element.textContent` を使い、すべての `<img>` と `<video>` をダウンロードし、inline の `<svg>` 要素を React components として抽出します。content を生成してよいのは、明らかに server-generated で session ごとに一意なものだけです。

**Layered assets は重要です。** 1 枚の image に見える section でも、実際には複数レイヤーで構成されていることがよくあります。background の watercolor / gradient、前景の UI mockup PNG、overlay icon などです。各 container の DOM tree 全体を調べ、その中のすべての `<img>` と background image、さらに absolute positioning された overlay も漏れなく列挙してください。overlay image を 1 つ落とすだけで、background が合っていても clone は急にスカスカに見えます。

### 4. Foundation First

foundation が整うまで何も build できません。対象サイトの design token（colors、fonts、spacing）を持つ global CSS、content structure 用の TypeScript types、global assets（fonts、favicons）が必要です。ここは逐次で進める必要があり、交渉の余地はありません。その後の工程は並列で進められます。

### 5. Extract How It Looks AND How It Behaves

website は screenshot ではなく、生きたものです。要素は scroll、hover、click、resize、時間の経過に応じて動き、変化し、現れたり消えたりします。各要素の static CSS だけを抜いても、screenshot 上は正しく見えても、実際に触ると死んだ clone になります。

各要素について、**見た目**（`getComputedStyle()` による exact な computed CSS）と **振る舞い**（何が変化し、それを何が trigger し、transition がどう進むか）の両方を抽出してください。「16px っぽい」ではなく実際の computed value を取ること。「scroll で nav が変わる」ではなく、exact な trigger（scroll position、IntersectionObserver threshold、viewport intersection）、before / after の状態（両方の CSS 値）、transition の内容（duration、easing、CSS transition か JS-driven か CSS `animation-timeline` か）を記録すること。

観察すべき振る舞いの例を挙げます。これは例示であり、これ以外がないという意味ではありません。ページ独自の挙動も必ず拾ってください。
- 一定以上 scroll すると縮小したり、background が変わったり、shadow が付いたりする navbar
- 要素が viewport に入ると animate-in する挙動（fade-up、slide-in、stagger delay など）
- `scroll-snap-type` によって scroll に吸着する section
- scroll 速度と異なるレートで動く parallax layer
- hover state が animate する要素（単なる変化ではなく、transition duration と easing も重要）
- enter / exit animation を伴う dropdown、modal、accordion
- scroll-driven の progress indicator や opacity transition
- auto-play する carousel や自動切り替えされる content
- page section 間で発生する dark-to-light（または他の theme）transition
- **循環する tabbed / pill content**。button によって表示 card 群が切り替わり、transition を伴うもの
- **scroll-driven の tab / accordion switching**。click handler ではなく、content の scroll 通過に応じて active item が自動で切り替わる sidebar
- **Smooth scroll libraries**（Lenis、Locomotive Scroll）。`.lenis` class や scroll container wrapper を確認すること

### 6. Identify the Interaction Model Before Building

クローン作業で最も高くつくミスはここです。元が scroll-driven なのに click-based UI を作る、あるいはその逆をやることです。interactive な section の builder prompt を書く前に、必ず次の問いに答えられなければなりません。**この section は click、scroll、hover、time、あるいはその組み合わせのどれで駆動しているか。**

判断方法:
1. **最初に click しない。** section をゆっくり scroll して、scroll に応じて自然に何かが変化するか観察します。
2. 変化するなら、それは scroll-driven です。仕組みも抽出してください。`IntersectionObserver`、`scroll-snap`、`position: sticky`、`animation-timeline`、あるいは JS の scroll listener かを記録します。
3. scroll で何も変わらないなら、そこで初めて click / hover で interactivity を検証します。
4. component spec に interaction model を明示します: 「INTERACTION MODEL: scroll-driven with IntersectionObserver」や「INTERACTION MODEL: click-to-switch with opacity transition」のように書きます。

sticky sidebar と scroll する content panel を持つ section は、click で内容が切り替わる tabbed interface とは本質的に別物です。ここを誤ると CSS の微調整では済まず、全面的な作り直しになります。

### 7. Extract Every State, Not Just the Default

多くの component には複数の visual state があります。tab bar によって表示 card が変わる、header が scroll position 0 と 100 で異なる、card に hover effect がある、などです。ページ読み込み時に見えている default state だけでなく、**すべての state** を抽出してください。

tabbed / stateful content の場合:
- browser MCP で各 tab / button を click する
- **各 state ごとに** content、images、card data を抽出する
- どの content がどの state に属するかを記録する
- state 間の transition animation（opacity、slide、fade など）を記録する

scroll-dependent な要素の場合:
- scroll position 0 の時点で computed styles を capture する（initial state）
- trigger threshold を超えるまで scroll し、同じ要素の computed styles を再取得する（scrolled state）
- 2 つを diff し、どの CSS properties が変化するかを特定する
- transition CSS（duration、easing、properties）を記録する
- exact な trigger threshold（px 単位の scroll position、または viewport intersection ratio）を記録する

### 8. Spec Files Are the Source of Truth

すべての component には、builder を dispatch する **前に** `docs/research/components/` 配下の specification file が必要です。この file は、あなたの抽出作業と builder agent の間の契約書です。builder には、その spec file の内容を prompt に inline で渡します。同時に、その file 自体も後から確認可能な監査成果物として残ります。

spec file は任意ではありません。あると便利、ではありません。spec file を書かずに builder を dispatch するのは、browser MCP session で覚えている断片だけを頼りに不完全な instructions を出荷するのと同じです。builder は不足分を推測で埋めるしかなくなります。

### 9. Build Must Always Compile

すべての builder agent は、作業完了前に `npx tsc --noEmit` が通ることを確認しなければなりません。worktree を merge した後は、あなたが `npm run build` を確認します。一時的であっても build が壊れている状態は許容されません。

## Phase 1: Reconnaissance

browser MCP で target URL に移動します。

### Screenshots
- desktop（1440px）と mobile（390px）の viewport で **full-page screenshot** を撮る
- `docs/design-references/` に説明的な名前で保存する
- これが master reference です。あとで builder には section ごとの crop / screenshot を渡します

### Global Extraction

何より先に、ページ全体から次を抽出してください。

**Fonts**。Google Fonts や self-hosted fonts の `<link>` tags を inspect します。主要要素（headings、body、code、labels）の computed `font-family` を確認し、実際に使われている family、weight、style をすべて記録します。`src/app/layout.tsx` では `next/font/google` または `next/font/local` を使って設定してください。

**Colors**。ページ全体の computed styles から site の color palette を抽出します。`src/app/globals.css` の `:root` と `.dark` CSS variable blocks を対象サイトの実色で更新してください。shadcn の token 名（background、foreground、primary、muted など）に対応づけられるものは対応づけ、収まらない色は custom property を追加します。

**Favicons & Meta**。favicons、apple-touch-icons、OG images、webmanifest を `public/seo/` にダウンロードし、`layout.tsx` の metadata を更新します。

**Global UI patterns**。site 全体に効いている CSS / JS を見つけます。custom scrollbar hiding、page container の scroll-snap、global keyframe animations、overlay に使われる gradients、**smooth scroll libraries**（Lenis、Locomotive Scroll。`.lenis`、`.locomotive-scroll`、custom scroll container classes を確認）などです。必要なものは `globals.css` に追加し、install が必要な library も記録します。

### Mandatory Interaction Sweep

これは screenshot の **後**、他の作業の **前** に行う専用の pass です。目的は、そのページ上のあらゆる振る舞いを発見することです。静的 screenshot では見えないものが多くあります。

**Scroll sweep:** browser MCP でページを上から下へゆっくり scroll し、各 section で止まって観察します。
- header の見た目は変わるか。trigger する scroll position を記録する
- 要素は viewport 進入時に animate-in するか。対象と animation type を記録する
- sidebar や tab indicator は scroll に応じて自動切替されるか。仕組みを記録する
- scroll-snap point はあるか。対象 container を記録する
- smooth scroll library は有効か。native でない scroll 挙動を確認する

**Click sweep:** interactive に見える要素はすべて click します。
- すべての button、tab、pill、link、card
- 何が起きるかを記録する。content が変わるのか、modal が開くのか、dropdown が出るのか
- tab / pill については、**すべて** click し、各 state で表示される content を記録する

**Hover sweep:** hover state を持ちそうな要素はすべて hover します。
- button、card、link、image、nav item
- 色、scale、shadow、underline、opacity など何が変化するかを記録する

**Responsive sweep:** browser MCP で 3 つの viewport 幅を試します。
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px
- 各幅で、どの section の layout が変わるか（column → stack、sidebar が消えるなど）と、おおよその breakpoint を記録する

発見した内容は `docs/research/BEHAVIORS.md` に保存します。これは behavior の bible です。各 component spec を書くときに必ず参照してください。

### Page Topology

ページを上から下まで見て、distinct な section をすべて洗い出し、作業用の名前を付けます。以下を記録してください。
- visual 上の順序
- fixed / sticky な overlay と通常の flow content の区別
- page 全体の layout（scroll container、column structure、z-index layers）
- section 間の依存関係（例: すべての上に重なる floating nav）
- 各 section の **interaction model**（static、click-driven、scroll-driven、time-driven）

これを `docs/research/PAGE_TOPOLOGY.md` として保存します。以後の組み立て図になります。

## Phase 2: Foundation Build

ここは逐次処理です。多くの files をまたぐため、agent へ delegate せず自分でやってください。

1. `layout.tsx` の fonts を、対象サイトの実際の fonts に合わせて更新する
2. `globals.css` を、対象サイトの color tokens、spacing 値、keyframe animations、utility classes、**global scroll behaviors**（Lenis、smooth scroll CSS、body の scroll-snap など）で更新する
3. 観測した content structures に対応する TypeScript interfaces を `src/types/` に作成する
4. SVG icons を抽出する。ページ上の inline `<svg>` 要素をすべて見つけ、重複を除去し、`src/components/icons.tsx` に名前付き React components として保存する。名前は見た目の役割で付ける（例: `SearchIcon`、`ArrowRightIcon`、`LogoIcon`）
5. global assets をダウンロードする。ページ上のすべての image、video、その他 binary assets を `public/` にダウンロードする Node.js script（`scripts/download-assets.mjs`）を書いて実行する。意味のある directory structure を維持する
6. 確認: `npm run build` が通ること

### Asset Discovery Script Pattern

browser MCP を使って、ページ上のすべての assets を列挙します。

```javascript
// Run this via browser MCP to discover all assets
JSON.stringify({
  images: [...document.querySelectorAll('img')].map(img => ({
    src: img.src || img.currentSrc,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    // Include parent info to detect layered compositions
    parentClasses: img.parentElement?.className,
    siblings: img.parentElement ? [...img.parentElement.querySelectorAll('img')].length : 0,
    position: getComputedStyle(img).position,
    zIndex: getComputedStyle(img).zIndex
  })),
  videos: [...document.querySelectorAll('video')].map(v => ({
    src: v.src || v.querySelector('source')?.src,
    poster: v.poster,
    autoplay: v.autoplay,
    loop: v.loop,
    muted: v.muted
  })),
  backgroundImages: [...document.querySelectorAll('*')].filter(el => {
    const bg = getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none';
  }).map(el => ({
    url: getComputedStyle(el).backgroundImage,
    element: el.tagName + '.' + el.className?.split(' ')[0]
  })),
  svgCount: document.querySelectorAll('svg').length,
  fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 200).map(el => getComputedStyle(el).fontFamily))],
  favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() }))
});
```

その後、すべてを `public/` へ取得する download script を書きます。並列数 4 件の batched parallel downloads と proper な error handling を使ってください。

## Phase 3: Component Specification & Dispatch

ここが中核の loop です。page topology の各 section を上から順に処理し、毎回 3 つのことを行います。**extract**、**spec file の作成**、そして **builder の dispatch** です。

### Step 1: Extract

各 section について、browser MCP を使って必要なものをすべて抽出します。

1. section 単体の **screenshot** を撮る。該当箇所まで scroll し、viewport を screenshot します。`docs/design-references/` に保存します。

2. section 内のすべての要素について **CSS を抽出** します。以下の extraction script を使ってください。個別に目測で property を測ってはいけません。component container ごとに 1 回実行し、full output を取得します。

```javascript
// Per-component extraction — run via browser MCP
// Replace SELECTOR with the actual CSS selector for the component
(function(selector) {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Element not found: ' + selector });
  const props = [
    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
    'textTransform','textDecoration','backgroundColor','background',
    'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'margin','marginTop','marginRight','marginBottom','marginLeft',
    'width','height','maxWidth','minWidth','maxHeight','minHeight',
    'display','flexDirection','justifyContent','alignItems','gap',
    'gridTemplateColumns','gridTemplateRows',
    'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
    'boxShadow','overflow','overflowX','overflowY',
    'position','top','right','bottom','left','zIndex',
    'opacity','transform','transition','cursor',
    'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
    'whiteSpace','textOverflow','WebkitLineClamp'
  ];
  function extractStyles(element) {
    const cs = getComputedStyle(element);
    const styles = {};
    props.forEach(p => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v; });
    return styles;
  }
  function walk(element, depth) {
    if (depth > 4) return null;
    const children = [...element.children];
    return {
      tag: element.tagName.toLowerCase(),
      classes: element.className?.toString().split(' ').slice(0, 5).join(' '),
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 200) : null,
      styles: extractStyles(element),
      images: element.tagName === 'IMG' ? { src: element.src, alt: element.alt, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight } : null,
      childCount: children.length,
      children: children.slice(0, 20).map(c => walk(c, depth + 1)).filter(Boolean)
    };
  }
  return JSON.stringify(walk(el, 0), null, 2);
})('SELECTOR');
```

3. **multi-state styles** を抽出します。複数 state を持つ要素（scroll-triggered、hover、active tab など）については、両方の state を必ず capture します。

```javascript
// State A: capture styles at current state (e.g., scroll position 0)
// Then trigger the state change (scroll, click, hover via browser MCP)
// State B: re-run the extraction script on the same element
// The diff between A and B IS the behavior specification
```

差分は明示的に記録してください。例: 「Property X は VALUE_A から VALUE_B に変化し、TRIGGER によって発火し、transition は TRANSITION_CSS である」。

4. **実コンテンツを抽出** します。すべての text、alt attributes、aria labels、placeholder text を取得してください。各 text node には `element.textContent` を使います。tabbed / stateful content では、**各 tab を click して state ごとの content を抽出** してください。

5. この section が使う **assets を特定** します。`public/` にダウンロードした image / video、`icons.tsx` のどの icon component を使うかを整理してください。**layered images**（同一 container に重なった複数の `<img>` や background-image）も確認します。

6. **複雑さを評価** します。この section にはいくつ distinct な sub-component があるかを判断してください。distinct な sub-component とは、独自の styling、structure、behavior を持つ要素（例: card、nav item、search panel）のことです。

### Step 2: Write the Component Spec File

各 section（必要なら sub-component 単位に分割したもの）について、`docs/research/components/` に spec file を作成します。これは **必須** です。すべての builder に対応する spec file が必要です。

**File path:** `docs/research/components/<component-name>.spec.md`

**Template:**

```markdown
# <ComponentName> Specification

## Overview
- **Target file:** `src/components/<ComponentName>.tsx`
- **Screenshot:** `docs/design-references/<screenshot-name>.png`
- **Interaction model:** <static | click-driven | scroll-driven | time-driven>

## DOM Structure
<Describe the element hierarchy — what contains what>

## Computed Styles (exact values from getComputedStyle)

### Container
- display: ...
- padding: ...
- maxWidth: ...
- (every relevant property with exact values)

### <Child element 1>
- fontSize: ...
- color: ...
- (every relevant property)

### <Child element N>
...

## States & Behaviors

### <Behavior name, e.g., "Scroll-triggered floating mode">
- **Trigger:** <exact mechanism — scroll position 50px, IntersectionObserver rootMargin "-30% 0px", click on .tab-button, hover>
- **State A (before):** maxWidth: 100vw, boxShadow: none, borderRadius: 0
- **State B (after):** maxWidth: 1200px, boxShadow: 0 4px 20px rgba(0,0,0,0.1), borderRadius: 16px
- **Transition:** transition: all 0.3s ease
- **Implementation approach:** <CSS transition + scroll listener | IntersectionObserver | CSS animation-timeline | etc.>

### Hover states
- **<Element>:** <property>: <before> → <after>, transition: <value>

## Per-State Content (if applicable)

### State: "Featured"
- Title: "..."
- Subtitle: "..."
- Cards: [{ title, description, image, link }, ...]

### State: "Productivity"
- Title: "..."
- Cards: [...]

## Assets
- Background image: `public/images/<file>.webp`
- Overlay image: `public/images/<file>.png`
- Icons used: <ArrowIcon>, <SearchIcon> from icons.tsx

## Text Content (verbatim)
<All text content, copy-pasted from the live site>

## Responsive Behavior
- **Desktop (1440px):** <layout description>
- **Tablet (768px):** <what changes — e.g., "maintains 2-column, gap reduces to 16px">
- **Mobile (390px):** <what changes — e.g., "stacks to single column, images full-width">
- **Breakpoint:** layout switches at ~<N>px
```

すべての section を埋めてください。もし section に当てはまらない項目があっても（たとえば static な footer で states がないなど）、`N/A` と書いて埋めてください。ただし、States & Behaviors を `N/A` にする前には本当に該当しないかをもう一度疑ってください。footer であっても link の hover state はありえます。

### Step 3: Dispatch Builders

複雑さに応じて、builder agent を worktree 付きで dispatch します。

**Simple section**（1〜2 sub-components）の場合: section 全体を 1 builder agent に渡します。

**Complex section**（3 つ以上の distinct sub-components）の場合: 分割します。sub-component ごとに 1 agent を割り当て、加えてそれらを import する section wrapper 用に 1 agent を割り当てます。wrapper は sub-component へ依存するため、先に sub-component builders を動かします。

**すべての builder agent に渡す内容:**
- 対応する component spec file の全文（prompt に inline で渡すこと。「spec file を読んで」は不可）
- section screenshot の path（`docs/design-references/`）
- import すべき shared components（`icons.tsx`、`cn()`、shadcn primitives）
- target file path（例: `src/components/HeroSection.tsx`）
- 完了前に `npx tsc --noEmit` を通すよう指示
- responsive behavior のための具体的な breakpoint 値と変化内容

**待たないこと。** 1 つの section について builder を dispatch したら、すぐ次の section の抽出に移ってください。builder たちは各 worktree で並列に作業し、その間あなたは抽出を続けます。

### Step 4: Merge

builder agents が作業を終えたら:
- それぞれの worktree branch を main に merge する
- 各 agent が何を build したかの文脈はあなたが持っているので、conflict は文脈に基づいて賢く解決する
- merge のたびに `npm run build` を確認し、build がまだ通ることを確かめる
- merge によって type error が出たら、その場で直す

この extract → spec → dispatch → merge の cycle を、すべての section が build されるまで続けます。

## Phase 4: Page Assembly

すべての section が build・merge されたら、`src/app/page.tsx` でページ全体を接続します。

- すべての section components を import する
- topology doc に従って page-level layout（scroll containers、column structures、sticky positioning、z-index layering）を実装する
- 実コンテンツを component props に接続する
- page-level behaviors を実装する。scroll snap、scroll-driven animations、dark-to-light transitions、intersection observers、smooth scroll（Lenis など）を含む
- 確認: `npm run build` が clean に通ること

## Phase 5: Visual QA Diff

組み上げたからといって、そこで clone 完了と宣言してはいけません。side-by-side comparison screenshots を取って確認します。

1. 元サイトとあなたの clone を並べて開く（または同じ viewport 幅で screenshot を撮る）
2. desktop（1440px）で section ごとに上から下まで比較する
3. mobile（390px）でも同様に比較する
4. 差異が見つかったら毎回:
   - component spec file を確認する。値の抽出自体が間違っていないか
   - spec が間違っていたら、browser MCP で再抽出し、spec を更新して component を修正する
   - spec は正しいのに builder が間違えたなら、spec に合わせて component を修正する
5. すべての interactive behavior をテストする。ページを scroll し、すべての button / tab を click し、interactive elements に hover する
6. smooth scroll の感触、header transition、tab switching、animations の再生が正しいか確認する

この visual QA pass を終えて初めて、その clone は完成です。

## Pre-Dispatch Checklist

**ANY** builder agent を dispatch する前に、以下をすべて満たしていることを確認してください。1 つでも満たせないなら、抽出へ戻って情報を増やします。

- [ ] `docs/research/components/<name>.spec.md` に spec file を書き、すべての section が埋まっている
- [ ] spec の CSS 値はすべて `getComputedStyle()` 由来であり、推定値ではない
- [ ] interaction model が特定され、文書化されている（static / click / scroll / time）
- [ ] stateful component では、すべての state の content と styles を取得している
- [ ] scroll-driven component では、trigger threshold、before / after styles、transition が記録されている
- [ ] hover state では、before / after の値と transition timing が記録されている
- [ ] section 内の全画像が特定されている（overlay や layered compositions を含む）
- [ ] 少なくとも desktop と mobile の responsive behavior が文書化されている
- [ ] text content はサイトの verbatim であり、意訳していない
- [ ] builder prompt は約 150 行未満である。超えるなら section を分割する必要がある

## What NOT to Do

これらは過去の失敗した clone から得た教訓です。どれも数時間単位の手戻りを招きました。

- **元が scroll-driven なのに click-based tabs を build しないこと（逆も同様）。** まず scroll してから click し、interaction model を先に確定してください。これは最も高くつくミスです。CSS 修正では済まず、全面的な rewrite が必要になります。
- **default state しか抽出しないこと。** load 時に "Featured" が見えている tab があるなら、Productivity、Creative、Lifestyle も click して、それぞれの cards / content を抜いてください。header が scroll で変わるなら、position 0 と 100+ の両方で styles を capture します。
- **overlay / layered images を見落とさないこと。** background watercolor + foreground UI mockup は 2 枚の image です。各 container の DOM tree を見て、複数の `<img>` 要素と positioned overlays を確認してください。
- **実際は videos / animations なのに mockup component を build しないこと。** section が `<video>`、Lottie、canvas を使っていないか先に確認してから、video の見た目を HTML で作り込むような無駄を避けてください。
- **CSS classes を近似しないこと。** 「`text-lg` っぽい」は、computed value が `18px` で、`text-lg` が `18px/28px` でも実際の line-height が `24px` なら誤りです。exact な値を抽出してください。
- **すべてを 1 つの巨大な commit で build しないこと。** この pipeline の要点は、各段階で build を確認しながら incremental に進めることです。
- **builder prompt から docs を参照させないこと。** 各 builder には CSS spec を inline で渡します。「色は DESIGN_TOKENS.md を見て」は禁止です。builder は外部 docs を読む必要がない状態であるべきです。
- **asset extraction を省略しないこと。** 実画像、video、font がない限り、CSS がどれだけ正確でも clone は必ず偽物っぽく見えます。
- **1 人の builder agent に広すぎる scope を渡さないこと。** prompt が長くなり始めたら、それは section をさらに分割すべき合図です。
- **無関係な section を 1 agent にまとめないこと。** CTA section と footer は別 component であり、別 design です。まとめて渡して何とかなると期待しないでください。
- **responsive extraction を省略しないこと。** desktop 幅だけ見ていると、tablet と mobile で clone は壊れます。抽出時に 1440、768、390 を必ず確認してください。
- **smooth scroll library を忘れないこと。** Lenis（`.lenis` class）や Locomotive Scroll などを確認してください。default browser scrolling とは感触が明確に違い、ユーザーはすぐ気付きます。
- **Framer などの runtime を、Next 側で既に描画した DOM へ後付け注入しないこと。** hydrate mismatch や partial takeover が起きると、特定 section だけでなく無関係な animations まで止まります。runtime が必要なサイトは、完全HTMLをそのまま配信するか、挙動を React/Next で最初から再実装してください。
- **sticky / scroll 問題を、原因未確定のまま manual transform でごまかさないこと。** まず元サイトで computed style、ancestor の `overflow` / `transform`、scroll 後の style 変化を確認してください。症状だけを上書きすると、見かけ上は一部直っても他 animation を壊します。
- **クローンした root を、余計な app wrapper や overflow 制御で包まないこと。** `overflow-x-hidden`、独自の scroll container、親の `transform`、高さ固定 wrapper は sticky や scroll-driven animation の前提を崩します。特に Framer 系では、元 document にない祖先を足す前に本当に必要かを疑ってください。
- **spec file なしで builder を dispatch しないこと。** spec file は徹底した抽出を強制し、監査可能な成果物を残します。これを飛ばすと、builder はあなたの記憶を頼りにした不完全な prompt しか受け取れません。

## Completion

完了したら、以下を報告してください。
- build した section の総数
- 作成した component の総数
- 作成した spec file の総数（component 数と一致するのが望ましい）
- ダウンロードした assets の総数（images、videos、SVGs、fonts）
- build status（`npm run build` の結果）
- Visual QA の結果（残っている差異があれば明記）
- 既知の gap や limitation

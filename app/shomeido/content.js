import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const bodyPath = path.join(routeDir, "body.html");

export const siteTitle = "{#title}|株式会社正明堂";
export const siteDescription =
  "株式会社正明堂は、代々木駅徒歩3分の文房具・事務用品・はんこを取り扱うお店です。昭和28年創業以来、「真心でご奉仕」をモットーに、実印・銀行印などのはんこ制作や名刺・伝票印刷、テープ・ビデオのダビングサービスまで幅広く対応。大手通販サイトでは購入できない商品も取り扱い、地域の皆さまを丁寧にサポートしています。";
export const siteKeywords = [
  "株式会社正明堂",
  "代々木",
  "文房具",
  "事務用品",
  "ダビングサービス",
  "はんこ制作",
];

export const headerNavItems = [
  { href: "#products", label: "取扱商品" },
  { href: "#recommend", label: "イチオシ特集" },
  { href: "#hanko", label: "ハンコ制作" },
  { href: "#dubbing", label: "ダビングサービス" },
  { href: "#contact", label: "店舗案内" },
];

export const heroSlides = [
  { src: "/images/home/mv01.jpg", alt: "", className: "aspect-[16/10] object-cover" },
  { src: "/images/home/mv02.jpg", alt: "", className: "aspect-[16/10] object-cover" },
  { src: "/images/home/mv03.jpg", alt: "", className: "aspect-[16/10] object-cover" },
];

export const introCopy = {
  kicker: "70 Years in Yoyogi",
  headline: "代々木駅から徒歩3分、\n文房具・事務用品のことなら正明堂へ",
  body:
    "日常の筆記具から季節の便箋・封筒、最新文具、ビジネスを支える事務用品まで、多彩な文具を取りそろえております。店頭でのご相談はもちろん、用途に合わせたアイテム選びや、ちょっとしたマナーに関する疑問にも、経験豊かなスタッフが丁寧にお応えします。また長く愛される定番品も大切に扱っており、懐かしい文具との再会を楽しんでいただける品ぞろえです。どうぞお気軽にお立ち寄りください。",
};

export const productStrip = [
  { src: "/images/home/111.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/112.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/113.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/114.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/115.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/116.png", alt: "", width: 361, height: 160 },
];

export const coverStrip = [
  { src: "/images/home/221.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/222.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/223.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/224.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/225.png", alt: "", width: 270, height: 160 },
  { src: "/images/home/226.png", alt: "", width: 361, height: 160 },
];

export const serviceCards = [
  {
    id: "hanko",
    eyebrow: "SERVICE",
    title: "ハンコ制作",
    body: "実印・認印・銀行印・社判など、用途に合わせた印鑑の制作を承っています。",
    image: "/images/home/002.jpg",
    imageAlt: "ハンコ制作｜正明堂",
    cta: { href: "#hanko", label: "more" },
    accent: "gold",
  },
  {
    id: "dubbing",
    eyebrow: "SERVICE",
    title: "ダビングサービス",
    body: "カセットテープやCD、ビデオテープなど、大切な音や映像をデジタル化して残したい方へ。。",
    image: "/images/home/003.jpg",
    imageAlt: "カセットテープ・CD・ビデオテープのダビングサービス｜正明堂",
    cta: { href: "#dubbing", label: "more" },
    accent: "royal",
  },
];

export const featureCopy = {
  title: "店主のイチオシ商品特集",
  body: "「せっかく買うならちょっと良いものを使いたい」 そんな思いにお応えする、こだわりの詰まった文房具をご紹介。",
  image: "/images/home/vaimo80R_main-removebg-preview.png",
  imageAlt: "Vaimo80（バイモ80）｜正明堂",
  note: "2～80枚まで\n軽々とじられる\nホッチキス!",
  detail: "分厚い書類でも\n座ったまま片手で軽々とじられる！",
  cta: { href: "#recommend", label: "more" },
};

export const footerContact = {
  title: "CONTACT",
  subTitle: "お問い合わせ",
  tel: "03-3379-3388",
  fax: "03-3379-3295",
  address: "〒151-0053\n東京都渋谷区代々木1-54-1",
  hours: "営業時間　10:00～16:00　休業日　土・日・祝日",
  backgrounds: ["/images/home/bg00.jpg", "/images/home/bg01.jpg"],
  copyright: "© 2026 - 株式会社正明堂",
  navItems: [
    { href: "#top", label: "ホーム" },
    ...headerNavItems,
  ],
};

export const headerData = {
  logo: {
    src: "/images/home/logo.png",
    alt: "正明堂",
  },
  tel: "03-3379-3388",
  fax: "03-3379-3295",
  navItems: [
    { label: "取扱商品", href: "#products" },
    { label: "イチオシ特集", href: "#recommend" },
    { label: "ハンコ制作", href: "#hanko" },
    { label: "ダビングサービス", href: "#dubbing" },
    { label: "店舗案内", href: "#contact" },
  ],
};

export const heroData = {
  eyebrow: "70 Years in Yoyogi",
  lead: "代々木の街で70年変わらぬ品揃えの文房具店",
  slides: [
    { src: "/images/home/mv01.jpg", alt: "" },
    { src: "/images/home/mv02.jpg", alt: "" },
    { src: "/images/home/mv03.jpg", alt: "" },
  ],
  clipText: "代々木の街で70年変わらぬ品揃えの文房具店",
  introTitle: "代々木駅から徒歩3分、文房具・事務用品のことなら正明堂へ",
  introBody:
    "日常の筆記具から季節の便箋・封筒、最新文具、ビジネスを支える事務用品まで、多彩な文具を取りそろえております。店頭でのご相談はもちろん、用途に合わせたアイテム選びや、ちょっとしたマナーに関する疑問にも、経験豊かなスタッフが丁寧にお応えします。また長く愛される定番品も大切に扱っており、懐かしい文具との再会を楽しんでいただける品ぞろえです。どうぞお気軽にお立ち寄りください。",
};

export const productsData = {
  label: "PRODUCTS",
  description:
    "当店では、筆記用具をはじめ、事務用品から和文具まで、様々なアイテムを幅広く取りそろえています。",
  cta: { label: "取扱商品", href: "#products" },
  stripItems: [
    { src: "/images/home/111.png", alt: "" },
    { src: "/images/home/112.png", alt: "" },
    { src: "/images/home/113.png", alt: "" },
    { src: "/images/home/114.png", alt: "" },
    { src: "/images/home/115.png", alt: "" },
    { src: "/images/home/116.png", alt: "" },
  ],
  accentItems: [
    { src: "/images/home/221.png", alt: "" },
    { src: "/images/home/222.png", alt: "" },
    { src: "/images/home/223.png", alt: "" },
    { src: "/images/home/224.png", alt: "" },
    { src: "/images/home/225.png", alt: "" },
    { src: "/images/home/226.png", alt: "" },
  ],
};

export const serviceData = {
  label: "SERVICE",
  items: [
    {
      id: "hanko",
      title: "ハンコ制作",
      image: {
        src: "/images/home/002.jpg",
        alt: "ハンコ制作｜正明堂",
      },
      body: "実印・認印・銀行印・社判など、用途に合わせた印鑑の制作を承っています。",
      cta: { label: "more", href: "#hanko" },
      tone: "gold",
    },
    {
      id: "dubbing",
      title: "ダビングサービス",
      image: {
        src: "/images/home/003.jpg",
        alt: "カセットテープ・CD・ビデオテープのダビングサービス｜正明堂",
      },
      body: "カセットテープやCD、ビデオテープなど、大切な音や映像をデジタル化して残したい方へ。。",
      cta: { label: "more", href: "#dubbing" },
      tone: "royal",
    },
  ],
};

export const featureData = {
  label: "店主のイチオシ商品特集",
  body: "「せっかく買うならちょっと良いものを使いたい」 そんな思いにお応えする、こだわりの詰まった文房具をご紹介。",
  cta: { label: "more", href: "#recommend" },
  product: {
    src: "/images/home/vaimo80R_main-removebg-preview.png",
    alt: "Vaimo80（バイモ80）｜正明堂",
    copy: "2～80枚まで\n軽々とじられる\nホッチキス!",
    detail: "分厚い書類でも\n座ったまま片手で軽々とじられる！",
  },
};

export const footerData = {
  contact: {
    label: "CONTACT",
    title: "お問い合わせ",
    tel: "03-3379-3388",
    fax: "03-3379-3295",
    background: {
      primary: "/images/home/bg00.jpg",
      secondary: "/images/home/bg01.jpg",
    },
  },
  shop: {
    logo: {
      src: "/images/home/logo.png",
      alt: "正明堂",
    },
    address: "〒151-0053 東京都渋谷区代々木1-54-1",
    tel: "03-3379-3388",
    fax: "03-3379-3295",
    hours: "営業時間　10:00～16:00　休業日　土・日・祝日",
  },
  navItems: [
    { label: "ホーム", href: "#top" },
    { label: "取扱商品", href: "#products" },
    { label: "イチオシ特集", href: "#recommend" },
    { label: "ハンコ制作", href: "#hanko" },
    { label: "ダビングサービス", href: "#dubbing" },
    { label: "店舗案内", href: "#contact" },
  ],
};

export const stylesheetHrefs = [
  "/css/index_html.css",
  "/css/bxi.css",
  "/css/common_style.css",
  "/css/common.css",
  "/css/style.css",
  "https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/yakuhanjp@3.4.1/dist/css/yakuhanjp-narrow.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.2.0/magnific-popup.min.css",
  "https://unpkg.com/scroll-hint@1.1.10/css/scroll-hint.css",
  "/js/slick/slick.css",
  "/js/slick/slick-theme.css",
];

export const scriptSrcs = [
  "/js/jquery-3.7.1.min.js",
  "/js/jquery.magnific-popup.min.js",
  "/js/scroll-hint.js",
  "/js/slick/slick.min.js",
  "/js/budoux-ja.min.js",
  "/js/function.js",
  "/js/ajaxzip3.js",
  "/js/bxi.js",
  "/js/flipsnap.min.js",
];

export const bodyHtml = fs.readFileSync(bodyPath, "utf8").replace(/\s*<\/body>\s*$/i, "");

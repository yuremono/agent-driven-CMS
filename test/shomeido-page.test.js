import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  bodyHtml,
  featureCopy,
  footerContact,
  headerNavItems,
  heroSlides,
  introCopy,
  productStrip,
  serviceCards,
  scriptSrcs,
  siteDescription,
  siteKeywords,
  siteTitle,
  stylesheetHrefs,
} from "../app/shomeido/content.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = path.join(repoRoot, "public/images/home");
const cssRoot = path.join(repoRoot, "public/css");
const slickRoot = path.join(repoRoot, "public/js/slick");
const componentRoot = path.join(repoRoot, "app/shomeido/components");

function mustInclude(text, phrase) {
  assert.ok(text.includes(phrase), `missing phrase: ${phrase}`);
}

test("shomeido body keeps the original top-page structure", () => {
  assert.match(siteTitle, /株式会社正明堂/);
  assert.match(siteDescription, /代々木駅徒歩3分/);
  assert.ok(Array.isArray(siteKeywords));

  const mainSectionsSource = fs.readFileSync(path.join(componentRoot, "MainSections.jsx"), "utf8");

  [
    "70 Years",
    "代々木駅から徒歩3分、",
    "PRODUCTS",
    "SERVICE",
    "店主のイチオシ商品特集",
    "CONTACT",
  ].forEach((phrase) => mustInclude(bodyHtml, phrase));

  mustInclude(mainSectionsSource, "文房具・事務用品のことなら");
  mustInclude(mainSectionsSource, "正明堂へ");

  assert.equal(headerNavItems.length, 5);
  assert.equal(heroSlides.length, 3);
  assert.equal(productStrip.length, 6);
  assert.equal(serviceCards.length, 2);
  assert.match(featureCopy.title, /店主のイチオシ商品特集/);
  assert.match(footerContact.tel, /03-3379-3388/);
});

test("shomeido assets are local", () => {
  [
    "logo.png",
    "mv01.jpg",
    "mv02.jpg",
    "mv03.jpg",
    "001.jpg",
    "111.png",
    "112.png",
    "113.png",
    "114.png",
    "115.png",
    "116.png",
    "221.png",
    "222.png",
    "223.png",
    "224.png",
    "225.png",
    "226.png",
    "002.jpg",
    "003.jpg",
    "vaimo80R_main-removebg-preview.png",
    "bg00.jpg",
    "bg01.jpg",
    "bg01.png",
    "bg02.png",
    "clip01.png",
    "ring.png",
    "ring02.png",
  ].forEach((filename) => {
    assert.equal(fs.existsSync(path.join(assetsRoot, filename)), true, `missing asset: ${filename}`);
  });
});

test("shomeido css files are present", () => {
  [
    "index_html.css",
    "bxi.css",
    "common_style.css",
    "common.css",
    "style.css",
  ].forEach((filename) => {
    assert.equal(fs.existsSync(path.join(cssRoot, filename)), true, `missing css: ${filename}`);
  });

  [
    "slick.css",
    "slick-theme.css",
    "ajax-loader.gif",
  ].forEach((filename) => {
    assert.equal(fs.existsSync(path.join(slickRoot, filename)), true, `missing slick css: ${filename}`);
  });

  stylesheetHrefs
    .filter((href) => href.startsWith("/css/") || href.startsWith("/js/slick/"))
    .forEach((href) => {
      assert.equal(
        fs.existsSync(path.join(repoRoot, "public", href)),
        true,
        `missing local stylesheet asset: ${href}`,
      );
    });
});

test("shomeido javascript assets are present", () => {
  scriptSrcs.forEach((src) => {
    assert.equal(
      fs.existsSync(path.join(repoRoot, "public", src)),
      true,
      `missing js asset: ${src}`,
    );
  });
});

test("shomeido components are split by section", () => {
  [
    "HeaderSection.jsx",
    "MainSections.jsx",
    "FeatureFooter.jsx",
  ].forEach((filename) => {
    assert.equal(
      fs.existsSync(path.join(componentRoot, filename)),
      true,
      `missing component: ${filename}`,
    );
  });
});

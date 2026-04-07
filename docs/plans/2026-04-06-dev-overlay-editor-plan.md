---
title: 公開サイト埋め込み型編集UI 実装計画
status: implemented
updated: 2026-04-06
---

# 公開サイト埋め込み型編集UI 実装計画

## Summary

この計画は、PoC のダッシュボードではなく、公開サイトに編集用チャットを重ねる運用へ移行するためのものです。
開発時だけ編集 UI を全ページへ差し込み、本番では通常の公開サイトだけを表示します。

## Required Reading

- 実装前に `AGENTS.md` を読む
- 次に `docs/vision.md` を読む
- そのあと、この plan を読む
- 大きな UI 方針変更がある場合は、先に `docs/vision.md` を更新してから作業する
- 新しい計画や方針変更は `docs/plans/` に残す

## Key Changes

- 公開ページと管理ビューの分離
  - `/` はコーポレートサイト風のトップページにする
  - `/services` は同じデザイン言語で最小構成のサービスページにする
  - `/admin` は bridge 管理用の画面として維持し、開発オーバーレイの対象外にする

- 編集 UI の注入方法
  - 編集 UI はページ本体に埋め込まず、`layout` から共通注入する
  - `development` 時のみ表示し、本番では完全に非表示にする
  - 画面下部に固定し、回答エリアはその上に展開する
  - チャット本体と回答エリアはどちらも手動で折りたためるようにする

- Tailwind / CSS 設計
  - 見た目は JSX の Tailwind utility で書く
  - セマンティックなクラス名は「意味のフック」として先頭に置き、その後ろに utility を並べる
  - 状態は CSS 変数で持つ
  - `_01variables.scss` 由来の命名感を採用する
    - 基礎色: `--MC`, `--SC`, `--AC`, `--BC`, `--TC`, `--GR`, `--BK`, `--WH`
    - semantic alias: `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--muted`, `--border`
    - layout/state: `--gap`, `--wid`, `--MY`, `--PX`, `--into`, `--out`, `--editor-open`, `--reply-open`
  - `STYLE.md` からは「変数を使う」「意味のある命名を使う」という考え方だけを取り入れ、Tailwind v3 固定などは採用しない

- アクセシビリティ
  - 開閉は `button` と `aria-expanded` / `aria-controls` で扱う
  - 回答領域は `role="region"` と `aria-live` を適切に付ける
  - ナビゲーションには `aria-current="page"` を付ける
  - 状態表示は色だけに依存しない

## Implementation Notes

- `app/page.jsx` と `app/services/page.jsx` は公開サイトとして成立させる
  - `header` / `main` / `footer` を分離し、`main` の中にはセクションだけを置く
  - 各主要セクションに `data-section` だけを付ける
  - トップページのダッシュボード感を抑え、公開サイトらしい軽さを優先する
- `app/layout.jsx` は development 時だけ `DevEditorOverlay` を注入する
- `app/admin/page.jsx` は `BridgeDashboard` を表示する管理ビューとして残す
- `app/components/DevEditorOverlay.jsx` は公開ページ向けの軽いチャット UI に寄せる
- `app/globals.css` は Tailwind の入口と最小限の基礎トークンだけに寄せる
- 変更時は公開ページ、管理ビュー、編集オーバーレイの責務を混ぜない

## Test Plan

- `npm test`
- `npm run build`
- 手動確認
  - `/` がダッシュボードではなく公開サイトに見える
  - `/services` も同じデザイン言語で見える
  - `development` 時だけ編集オーバーレイが出る
  - `/admin` では編集オーバーレイが出ない
  - オーバーレイの開閉、返信エリアの開閉、承認操作がキーボードで使える
  - 本番ビルドでは overlay が消える

## Assumptions

- 編集 UI はページ単位ではなく、共通オーバーレイとして扱う
- 編集対象の内容は repo で管理され、ローカル編集後にそのままデプロイ可能な形で保つ
- まずはトップページとサービスページを最小構成で用意し、複数ページ編集の土台を固める
- 既存の `/admin` と bridge ダッシュボードは壊さず、公開ページの UI とは分ける

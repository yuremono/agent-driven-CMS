# プロジェクト概要

Codex app-server または Claude Code を Next.js の Node runtime 経由で中継し、ブラウザ UI から自然言語でサイト編集を行うローカル CMS テンプレート。

## 技術スタック

- Next.js App Router
- React 19
- Node.js runtime の API Route
- テスト: `node:test`

## コマンド

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | ビルド後の起動 |
| `npm test` | ユニットテスト実行 |
| `npm run smoke` | app-server の疎通確認 |

## 主要ディレクトリ・ファイル

| パス | 役割 |
|-----|------|
| [`app/page.jsx`](app/page.jsx) | ブラウザ UI のメイン画面 |
| [`app/api/bridge/`](app/api/bridge/) | bridge 用 API Route |
| [`lib/codex-bridge.js`](lib/codex-bridge.js) | Codex app-server の起動・接続・状態管理 |
| [`docs/`](docs/) | bridge / 認証 / app-server の補足ドキュメント |
| [`test/`](test/) | `node:test` の回帰テスト |
| [`smoke-test.js`](smoke-test.js) | 最小の app-server 疎通テスト |
| [`docs/vision.md`](docs/vision.md) | UI / 運用イメージの重要記録 |


## Execution Levels

調査、編集、検証、テストをそれぞれ独立した別々のstepとして定義する。

- 1step: 迷わず即実行
- 3step以上: `task-log` スキルを実行
- 5step以上: `task-large` スキルを実行
- 4step以下でも影響範囲が広い、設計判断が入るものは`task-large` スキルを実行

**報告はstepに含めない**

## Execution rules

- あなたが実行した行動をユーザーに**誤った行動**だと指摘されたら、論理的に分析して `tasks/learning.yaml` に追記する
- 部分的な修正は、周囲のコードを書き換えないように `apply_patch` のような差分ツールで最小差分を修正する。
- `app/api/*` は `runtime = "nodejs"` を維持し、app-server との接続はサーバー側で扱う。
- UI は既存の状態表示・承認フローを壊さずに拡張する。
- 初めて編集するファイルは、編集前に必ず内容を確認する。
- `docs/vision.md` は重要ファイルとして扱い、必要に応じて更新する。
- `tasks` ,`tmp` ディレクトリを github に push しない
- 全ての色は`app/globals.css`の`oklch`で書かれた既存変数を使用する。透明度もWH50などで指定可能。グラデーションとシャドウは使用しない。見つけたらユーザーに報告する。

## ブラウザ確認

- ブラウザでの見た目確認やスクリーンショット比較が必要なときは、`$agent-browser` スキルを使う。
- スクリーンショットはプロジェクト内の `tmp/browser-checks/` を既定の保存先とする。

## 禁止事項

- `git reset --hard` や `git checkout --` のような破壊的操作を勝手に使わない。
- 認証情報やシークレットをrepoやブラウザへ渡さない。


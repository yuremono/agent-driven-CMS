# プロジェクト概要

Codex app-server を Next.js の Node runtime 経由で中継し、ブラウザ UI から自然言語でサイト編集を行うローカル CMS テンプレート。

## 技術スタック

- Next.js App Router
- React 19
- Node.js runtime の API Route
- Codex app-server（stdio）
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

## コーディング規約

- 変更は既存の bridge / UI の流れに合わせ、影響範囲を最小化する。
- `app/api/*` は `runtime = "nodejs"` を維持し、app-server との接続はサーバー側で扱う。
- 認証情報やシークレットをブラウザへ渡さない。
- UI は既存の状態表示・承認フローを壊さずに拡張する。
- 初めて編集するファイルは、編集前に必ず内容を確認する。
- `docs/vision.md` は重要ファイルとして扱い、必要に応じて更新する。

## 行動原則

- ユーザーが実装を依頼、taskが確定、既存taskの再開、task完了時は必ず `task-log` スキルを実行すること
- 3ステップ以上の作業は、先に方針を固めてから進める。
- 軽微な修正では**test/buildを行わない** - build/test は、API・状態管理・bridge・認証・ロジック変更のときだけ実施する。


## ブラウザ確認

- ブラウザでの見た目確認やスクリーンショット比較が必要なときは、`$agent-browser` スキルを使う。
- スクリーンショットの保存先指定がない場合は、プロジェクト内の `tmp/browser-checks/` を既定の保存先にする。

## 禁止事項

- `git reset --hard` や `git checkout --` のような破壊的操作を勝手に使わない。
- 秘密情報を repo に追加しない。
- ブラウザへ API key を露出させない。

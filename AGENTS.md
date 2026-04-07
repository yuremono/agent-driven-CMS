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
| [`docs/plans/`](docs/plans/) | 実装前の計画書置き場 |

## コーディング規約


- 全ての作業を
- 変更は既存の bridge / UI の流れに合わせ、影響範囲を最小化する。
- `app/api/*` は `runtime = "nodejs"` を維持し、app-server との接続はサーバー側で扱う。
- 認証情報やシークレットをブラウザへ渡さない。
- bridge の挙動を変える場合は、必ず回帰テストを追加または更新する。
- UI は既存の状態表示・承認フローを壊さずに拡張する。
- 初めて編集するファイルは、編集前に必ず内容を確認する。
- UI / 運用イメージを変える作業では、着手前に `docs/vision.md` と該当する `docs/plans/*.md` を必ず読む。
- `docs/vision.md` は重要ファイルとして扱い、必要に応じて更新する。
- 新しい方針や大きな UI 変更を始める時は、まず `docs/plans/` の計画書を作成または更新し、その後に説明や実装へ進む。
- プランモードでは、チャットで説明する前に `docs/plans/` の Markdown を先に作成または更新する運用を優先する。
- サブエージェントは、着手前に必ず `AGENTS.md`、`docs/vision.md`、該当する `docs/plans/*.md` を読む。

## a11y（アクセシビリティ）
- **a11yツリー（アクセシビリティツリー）** の考え方を採用
- AIが理解しやすい属性（role, aria-*）を付与
- 要素を「意味のある部品」として扱う

## コード品質チェックリスト
完了とする前に以下を確認してください：
- [ ] コードが読みやすく、命名が適切である
- [ ] 関数が小さい（50行未満）
- [ ] ファイルが1つの責務に集中している（800行未満）
- [ ] ネストが深すぎない（4階層以内）
- [ ] 適切なエラーハンドリングがなされている
- [ ] 不要な `console.log` が残っていない
- [ ] ハードコードされた値がない
- [ ] 不変性のパターンが守られている

## 行動原則

- 3ステップ以上の作業は、先に方針を固めてから進める。
- 変更は必要な箇所だけに限定する。
- 仕様や挙動を変える場合は、ドキュメントとテストも合わせて更新する。


## ブラウザ確認

- ブラウザでの見た目確認やスクリーンショット比較が必要なときは、`$agent-browser` スキルを使う。
- Vercel Agent Browser のパスが設定から直接取れない場合は、ユーザーにパスを貼ってもらってから確認する。
- スクリーンショットの保存先指定がない場合は、プロジェクト内の `tmp/browser-checks/` を既定の保存先にする。
- 一時確認画像は `/tmp` ではなく、原則としてリポジトリ内に残す。

## 禁止事項

- `git reset --hard` や `git checkout --` のような破壊的操作を勝手に使わない。
- 秘密情報を repo に追加しない。
- ブラウザへ API key を露出させない。
- 既存のユーザー変更を勝手に巻き戻さない。

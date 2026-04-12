# Agent Driven CMS

Codex app-server を既定で使い、起動時切替で Claude Code も併用できるローカル向け CMS テンプレートです。

## デモ動画

[デモ動画（MP4）](public/video/demo.mp4)（README 上ではプレーヤーは出ず、リンク先のファイル画面で再生できます）

## 開発

```bash
npm install
npm run dev
```

## GitHub Pages 公開プレビュー

- `npm run build:pages` で、`dist/github-pages` に公開用の静的サイトを生成します。
- `.github/workflows/pages.yml` が `main` への push と手動実行でこの生成物を GitHub Pages に配信します。
- 公開プレビューは静的サイトなので、`/admin` の bridge 機能はローカル開発時のみ使えます。
- 公開先では `/` と `/services/` の見た目を確認できます。

### Provider 切替

- 既定は Codex です。`npm run dev` は従来どおり Codex で起動します。
- Claude Code で起動したいときだけ `npm run dev:claude` を使います。
- 明示的に Codex を指定したいときは `npm run dev:codex` を使います。
- 切替はブラウザからではなく、サーバー起動時に `AGENT_BRIDGE_PROVIDER` で行います。

## 認証

### Codex

```bash
security add-generic-password -a "$USER" -s OPENAI_API_KEY -w "sk-..." -U
security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key
codex login status
```

### Claude Code

```bash
claude auth login
claude auth status --json
```

## 使い方

1. 使いたい provider にログインする。
2. Codex なら `npm run dev` か `npm run dev:codex`、Claude なら `npm run dev:claude` を起動する。
3. ブラウザで公開サイトを開く。
4. 開発時だけ下部に出る編集チャットインプットから指示を送る。
5. `/admin` で provider 状態を確認する。

## 認証の扱い

- API key は `codex login --with-api-key` でローカルにだけ渡す。
- `.env` や `NEXT_PUBLIC_` 変数に API key を置かない。
- Codex bridge は `account/read` で認証状態を確認してから thread を開始する。
- Codex では `account/rateLimits/read` も呼び、開発時チャットインプットに `rate limits` を表示する。
- Claude Code は `claude auth status --json` を使って認証状態を確認する。
- Claude の切替は起動時のみで、ブラウザから login/logout/rate limits を操作しない。
- ブラウザ UI は公開ページ上に重なる編集チャットインプットとして表示される。
- `/` はトップページ、`/services` はサービスページとして機能する。

## Claude v1 の制約

- Claude 側は browser login/logout に対応しません。認証はターミナルで完結させます。
- Claude 側は browser rate limits 表示に対応しません。
- Claude 側は Codex の approval request 相当をブラウザに中継しません。
- そのため Claude では、安全な編集を前提にした起動時 permission mode で運用します。

## Smoke Test

- `npm run smoke` と `npm run smoke:codex` は Codex app-server 用です。
- `npm run smoke:claude` は Claude Code へ最小プロンプトを送り、`OK` 応答を確認します。
- Claude smoke は実 API 呼び出しになるため、認証済みであることと実行コストがかかることに注意してください。

## 参照

- `docs/app-server.md`
- `docs/authentication.md`
- `docs/bridge.md`

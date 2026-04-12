# Agent Driven CMS

Codex app-server または Claude Code を Next.js の Node runtime 経由で中継し、ブラウザ UI から自然言語でサイト編集を行うローカル CMS 。

## 概要

ポートフォリオ及びPoCとして開発したものです。

- 動機：AI時代にクライアントが求めるのは「チャットで編集できるwebサイト」でありCMS自体がボトルネック
- 手段：パブリックでなくローカル完結ならモデル性能依存を解消できる
- 成果：フロントエンド以外は全て仕様駆動で実現。エンタメ性もある
- 考察：
リテラシーの高いクライアント＆十分な初期サポートという条件は必須と考えていたし、体験としては有意義であるが、ここまでやるならCursorエディタを使ってもらった方がいい。という結論です。

## デモ動画

https://github.com/user-attachments/assets/db96e9cd-a615-43d4-b252-7eb748b000e3

## 開発

```bash
npm install
npm run dev
```

## GitHub Pages プレビュー

GitHub Pages では `app/` の公開ページを Next.js static export として配信します。
ローカル編集用の bridge API と app-server 接続は Pages では動かさず、公開ページ本体だけを静的成果物として出します。

```bash
npm run build:pages
```



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

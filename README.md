# Agent Driven CMS

Codex app-server を使ったローカル向け CMS テンプレートです。

## 開発

```bash
npm install
npm run dev
```

## 認証

```bash
security add-generic-password -a "$USER" -s OPENAI_API_KEY -w "sk-..." -U
security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key
codex login status
```

## 使い方

1. Codex CLI にログインする。
2. `npm run dev` を起動する。
3. ブラウザで公開サイトを開く。
4. 開発時だけ下部に出る編集オーバーレイから指示を送る。
5. `Pending Approvals` と `Auth` 表示で必要な確認を行う。

## 認証の扱い

- API key は `codex login --with-api-key` でローカルにだけ渡す。
- `.env` や `NEXT_PUBLIC_` 変数に API key を置かない。
- bridge は `account/read` で認証状態を確認してから thread を開始する。
- 認証成功後は `account/rateLimits/read` も呼び、開発時オーバーレイに `rate limits` を表示する。
- ブラウザ UI は公開ページ上に重なる編集オーバーレイとして表示される。
- `/` はトップページ、`/services` はサービスページとして機能する。

## 参照

- `docs/app-server.md`
- `docs/authentication.md`
- `docs/bridge.md`

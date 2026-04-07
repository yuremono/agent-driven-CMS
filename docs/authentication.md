# Authentication

Codex CLI は API key を stdin から受け取れるので、ローカルでは `.env` に置かずに `codex login --with-api-key` を使う。
このテンプレートでは、bridge 側が app-server の `account/read` を見て認証状態を確認し、必要な場合だけ thread を開始する。

## ブラウザ UI での確認

- `status` に `authMode` / `requiresOpenaiAuth` / `accountEmail` が表示される。
- 認証後は `rate limits` も表示され、必要なら UI から再取得できる。
- 認証が必要なのに未ログインの場合、まずターミナルで `codex login` を完了する。

## 推奨手順

1. macOS Keychain に保存する。
2. 必要なときだけ `security find-generic-password ... -w` で取り出す。
3. `codex login --with-api-key` にパイプで渡す。

## 例

```bash
security add-generic-password -a "$USER" -s OPENAI_API_KEY -w "sk-..." -U
security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key
codex login status
```

## 注意

- API key は repo に置かない。
- `NEXT_PUBLIC_` 付きの環境変数にしない。
- app-server が必要なのはログイン済みのローカル状態で、ブラウザに key を渡す必要はない。
- bridge の `status` で `authMode` と `requiresOpenaiAuth` を確認できる。
- rate limits は browser から直接入力しない。必要な場合は bridge 経由で読む。

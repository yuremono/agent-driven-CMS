# Authentication

このテンプレートは Codex を既定にしつつ、起動時切替で Claude Code も扱う。  
認証処理は provider ごとに分かれており、いずれも秘密情報をブラウザへ渡さない。

## Codex

Codex CLI は API key を stdin から受け取れるので、ローカルでは `.env` に置かずに `codex login --with-api-key` を使う。
bridge 側は app-server の `account/read` を見て認証状態を確認し、必要な場合だけ thread を開始する。

## ブラウザ UI での確認

- Codex では `status` に `authMode` / `requiresOpenaiAuth` / `accountEmail` が表示される。
- Codex では認証後に `rate limits` も表示され、必要なら UI から再取得できる。
- Codex で認証が必要なのに未ログインの場合、まずターミナルで `codex login` を完了する。
- Claude では provider 状態は見えるが、browser login/logout/rate limits は出さない。

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

## Claude Code

Claude はターミナルで認証を完了する。

```bash
claude auth login
claude auth status --json
```

## Claude v1 の制約

- browser から `claude auth login` / `claude auth logout` を叩かない。
- browser から rate limits を読まない。
- browser approval request は中継しない。
- Claude の provider 切替は `AGENT_BRIDGE_PROVIDER=claude` で起動し直して行う。
- Claude の既定 permission mode は `acceptEdits` で、危険度の高い追加承認を browser で返さない。

## 注意

- API key は repo に置かない。
- `NEXT_PUBLIC_` 付きの環境変数にしない。
- app-server が必要なのはログイン済みのローカル状態で、ブラウザに key を渡す必要はない。
- Codex では bridge の `status` で `authMode` と `requiresOpenaiAuth` を確認できる。
- rate limits は browser から直接入力しない。必要な場合だけ bridge 経由で読む。
- Claude では `/admin` に provider 状態は出るが、認証操作はターミナルで完結させる。

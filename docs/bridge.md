# Bridge

このテンプレートでは、ブラウザは provider の CLI / app-server に直結せず、Next.js の Node runtime を中継として使う。  
公開サイトの上に開発時だけ編集オーバーレイを重ねる構成を前提にしている。

## 役割

- `app/api/bridge/status` が bridge 状態を返す。
- `app/api/bridge/events` が SSE でイベントを配信する。
- `app/api/bridge/turn` がユーザー入力を provider bridge に送る。
- `app/api/bridge/respond` が approval request への応答を app-server に返す。
- `app/api/bridge/account` が provider の認証状態を返す。
- `app/api/bridge/login` / `app/api/bridge/logout` / `app/api/bridge/rate-limits` は、provider capability に応じて使える範囲が変わる。

## 前提

- provider 切替はブラウザではなく、起動時に `AGENT_BRIDGE_PROVIDER=codex|claude` で行う。
- 既定 provider は Codex で、`npm run dev` は Codex のまま維持する。
- `app/api/bridge/status` には provider 固有状態に加えて、`provider`、`providerLabel`、`capabilities`、`availableModels`、`defaultModel` が含まれる。
- `app/api/bridge/turn` は `input` に加えて `model` も受け取り、provider ごとに安全な範囲で反映する。
- 開発時の編集 UI は公開ページの固定オーバーレイとして表示し、本番ビルドでは出さない。

### Codex

- `codex app-server` を `stdio` で起動する。
- `initialize` には `clientInfo` を入れる。
- 初回接続後は `initialized` を送ってから `account/read` を行い、認証状態を確認してから `thread/start` を始める。
- `account/read` が成功したあと、bridge は `account/rateLimits/read` も読み、UI に rate limits を表示できるようにする。
- `turn/diff/updated` で unified diff を、`item/fileChange/requestApproval` で編集承認を扱う。

### Claude Code

- `claude -p --output-format stream-json --verbose` を turn ごとに起動する。
- 認証状態は `claude auth status --json` で確認する。
- Claude 側の既定 permission mode は `acceptEdits` とし、browser approval flow は持たせない。
- Claude でも UI には Codex と同じ主要 SSE method を流すが、diff / plan / approval request / rate limits は非対応として扱う。
- Claude の切替は起動時のみで、browser login/logout は提供しない。

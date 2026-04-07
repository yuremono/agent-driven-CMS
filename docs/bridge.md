# Bridge

このテンプレートでは、ブラウザは Codex app-server に直結せず、Next.js の Node runtime を中継として使う。  
公開サイトの上に開発時だけ編集オーバーレイを重ねる構成を前提にしている。

## 役割

- `app/api/bridge/status` が bridge 状態を返す。
- `app/api/bridge/events` が SSE でイベントを配信する。
- `app/api/bridge/turn` がユーザー入力を app-server に送る。
- `app/api/bridge/respond` が approval request への応答を app-server に返す。
- (任意) `app/api/bridge/account` / `app/api/bridge/login` / `app/api/bridge/logout` を用意すると、ブラウザ UI から認証の補助操作を行える。
- `app/api/bridge/rate-limits` で、現在のレート制限情報を取得できる。

## 前提

- `codex app-server` は `stdio` で起動する。
- `initialize` には `clientInfo` を入れる。
- 初回接続後は `initialized` を送ってから `account/read` を行い、認証状態を確認してから `thread/start` を始める。
- `account/read` が成功したあと、bridge は `account/rateLimits/read` も読み、UI に rate limits を表示できるようにする。
- `app/api/bridge/status` には `authMode`、`accountEmail`、`requiresOpenaiAuth`、`rateLimits` も含まれる。
- 開発時の編集 UI は公開ページの固定オーバーレイとして表示し、本番ビルドでは出さない。
- `turn/diff/updated` で unified diff を、`item/fileChange/requestApproval` で編集承認を扱う。

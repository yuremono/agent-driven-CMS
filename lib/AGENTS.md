# lib

このディレクトリには、bridge 本体とその周辺ユーティリティが入っています。各ファイルの役割は以下です。

- `bridge.ts`
  - bridge の共通型、provider 選択、実体の切り替えをまとめた入口です。
- `bridge-http.ts`
  - API ルートで使う HTTP 補助関数です。JSON 応答、same-origin 判定、エラーハンドリングを扱います。
- `claude-bridge.ts`
  - Claude Code 用の bridge 実装です。認証確認、turn 実行、イベント処理を担当します。
- `codex-bridge.ts`
  - Codex app-server 用の bridge 実装です。プロセス起動、状態管理、turn 実行、イベント処理を担当します。

注意:

- ここは bridge 全体の中核なので、型の共有と実装の境界を崩さないでください。
- `bridge-http.ts` は API 層専用の補助に寄せ、UI 側から直接使う想定ではありません。

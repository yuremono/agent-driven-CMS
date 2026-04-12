# app/api/bridge

このディレクトリは browser UI から bridge を呼び出す API ルート群です。各 route の役割は以下です。

- `account/route.ts`
  - bridge のアカウント情報を読み直します。`refreshToken` クエリも受け取ります。
- `events/route.ts`
  - bridge のイベントを Server-Sent Events で流します。UI のライブ更新用です。
- `login/route.ts`
  - browser からのログイン開始を受け付けます。ブラウザ経由の `chatgpt` ログインだけを許可します。
- `logout/route.ts`
  - browser からのログアウトを実行します。
- `rate-limits/route.ts`
  - bridge の rate limit 情報を再取得します。
- `respond/route.ts`
  - 承認待ちの server request に対して、UI からの回答を bridge に返します。
- `status/route.ts`
  - 現在の bridge 状態を返します。管理画面の初期表示でも使います。
- `turn/route.ts`
  - 新しい編集指示を bridge に送ります。`input` と任意の `model` を受け取ります。

注意:

- ここは `runtime = "nodejs"` を維持します。
- 認証や承認に関わるので、入力値の検証を省かないでください。
- browser から受ける値は最小限にし、秘密情報を通さないでください。

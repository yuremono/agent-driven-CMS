■ プロジェクト概要
Codex App Server を中核にした「Agent Driven CMS」を開発中。
ブラウザのチャットUIから自然言語でWebサイトの編集・テスト・Git操作まで行える仕組みを構築する。
既存のNext.jsプロジェクトに追加できるテンプレートとしてGitHub公開を目指す。

---

■ 現在の構成方針

・フロントエンド
Next.js（App Router）＋ React

・バックエンド
Codex App Server（ローカルでCLI起動）

・通信構成
Browser
↓
Next.js API Route
↓
Nodeブリッジ（stdio管理）
↓
Codex app-server

・補助
GitHub / Playwright / デプロイ（MVP後）

---

■ 開発ツールの役割分担

・Cursor
コード編集・設計・Plan.md管理

・Codex CLI
ローカルエージェントとして実行主体（ファイル編集・Git操作など）

・ブラウザUI
最終的なユーザー操作画面

---

■ 重要な前提（修正済み）

・ChatGPT PlusではなくOpenAI APIキーが必須
・Codex app-serverはCLIでローカル起動
・stdio通信のためWebSocket直結は不可（中継サーバーが必要）
・Git操作は自動ではなく確認フローを挟む

---

■ 現在の進行状況

・要件定義（REQUIMENTS.md）作成済み
・MVP計画（Plan.md）作成済み
・Codex CLI未使用 → これから導入
・APIキーは取得済み

---

■ 次にやろうとしていること

・Codex CLIをローカル環境で使い始める
・開発フローを「Cursor + Codex」に最適化
・app-server連携の実装に進む

---

■ 今回新しく相談したい内容

APIキーを

・.envファイルに書かない
・リポジトリにも置かない

代わりに

👉 macOS側（環境変数 / キーチェーン等）で安全に管理したい

その方法とベストプラクティスを知りたい

---

■ 前提環境

・macOS
・Node.jsあり
・Cursorエディタ使用
・OpenAI APIキー取得済み
・Codex CLIはこれから導入

---

■ ゴール

開発中も運用時も安全にAPIキーを扱える構成にしたい
（漏洩しない・Gitに含めない・使いやすい）

***

はい。

結論として、あなたの条件なら **「APIキーは macOS のキーチェーンに保存し、必要なときだけシェルで取り出して `codex login --with-api-key` に流す」** がいちばん扱いやすいです。`.env` にもリポジトリにも置かずに済みます。Codex CLI は API キーを **標準入力（stdin）** から受け取れますし、ログイン情報は次回以降の利用のためにローカルへキャッシュされます。Codex の認証は ChatGPT サブスクとは別で、**APIキー利用時は OpenAI Platform 側の従量課金** です。([OpenAI Developers][1])

あなた向けのベストプラクティスは、次の3段構成です。

## 1. いちばん安全で実用的な方針

### 開発用

* APIキー本体は **macOS Keychain（キーチェーン）** に保存
* Terminal から必要時だけ取り出す
* `codex login --with-api-key` に **パイプ**で渡す
* プロジェクト内の `.env`、`env.local`、ソースコード、設定ファイルには書かない

### Node / Next.js 側

* 開発サーバー起動時だけ、**親シェルの環境変数**として渡す
* その環境変数を Next.js API Route や Node ブリッジが読む
* ブラウザへは絶対に渡さない
* `NEXT_PUBLIC_` 付き変数にはしない

### 将来の運用

* ローカル開発は Keychain
* サーバー運用は **その環境のシークレット管理** を使う

  * 例: Vercel / GitHub Actions / Render / Fly.io の Secrets
* 本番でも `.env` をGit管理しない

Apple の Terminal は、シェルで export した環境変数をそのシェル配下のコマンドや起動アプリに継承させられます。([Apple サポート][2])

---

## 2. まずやること

### APIキーを Keychain に保存

Terminal でこれを実行します。

```bash
security add-generic-password -a "$USER" -s OPENAI_API_KEY -w "sk-..." -U
```

意味:

* `security` = macOS のキーチェーン操作コマンド
* `-s OPENAI_API_KEY` = 保存名
* `-w` = 実際のキー
* `-U` = 既存があれば更新

これで APIキーはプロジェクト外に保存されます。

---

## 3. Codex CLI に安全に渡す方法

Codex CLI は API キーを stdin から受け取れます。OpenAI の公式リファレンスでも、`printenv OPENAI_API_KEY | codex login --with-api-key` という形が案内されています。([OpenAI Developers][3])

あなたの環境では、Keychain から直接流すのがよいです。

```bash
security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key
```

確認:

```bash
codex login status
```

これで `.env` 不要です。

---

## 4. 毎回の作業を楽にする

`~/.zshrc` に **キー本体ではなく関数だけ** を置きます。
これなら、`.zshrc` 自体に秘密情報は入りません。

```bash
get_openai_api_key() {
  security find-generic-password -a "$USER" -s OPENAI_API_KEY -w
}

codex-login-api() {
  get_openai_api_key | codex login --with-api-key
}
```

その後:

```bash
source ~/.zshrc
codex-login-api
```

これはかなり実用的です。

---

## 5. Next.js / Node ブリッジで使う方法

Codex CLI へのログインだけで済むなら上の方法で十分です。
ただし、あなたの **Node ブリッジや app-server 起動スクリプトが `OPENAI_API_KEY` を直接必要とする設計** なら、起動時だけ環境変数として渡します。

例:

```bash
export OPENAI_API_KEY="$(security find-generic-password -a "$USER" -s OPENAI_API_KEY -w)"
npm run dev
```

または一発だけ:

```bash
OPENAI_API_KEY="$(security find-generic-password -a "$USER" -s OPENAI_API_KEY -w)" npm run dev
```

後者のほうが安全です。
シェル全体に長く残しにくいからです。

---

## 6. あなたの構成でのおすすめ

あなたの構成はこうでした。

Browser
→ Next.js API Route
→ Nodeブリッジ
→ Codex app-server

この場合のおすすめはこうです。

### パターンA: まずは最小構成

* 端末で `codex-login-api`
* その後に Node ブリッジ / app-server 起動
* app-server は Codex のログイン済み状態を使う

### パターンB: Node 側がキーを必要とする場合

* 起動ラッパースクリプトで Keychain から取得
* そのプロセスにだけ `OPENAI_API_KEY` を渡す

例:

```bash
#!/bin/zsh
export OPENAI_API_KEY="$(security find-generic-password -a "$USER" -s OPENAI_API_KEY -w)"
npm run dev
```

この `run-dev.sh` はリポジトリに入れてもよいですが、**キー本体が入らない形** にしてください。

---

## 7. やってはいけないこと

* `.env`
* `.env.local`
* `config.toml` などにキー文字列を直書き
* `echo "sk-..."` をシェル履歴に残す
* `NEXT_PUBLIC_OPENAI_API_KEY` のようにクライアント側へ露出
* スクリーンショットや録画にキーが映る状態で作業
* LLM に貼る
* Git のコミット履歴に一度でも入れる

OpenAI の一般APIドキュメントでは、macOS / Linux で APIキーを環境変数として export する案内がありますが、あなたの条件では **恒久的に `.zshrc` にキー本体を書く方式より、Keychain保管 + 必要時取り出し** のほうが安全です。([OpenAI Developers][4])

---

## 8. Keychain 側の設定で気をつけること

macOS の Keychain Access では、保存した秘密情報に対して

* 全アプリ許可
* 毎回確認
* キーチェーンのパスワード要求
* 特定アプリだけ許可

のようなアクセス制御ができます。Apple の案内でも、キーチェーン項目ごとにアクセス制御を設定できます。([Apple サポート][5])

実務上は、

* まずは通常の login keychain に保存
* 不安なら「確認してから許可」
* 自動化が必要になったら必要最小限のアプリのみ許可

が無難です。

---

## 9. あなたの前提で補足修正

以前の整理では「app-server は stdio なので WebSocket 直結不可」としていましたが、**現在の公式ドキュメントでは `stdio` がデフォルトで、`ws://` の WebSocket リッスンも experimental（実験的）として案内されています**。ただし安定運用の第一候補はまだ `stdio` です。([OpenAI Developers][6])

つまり、MVPでは今の

* Next.js API Route
* Node ブリッジ
* stdio 管理

のままで正しいです。
その上で、将来 WebSocket 経由も検証候補にはできます。

---

## 10. いまのあなたに最適な実行手順

そのまま進めるなら、この順です。

```bash
# 1) Codex CLI インストール
npm i -g @openai/codex

# 2) Keychain に保存
security add-generic-password -a "$USER" -s OPENAI_API_KEY -w "sk-..." -U

# 3) Keychain から安全にログイン
security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key

# 4) ログイン確認
codex login status

# 5) 開発開始
npm run dev
```

Codex CLI は npm でインストールし、初回起動時にサインインします。CLI は ChatGPT 認証と APIキー認証の両方に対応しています。([OpenAI Developers][7])

---

## 11. 最終結論

あなたのケースの最適解はこれです。

**最適解**

* APIキー本体は macOS Keychain に保存
* Codex CLI には Keychain → stdin で渡す
* Node / Next.js には起動時だけ環境変数として注入
* `.env` とリポジトリには置かない
* 本番は各ホスティングの Secrets に切り替える

必要なら次に、**macOS 用の「開発開始ワンコマンド」スクリプト** と、**Cursor + Codex 用の具体的な運用フロー** まで、そのままコピペできる形で作ります。

[1]: https://developers.openai.com/codex/auth/ "Authentication – Codex | OpenAI Developers"
[2]: https://support.apple.com/en-mt/guide/terminal/apd382cc5fa-4f58-4449-b20a-41c53c006f8f/mac "Use environment variables in Terminal on Mac - Apple Support (MT)"
[3]: https://developers.openai.com/codex/cli/reference/ "Command line options – Codex CLI | OpenAI Developers"
[4]: https://developers.openai.com/api/docs/quickstart/?utm_source=chatgpt.com "Developer quickstart | OpenAI API"
[5]: https://support.apple.com/en-me/guide/mac-help/kychn002/mac "Allow apps to access your keychain - Apple Support (ME)"
[6]: https://developers.openai.com/codex/app-server/ "App Server – Codex | OpenAI Developers"
[7]: https://developers.openai.com/codex/cli/?utm_source=chatgpt.com "Codex CLI"



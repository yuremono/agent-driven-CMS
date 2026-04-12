# app/components

このディレクトリには、画面表示と橋渡し処理の両方が入っています。各ファイルの役割は以下です。

- `BridgeDashboard.tsx`
  - `/admin` で表示する管理画面の本体。認証状態、実行中の turn、diff、承認待ちを一覧で確認します。
- `BridgeSessionContext.tsx`
  - `useBridgeSession` の状態を React Context で配るための provider と hook です。
- `CanvasEffectLayer.tsx`
  - テキスト装飾やキャンバス効果を画面上で動かすレイヤーです。
- `DevBridgeLayer.tsx`
  - 開発時だけ表示する bridge UI をまとめて差し込むラッパーです。
- `DevEditorOverlay.tsx`
  - 開発用の編集オーバーレイ。添付、プロンプト入力、会話ログの表示を担当します。
- `EffectWarpDefs.tsx`
  - `CanvasEffect` などで使う SVG filter 定義を描画します。
- `Header.tsx`
  - サイト上部のヘッダー。ロゴ、ナビゲーション、モバイルメニューを含みます。
- `RootClientShell.tsx`
  - ルート全体に入るクライアント用シェル。効果レイヤーの注入と開発用 bridge の表示を制御します。
- `RingScrollShowcase.tsx`
  - メインの縦スクロール演出を持つショーケース。リング描画とセクション表示を統合します。
- `VideoRingOverlay.tsx`
  - リング内外の動画・画像を重ねて表示し、初期ロードや開放アニメーションを制御します。
- `everyOtherAnimationFrame.ts`
  - 1 フレームおきに処理を進めるための小さな `requestAnimationFrame` ヘルパーです。
- `ringScrollShowcaseGeometry.ts`
  - リング描画、スクロール量変換、色解決などの幾何計算と描画ユーティリティです。
- `useBridgeSession.ts`
  - bridge の状態取得、会話履歴、承認操作、保存復元をまとめた中核 hook です。
- `videoRingOverlayProgress.ts`
  - 動画や画像の読み込み進捗を集計して、オーバーレイの表示タイミングを決める補助関数群です。

補足:

- このディレクトリは UI の本体なので、型と実装の整合性が最優先です。
- 新しいファイルを追加したら、ここにも簡単な役割を書き足してください。

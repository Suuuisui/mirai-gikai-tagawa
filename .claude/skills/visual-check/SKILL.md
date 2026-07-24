---
name: visual-check
description: UI変更後にスマホ・PC両方の画面幅でスクリーンショットを撮って視覚的に確認し、崩れがあれば修正してからコミットするための必須ワークフロー。web/やadmin/の.tsx/.cssを変更したとき、コミット前に必ず実行する。
---

# visual-check — UI変更のビジュアル確認（コミット前必須）

UI変更（`web/src/`・`admin/src/` 配下の `.tsx`, `.css` 等）をコミットする前に、
**実際の画面を複数の画面幅で目視確認し、崩れを直してからコミットする**ためのワークフロー。
「改行が変」「はみ出している」「スマホで崩れる」を本番に出さないことが目的。

## 原則

1. **コードを変えたら、コミット前に必ずスクリーンショットで確認する**（推測で完了としない）
2. **スマホ幅（375px）とPC幅（1280px）の両方**で確認する
3. 崩れ・はみ出し・意図しない改行があれば**修正 → 再スクリーンショット**を繰り返し、
   確認が取れてからコミットする
4. スクリーンショットは Read ツールで**実際に画像を開いて見る**こと

## 前提（1回だけ）

```bash
# agent-browser CLI（ヘッドレスブラウザ）が必要
npm install -g agent-browser
```

ローカル環境の起動（`docs/20260716_1100_運用保守ガイド.md` も参照）:

```bash
npx supabase start
pnpm exec dotenv -e .env -- pnpm --filter web dev    # 公開サイト :3000
pnpm exec dotenv -e .env -- pnpm --filter admin dev  # 管理画面 :3001
```

## 手順

### 1. 対象ページを開く

公開サイト（ログイン不要）:

```bash
agent-browser --session vc open "http://localhost:3000/<変更したページ>"
```

admin（ローカルのシード管理者でログイン。初回のみ）:

```bash
agent-browser --session vc open "http://localhost:3001/login"
agent-browser --session vc snapshot -i   # @refを確認
agent-browser --session vc fill @e3 "admin@example.com"
agent-browser --session vc fill @e4 "admin123456"
agent-browser --session vc click @e5
agent-browser --session vc wait 3000
agent-browser --session vc open "http://localhost:3001/<変更したページ>"
```

### 2. PC幅とスマホ幅でフルページスクリーンショット

```bash
agent-browser --session vc set viewport 1280 900
agent-browser --session vc screenshot --full <scratchpad>/desktop.png

agent-browser --session vc set viewport 375 812
agent-browser --session vc wait 1000
agent-browser --session vc screenshot --full <scratchpad>/mobile.png
```

→ **Read ツールで両方の画像を開き、目視で確認する。** 見るポイント:

- テキストのはみ出し・カード外への溢れ・不自然な改行位置
- スマホ幅でのカード/グリッドの崩れ、ボタンの折返し
- 余白・整列の乱れ、要素の重なり

### 3. 機械的チェック（併用推奨）

```bash
# 横スクロール（はみ出し）が発生していないか
agent-browser --session vc eval "document.documentElement.scrollWidth <= window.innerWidth ? 'OK' : 'OVERFLOW ' + document.documentElement.scrollWidth + 'px'"

# コンソールエラー（hydration mismatch等）がないか
agent-browser --session vc errors
```

### 4. 問題があれば修正 → 手順2からやり直し

ソースコードを修正し、HMR反映後（または `agent-browser --session vc reload`）に
再度スクリーンショットを撮って確認する。**確認が取れるまでコミットしない。**

### 5. 確認できたらコミットへ

コミットメッセージ・PR・報告には、確認した画面幅と結果を一言添える
（例:「375px/1280pxで表示確認済み」）。

## 補足

- 本番デプロイ後も同じ手順でURLを本番（https://tagawa-gikai.jp）に変えて最終確認できる
- インタラクション（ボタン押下後の状態など）も `snapshot -i` → `click @ref` → screenshot で確認できる。
  詳細は `agent-browser` スキル参照
- Claude Code の Browser ペイン（preview_start）でも代用可能だが、ペイン非表示時に
  スクリーンショットが不安定なため、確実性が必要な確認は agent-browser を使うこと

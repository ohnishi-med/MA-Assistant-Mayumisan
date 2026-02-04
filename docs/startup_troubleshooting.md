# MA-Assistant-Mayumisan 起動トラブルシューティング報告

## 概要
本環境におけるアプリケーション起動失敗の問題を解決しました。
主な原因は環境変数設定によるElectronの誤動作でしたが、環境依存性を低減するためにプロジェクト構成の変更も実施しました。

## 原因
環境変数 `ELECTRON_RUN_AS_NODE=1` が設定されていたため、ElectronがGUIアプリケーションとしてではなく、通常のNode.jsプロセスとして起動していました。
これにより、アプリケーション内で `require('electron')` を実行してもElectronのAPI（`app`, `BrowserWindow`など）がロードされず、`undefined` （またはパス文字列）となることで起動エラーが発生していました。

## 実施した対策

### 1. 環境変数の無効化
起動時に `ELECTRON_RUN_AS_NODE` を無効化することで、Electronを正常に動作させるようにしました。

### 2. プロジェクト構成の変更（CommonJS化）
ESM（ECMAScript Modules）とElectron（CommonJS）の相互運用エラー（`SyntaxError: ... does not provide an export named ...`）を根本的に回避するため、プロジェクト全体をCommonJSベースに戻しました。
- `package.json` から `"type": "module"` を削除
- ソースコード（`src/main/*.ts`）のインポート構文を標準的な `import { app } from 'electron'` に統一

### 3. Electronのダウングレード
検証過程で最新版（v40.1.0）の挙動に不安定な点が見られたため、実績のある安定版である v33.4.11 へダウングレードしました。

## 正しい起動方法
環境変数が設定されている場合でも確実に起動できるよう、以下のコマンドを使用することを推奨します（環境変数を一時的にクリアして起動します）。

**Command Prompt (cmd.exe):**
```cmd
set ELECTRON_RUN_AS_NODE=&& npm run dev
```

**PowerShell:**
```powershell
$env:ELECTRON_RUN_AS_NODE=""; npm run dev
```

通常は `npm run dev` で起動しますが、もし再びエラーが発生した場合は上記試してください。

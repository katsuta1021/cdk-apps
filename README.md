# React × AWS CDK 質問フォームアプリ構築手順

このプロジェクトは、AWS CDK によって以下の構成をデプロイします：

- React + MUI による質問フォーム UI（CloudFront + S3）
- Lambda + API Gateway による投稿処理
- DynamoDB による質問の蓄積
- `sessions.json` により、講座（Day1, Day2 など）のプルダウン制御

---

## 📁 ディレクトリ構造（主要ファイル）

```
.
├── assets/                  # HTML版（旧）
├── react-frontend/         # React + MUI フロントエンド
│   ├── public/sessions.json
│   └── src/App.tsx         # UI 本体
├── lambda/write-question/  # Lambda 処理
│   └── index.ts
├── lib/new-cdk-app-stack.ts # CDK スタック定義
└── deploy.sh               # CloudShell デプロイスクリプト
```

---

## 🚀 CloudShell でのデプロイ手順

以下をコピペでそのまま実行可能です：

```bash
# CloudShell 環境の準備
mkdir /tmp/testdir
cd /tmp/testdir/
export npm_config_cache=/tmp/npm-cache
export npm_config_prefix=/tmp/npm-global
sudo npm install -g aws-cdk@latest

# deploy.sh の作成
mkdir -p /tmp/testdir && cat << 'EOF' > /tmp/testdir/deploy.sh
#!/bin/bash
git pull
npm run build
npx cdk deploy
EOF
chmod +x /tmp/testdir/deploy.sh

# リポジトリのクローンとセットアップ
cd /tmp/testdir/
git clone https://github.com/katsuta1021/cdk-apps.git
cd /tmp/testdir/cdk-apps
git checkout react
git pull
npm install
npm install --save-dev @types/aws-lambda
npm install aws-lambda @aws-sdk/client-s3
npm install @aws-sdk/client-dynamodb

# React フロントエンド構築
cd /tmp/testdir/cdk-apps/react-frontend
npm install
npm install @mui/material @emotion/react @emotion/styled
npm run build

# CDK デプロイ
cd /tmp/testdir/cdk-apps
npm run build
npx cdk deploy
```

---

## 🌐 アクセス

CDK 実行後に `CloudFront URL` および `API Gateway URL` が出力されます。

- Web: `https://<your-cloudfront-domain>`
- API: `https://<your-api-id>.execute-api.<region>.amazonaws.com/prod/submit`

---

## 🔧 講座リストの更新（プルダウン制御）

`react-frontend/public/sessions.json` に講座名を配列形式で記述してください。

```json
[
  "Day1",
  "Day2",
  "特別講座"
]
```

このファイルは S3 に `index.html` と共にアップロードされます。

---

## 🛠 補足メモ

- React 側では `fetch("/sessions.json")` でプルダウン内容を読み込みます。
- CloudFront キャッシュが原因で更新が反映されない場合は「Invalidations」でキャッシュ削除が必要です。
- HTML/CSS ベースの旧版UIは `assets/index.html` にあります。

---

## 📌 使用ライブラリ

- AWS CDK
- AWS Lambda
- API Gateway
- DynamoDB
- S3 + CloudFront
- React + TypeScript + MUI

---

## 🙋‍♂️ その他

質問データは `sessionId`（講座名）付きでDynamoDBに蓄積され、後で講座ごとに分類・集計が可能です。

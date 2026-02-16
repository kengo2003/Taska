## Taska

ディレクトリ構成

```
.
├── app/               # Next.js App Router
│   ├── (main)/        # 認証後メインページ群
│   └── api/           # S3操作、認証、チャット等のバックエンドAPI
├── components/        # 再利用可能なReactコンポーネント
│   ├── Admin/         # 管理者用機能（CSV登録・ファイル管理）
│   ├── Chat/          # チャットUI・履歴管理
│   └── ui/            # shadcn/ui ベースの基本コンポーネント
├── lib/               # 共有ユーティリティ (S3操作ロジック, JWT, Utils)
├── public/            # 静的アセット
└── types/             # TypeScript型定義
```

### パッケージのインストール

```bash
npm install
```

### 実行方法

```bash
npm run dev
```

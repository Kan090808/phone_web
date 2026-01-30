# Phone Specs Dashboard

這是一個可部署到 GitHub Pages 的靜態網頁專案，透過每日 GitHub Action 取得可靠新聞來源的文章，整理成手機規格 JSON，並在首頁提供搜尋、篩選與比較功能。

## 功能

- 顯示所有機型規格，並提供搜尋欄快速過濾。
- 可自行勾選要顯示的規格欄位，方便進行對比。
- JSON 資料每日更新，避免同一機型重複資料。

## 專案結構

```
.
├── index.html          # 主頁
├── styles.css          # 樣式
├── app.js              # 前端互動邏輯
├── data/
│   ├── specs.json      # 當前規格資料 (由 Action 更新)
│   ├── specs_seed.json # 種子資料，用於匹配 RSS 並補齊規格
│   └── sources.json    # RSS 來源清單
├── scripts/
│   └── update-specs.mjs # 更新規格 JSON 腳本
└── .github/workflows/
    └── update-specs.yml
```

## 部署到 GitHub Pages

1. 到 GitHub Repo 設定頁面 → **Pages**。
2. 選擇 `main` branch，資料夾選擇 `/root`。
3. 儲存後會得到站台連結。

## 更新資料

### 本地更新

```
node scripts/update-specs.mjs
```

### GitHub Action

每天 UTC 00:00 自動執行：

- 讀取 `data/sources.json` 的 RSS
- 匹配 `data/specs_seed.json` 內的機型 aliases
- 產出 `data/specs.json`

## 注意事項

- 目前 RSS 取回文章標題，主要用於比對機型名稱。
- 如果想新增機型，請在 `data/specs_seed.json` 中補上規格與別名。

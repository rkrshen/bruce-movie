# 澤影映像電影特效（Bruce Movie VFX）官方網站

- **正式站**：[https://brucemovie.com](https://brucemovie.com)（英文版：[https://brucemovie.com/en](https://brucemovie.com/en)）
- **Cloudflare Pages 預覽站**：[https://bruce-movie.pages.dev](https://bruce-movie.pages.dev)
- **更新日誌**：[`CHANGELOG.md`](./CHANGELOG.md)
- **部署與 DNS 維運手冊**：[`DEPLOYMENT.md`](./DEPLOYMENT.md)

本專案採用 **Astro 7 + TypeScript（純靜態 SSG）** 搭配 **Cloudflare Pages** 建置，針對安全性、2027 電影深色質感 UI/UX、Core Web Vitals 效能、中英雙語 SEO（`zh-TW` / `en`）與 WCAG 2.1 AA 無障礙標準進行全面升級。

---

## 技術架構與核心特性

- **框架與建置**：Astro 7（靜態輸出 `dist/`）、Node.js 24 LTS（[`.node-version`](./.node-version)）、TypeScript Strict Mode、`@astrojs/sitemap`、`sharp` 響應式 WebP 圖片最佳化（自動剝除 EXIF/GPS）。
- **2027 電影質感介面與原生效能**：全站僅約 `6.3 KB` JS（gzip）與 `10.7 KB` CSS（gzip），採用原生 CSS Scroll-Driven Animations、Cross-Document View Transitions、原生 `<dialog>` 行動版側滑導覽抽屜與全螢幕照片燈箱、2015–2024 互動式發光作品時間軸，零外部 Font Awesome / Google Fonts CDN 阻塞。
- **HTTP 安全標頭**：透過 [`public/_headers`](./public/_headers) 設定 HSTS、嚴格 CSP（`script-src` 無 `unsafe-inline`、`connect-src` 嚴格白名單）、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy` 與 `/_astro/*` 不可變長期快取。
- **可靠聯絡表單寄信**：預設透過瀏覽器直連 Web3Forms API（搭配 Honeypot 誘捕與 `:user-invalid` + ARIA 同步驗證），另保留 [`functions/api/contact.ts`](./functions/api/contact.ts) 供選配 **Cloudflare Turnstile + Resend API** 伺服器端寄信。
- **雙語靜態預渲染**：建置期輸出 `/index.html`（`zh-TW`）、`/en.html`（`/en`，HTTP 200，含全數 84 筆作品紀錄中英對照）、`/404.html` 與完整 Open Graph / Twitter Card / `hreflang` / JSON-LD。

---

## 本機開發與驗證指令

需求：Node.js `>= 22.23.4`（建議使用 **Node.js 24 LTS**，已定義於 [`.node-version`](./.node-version)）。

```bash
# 1. 安裝依賴
npm ci

# 2. 啟動本機開發伺服器（預設 http://localhost:4321）
npm run dev

# 3. 執行 Astro 與 Cloudflare Functions 型別檢查
npm run check

# 4. 建置正式靜態檔案至 dist/
npm run build

# 5. 本機預覽建置成果
npm run preview
```

---

## 日常開發與部署流程（Git 分支與 Cloudflare Pages CI/CD）

目前正式站 `https://brucemovie.com` 已綁定 Cloudflare Pages 專案 **`bruce-movie`**，並監聽 GitHub 倉庫的 **`master`** 分支。

### 1. 下次開始開發時（同步最新分支）

日常開發或暫存變更建議在 **`develop`**（或功能分支）進行，避免每次 commit 都直接觸發正式站改版：

```bash
# 抓取遠端最新分支資訊
git fetch origin

# 切換至 develop 分支並同步最新進度
git checkout develop
git pull origin develop
```

### 2. 開發中儲存進度（不觸發正式站部署）

- **推送到 `develop` 分支**：不會影響正式站 `brucemovie.com`。
- **若連 Cloudflare 預覽建置與 GitHub Actions CI 都想略過**（例如僅更新文件或半成品暫存），可在 commit 訊息結尾加上 `[CF Pages Skip] [skip ci]`：

```bash
git add -A
git commit -m "docs: update project notes [CF Pages Skip] [skip ci]"
git push origin develop
```

### 3. 正式上線發布（自動觸發 CI/CD 部署至 `brucemovie.com`）

當功能在 `develop` 開發完成且本機驗證無誤後，合併回 `master` 並推送，即可自動發布至正式站：

```bash
# 1. 本機先跑完型別檢查與建置測試
npm run check && npm run build

# 2. 切換至 master 並合併 develop
git checkout master
git pull origin master
git merge develop

# 3. 推送至 GitHub master（自動觸發 GitHub Actions CI 與 Cloudflare Pages 正式站部署）
git push origin master
```

推送後約 **1 分鐘**，Cloudflare Pages 即會自動完成建置並零停機更新 `https://brucemovie.com` 與 `https://brucemovie.com/en`。

---

## 常用內容維護位置

- **網站基本資料、電話、信箱、Web3Forms 金鑰與社群網址**：[`src/data/site.ts`](./src/data/site.ts)（含日後替換官方 Instagram 網址位置）
- **媒體素材、活動照片、特效影片、得獎輪播、2015–2024 作品年表（中英雙語）**：[`src/data/content.ts`](./src/data/content.ts)
- **繁體中文文案**：[`src/i18n/zh-TW.ts`](./src/i18n/zh-TW.ts)
- **英文版文案**：[`src/i18n/en.ts`](./src/i18n/en.ts)
- **全域視覺樣式與動畫系統**：[`src/styles/global.css`](./src/styles/global.css)
- **前端互動邏輯（導覽抽屜、燈箱、時間軸、輪播、表單）**：[`src/scripts/site.ts`](./src/scripts/site.ts)

# 澤影映像電影特效（Bruce Movie VFX）官方網站

正式站：[https://brucemovie.com](https://brucemovie.com)

本專案採用 **Astro + TypeScript（純靜態 SSG）** 搭配 **Cloudflare Pages & Pages Functions** 建置，針對安全性、Core Web Vitals 效能、雙語 SEO（`zh-TW` / `en`）與 WCAG 2.1 AA 無障礙標準進行全面升級。

## 技術架構與安全特性

- **框架與建置**：Astro（靜態輸出 `dist/`）、TypeScript Strict Mode、`@astrojs/sitemap`、`sharp` 響應式 WebP 圖片最佳化（自動剝除 EXIF/GPS）。
- **現代化電影質感介面與原生效能**：採用 2027 電影深色視覺系統、原生 CSS Scroll-Driven Animations、Cross-Document View Transitions、原生 `<dialog>` 行動版側抽屜與燈箱檢視器、互動式年度作品時間軸（2015–2024），全站零外部 Font Awesome / Google Fonts 阻塞。
- **HTTP 安全標頭**：透過 [`public/_headers`](./public/_headers) 設定 HSTS、嚴格 CSP（`script-src` 無 `unsafe-inline`、`connect-src` 嚴格白名單）、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy` 與 `/_astro/*` 不可變長期快取。
- **可靠聯絡表單寄信**：預設透過瀏覽器直連 Web3Forms API（搭配 Honeypot 誘捕與完整表單驗證，於 GitHub Pages、Cloudflare Pages 與本機皆可正常寄信），另保留 [`functions/api/contact.ts`](./functions/api/contact.ts) 供未來選配 **Cloudflare Turnstile + Resend API** 伺服器端寄信。
- **雙語靜態預渲染**：建置期輸出 `/index.html`（`zh-TW`）、`/en.html`（`/en`，HTTP 200）、`/404.html` 與完整 Open Graph / Twitter Card / `hreflang` / JSON-LD。

## 本機開發與驗證

需求：Node.js `>= 20`（建議 Node 22）。

```bash
# 安裝依賴
npm ci

# 啟動本機開發伺服器
npm run dev

# 型別與 Astro 靜態檢查（含 Cloudflare Functions）
npm run check

# 建置正式靜態檔案至 dist/
npm run build

# 預覽建置結果
npm run preview
```

## 常用內容更新位置

- **網站基本資料、電話、信箱與社群網址**：[`src/data/site.ts`](./src/data/site.ts)（含 Instagram 帳號替換位置）
- **媒體素材、活動、特效影片、得獎輪播、作品年表**：[`src/data/content.ts`](./src/data/content.ts)
- **中文與英文文案**：[`src/i18n/zh-TW.ts`](./src/i18n/zh-TW.ts)、[`src/i18n/en.ts`](./src/i18n/en.ts)

## 上線部署與 Cloudflare 設定

完整 DNS 遷移（Gandi → Cloudflare）、Cloudflare Pages 部署、Turnstile 人機驗證與 SPF/DMARC/CAA 安全設定步驟請參閱 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

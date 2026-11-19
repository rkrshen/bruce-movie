# 澤影映像電影特效（Bruce Movie VFX）官方網站

正式站：[https://brucemovie.com](https://brucemovie.com)

本專案採用 **Astro + TypeScript（純靜態 SSG）** 搭配 **Cloudflare Pages & Pages Functions** 建置，針對安全性、Core Web Vitals 效能、雙語 SEO（`zh-TW` / `en`）與 WCAG 2.1 AA 無障礙標準進行全面升級。

## 技術架構與安全特性

- **框架與建置**：Astro（靜態輸出 `dist/`）、TypeScript Strict Mode、`@astrojs/sitemap`、`sharp` 響應式 WebP 圖片最佳化（自動剝除 EXIF/GPS）。
- **零前端框架執行期負擔**：全站產出約 `6 KB` JS（gzip `2.2 KB`）與 `17 KB` CSS（gzip `4.3 KB`），無外部 Font Awesome / Google Fonts 阻塞與供應鏈風險。
- **HTTP 安全標頭**：透過 [`public/_headers`](./public/_headers) 設定 HSTS、嚴格 CSP（`script-src` 無 `unsafe-inline`）、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy` 與 `/_astro/*` 不可變長期快取。
- **表單後端防護**：[`functions/api/contact.ts`](./functions/api/contact.ts) 透過 Cloudflare Pages Function 執行來源網域檢查、欄位長度與格式驗證、Honeypot 誘捕、**Cloudflare Turnstile 後端驗證**，並將 `WEB3FORMS_ACCESS_KEY` 保留於伺服器端機密變數不外洩至瀏覽器。
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

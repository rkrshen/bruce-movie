# 更新日誌（Changelog）

本文件記錄澤影映像電影特效（Bruce Movie Special Effects）官方網站（[https://brucemovie.com](https://brucemovie.com)）的所有重大架構升級、UI/UX 改版、安全性強化與部署變更。

---

## [2.1.1] — 2026-11-19

### SEO 進階優化、流量監測整備與金馬獎文案校訂
- **修正 Hero LCP 預載不一致**（[`src/data/content.ts`](./src/data/content.ts)、[`src/layouts/BaseLayout.astro`](./src/layouts/BaseLayout.astro)、[`src/components/Hero.astro`](./src/components/Hero.astro)）：
  - 抽離共用常數 `HERO_IMAGE_CONFIG` 統一首圖 `widths`、`sizes`、`format` 與 `quality`，消除 `<link rel="preload">` 與 `<img>` 產出不同 WebP hash 導致重複下載的問題。
- **升級結構化資料（JSON-LD `@graph`）與合規品牌 Logo**（[`src/layouts/BaseLayout.astro`](./src/layouts/BaseLayout.astro)、[`src/data/site.ts`](./src/data/site.ts)、[`public/logo.png`](./public/logo.png)）：
  - 產出 EXIF 剝除、實心黑底的獨立靜態品牌 Logo [`public/logo.png`](./public/logo.png)（`714×396`，符合 Google 結構化資料 `>= 112×112` 與白底可視性建議）並於 [`public/_headers`](./public/_headers) 加入快取設定。
  - 以 `@id` 串聯 `WebSite`（Site Name 規範）、`Organization`（`legalName`、`ImageObject` logo、`areaServed`、`knowsAbout`、`award`）、`Person`（創辦人中英文名、職稱、獎項）與 `WebPage` 四大 Schema 實體。
- **Meta 精簡、Robots 預覽指令與 404 頁面清理**（[`src/i18n/zh-TW.ts`](./src/i18n/zh-TW.ts)、[`src/i18n/en.ts`](./src/i18n/en.ts)、[`src/layouts/BaseLayout.astro`](./src/layouts/BaseLayout.astro)）：
  - 將英文版 `title`（57 字元）、`description`（158 字元）與中文版 `description`（65 字元）調整至搜尋結果最佳顯示長度。
  - 可索引頁面補齊 `max-image-preview:large, max-snippet:-1, max-video-preview:-1`；`404.html`（`noindex`）不再輸出首頁 `og:url`、首頁 `og:description` 與首頁 JSON-LD。
- **多語系 Sitemap 強化**（[`astro.config.mjs`](./astro.config.mjs)）：
  - 移除未使用的 XML namespace、加入 `lastmod`，並在 `sitemap-0.xml` 補齊 `x-default` 語系對應連結。
- **流量監測整備（Google Search Console + Cloudflare Web Analytics）**（[`public/_headers`](./public/_headers)、[`DEPLOYMENT.md`](./DEPLOYMENT.md)）：
  - 於嚴格 CSP 中放行 `https://static.cloudflareinsights.com`（`script-src`）與 `https://cloudflareinsights.com`（`connect-src`），支援 Cloudflare Pages 一鍵開啟免 Cookie 的 Web Analytics，並於 [`DEPLOYMENT.md`](./DEPLOYMENT.md) 記錄完整啟用與 GSC 提交步驟。
- **金馬獎屆次文案更正**（[`src/data/content.ts`](./src/data/content.ts)、[`src/i18n/zh-TW.ts`](./src/i18n/zh-TW.ts)、[`src/i18n/en.ts`](./src/i18n/en.ts)）：
  - 將得獎輪播中英文標題、`alt` 與 JSON-LD 獎項由「第58屆」更正為「第59屆金馬獎－年度台灣傑出電影工作者（59th Golden Horse Awards）」，與站內金馬官方海報一致。

---

## [2.1.0] — 2026-11-19

### 1. 2027 電影深色質感 UI/UX 全面重構（內容 100% 保留）
- **視覺設計系統（Obsidian & Molten Ember）**（[`src/styles/global.css`](./src/styles/global.css)）：
  - 以深邃暗房黑（`#0a0a0c`～`#1c1e26`）搭配實拍火效焰橘（`#f96332`）與金馬暖金（`#e4b668`）取代舊版平面灰底。
  - 導入漸進式 `in oklab` / `in oklch` 色彩插值漸層、流體字級 `clamp()`、標題 `text-wrap: balance` 與內文 `text-wrap: pretty`。
- **現代瀏覽器原生動效（零第三方動畫庫負擔）**（[`src/scripts/site.ts`](./src/scripts/site.ts)）：
  - **頂部捲動進度火線**：採用原生 CSS Scroll-Driven Animations（`animation-timeline: scroll(root block)`）搭配無支援瀏覽器之輕量 `requestAnimationFrame` 回退。
  - **跨頁視圖轉場**：中／英文頁面切換支援原生 Cross-Document View Transitions（`@view-transition { navigation: auto; }`）。
  - **懸浮毛玻璃膠囊導覽列與 Scrollspy**：支援原生 `scroll-target-group: auto` 與 `:target-current`（搭配 `IntersectionObserver` 回退），自動標示目前所在章節并同步 `aria-current="true"`；品牌 Logo 採用深色毛玻璃膠囊融合設計。
  - **Hero 全幅劇院主視覺**（[`src/components/Hero.astro`](./src/components/Hero.astro)）：改採 `svh` 視口高度、電影觀景窗四角定位框、原生捲動視差，以及極輕量緩升餘燼火星 `<canvas>`（離開視口或切換分頁時自動暫停，`prefers-reduced-motion: reduce` 自動停用）。
- **六大核心章節版面與互動升級**：
  - **01 澤影簡介（Editorial Bento 雜誌網格）**（[`src/components/AboutSection.astro`](./src/components/AboutSection.astro)）：移除舊版易破版的負邊距定位，左側完整呈現創辦人片場照、發光引言宣言卡、**無裁切完整 16:9 金馬獎視覺海報**與幕後花絮；右側以 `01`～`03` 編號卡片搭配桌機滑鼠聚光微光效（Pointer Spotlight）。
  - **02 媒體報導（雙欄放映廳）**（[`src/components/MediaReportSection.astro`](./src/components/MediaReportSection.astro)）：桌機改為雙欄 16:9 並列劇院卡片，具備物理彈性曲線（`linear()`）播放鈕與「播放新影片時自動暫停其他影片」機制。
  - **03 活動分享（可滑動卡片畫廊 + 原生 `<dialog>` 燈箱）**（[`src/components/ActivitySection.astro`](./src/components/ActivitySection.astro)、[`src/components/LightboxDialog.astro`](./src/components/LightboxDialog.astro)）：每張活動卡內建橫向 `scroll-snap` 照片畫廊、縮圖切換列與計數器（`1 / 3`），大幅縮減行動版垂直捲動長度；點擊任意活動照或得獎作品可開啟原生 Top-Layer `<dialog>` 全螢幕燈箱（支援 `@starting-style` 進退場動畫、鍵盤左右鍵、觸控滑動、背景點擊與 `Esc` 關閉）。
  - **04 特效範例（可見文字＋圖示動態滑動標籤）**（[`src/components/EffectsSection.astro`](./src/components/EffectsSection.astro)）：修正舊版純圓形圖示無文字標籤問題，改為圖示＋清晰分類名稱膠囊列，搭配平滑滑動的焰橘背景指示器。
  - **05A 參與作品得獎輪播**（[`src/components/AwardsCarousel.astro`](./src/components/AwardsCarousel.astro)）：改為原生橫向 `scroll-snap` 劇院膠卷輪播，同時完美容納直式電影海報與橫式金馬獎主視覺，不再裁切海報文字。
  - **05B 2015–2024 互動式發光作品時間軸**（[`src/components/RecordsSection.astro`](./src/components/RecordsSection.astro)）：
    - 新增「年度時間軸（68）」、「MV（11）」、「廣告（5）」三模式切換。
    - 垂直時間軸中軸線隨捲動進度發光點亮（`animation-timeline: view()`）。
    - 上方配備橫向「年份快速跳轉列」（含 CSS Scroll-Driven 邊緣捲動淡出提示）與「展開全部年份／精簡時間軸」一鍵切換。
    - 預設展開近三年（2024–2022），其餘年份以原生 `<details>` 節點收合（支援瀏覽器 `Ctrl+F` 站內搜尋自動展開與完整 SEO 索引）。
  - **06 聯絡我們（雙欄製片聯絡檯）**（[`src/components/ContactSection.astro`](./src/components/ContactSection.astro)）：左側整合一鍵撥號、Email 與**一鍵複製信箱按鈕**（含「已複製信箱」狀態回饋）；右側表單提供清晰可見 `<label>`、`field-sizing: content` 自動長高訊息框、以及互動後才觸發的 `:user-invalid` + ARIA 同步無障礙驗證。

### 2. 行動裝置（Mobile-First）深度最佳化
- **原生 `<dialog>` 行動版側滑導覽抽屜**（[`src/components/Navbar.astro`](./src/components/Navbar.astro)）：提供 `01`～`06` 章節導覽、直撥電話／信箱快捷鍵、社群與語系切換。
- **螢幕安全區域與防誤觸**：支援 `viewport-fit=cover` 與 `env(safe-area-inset-*)`；觸控裝置（`@media (pointer: coarse)`）互動目標至少 `44×44px`；表單輸入框字級固定 `1rem (16px)` 防止 iOS Safari 聚焦自動放大；通過 `320px`（WCAG 1.4.10 Reflow）、`390px` 與 `1440px` 零水平溢位實測。

### 3. 聯絡我們寄信功能修復與驗證
- **問題診斷**：實測確認 Web3Forms 免費方案會阻擋 Cloudflare Workers / 伺服器端發出的 `POST` 請求（回傳 `HTTP 403`），其 `access_key` 為官方設計之前端公開表單識別碼。
- **修復方案**：
  - 預設改由瀏覽器端直連 `https://api.web3forms.com/submit`（集中設定於 [`src/data/site.ts`](./src/data/site.ts)，支援 `PUBLIC_WEB3FORMS_ACCESS_KEY` 覆寫），補上 `replyto` 與前端 Honeypot 過濾，並於 [`public/_headers`](./public/_headers) 的 CSP `connect-src` / `form-action` 放行 `https://api.web3forms.com`。
  - 升級選配後端 [`functions/api/contact.ts`](./functions/api/contact.ts) 改接 **Resend API + Cloudflare Turnstile**（設定 `PUBLIC_CONTACT_ENDPOINT=/api/contact` 即可啟用）。

### 4. 英文版（`/en`）全面精校與 84 筆作品紀錄雙語化
- **創辦人英文姓名統一**：全站（含 JSON-LD、引言、介紹、圖片 `alt`）統一為 **`Ming-Ze Chen`**（與金馬獎官方海報 `CHEN MING-ZE` 一致）。
- **英文文案忠實度與影視專業術語校潤**（[`src/i18n/en.ts`](./src/i18n/en.ts)）：
  - 補回漏譯之「全台灣目前唯一」與「文化部、經濟部」主管機關認證、TCCF「首次參與」與未來展望語氣、創辦人「火燒或爆炸場面」、名師講堂講者稱謂（`Bao Chu` / `Brother Piu`）等細節。
  - 修正中式英文為國際影視圈標準術語（`on-set practical special effects`、`pyrotechnics supervisor`、`Licensed Pyrotechnic Imports`、`Selected Credits`、`Open for Collaborations`）。
- **84 筆作品紀錄完整英文化**（[`src/data/content.ts`](./src/data/content.ts)）：為 2015–2024 共 68 筆年度作品、11 筆 MV 與 5 筆廣告補齊官方英文片名、英文類型前綴與中文原名對照。

### 5. Cloudflare Pages 正式站上線與執行環境固定
- 新增 [`.node-version`](./.node-version)（指定 Node `24` LTS）並更新 [`package.json`](./package.json) `engines.node`（`>=22.23.4`）與 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)。
- 完成 `brucemovie.com` DNS 移轉至 Cloudflare（保留 Gandi `MX` / `SRV` 郵件與 Google Search Console 驗證紀錄），綁定 `brucemovie.com` 與 `www.brucemovie.com` 至 Cloudflare Pages（`bruce-movie.pages.dev`），正式站 HTTPS、HSTS、CSP 與收信功能皆已驗證通過。

---

## [2.0.0] — 2026-11-19

### Astro 7 靜態 SSG 框架改寫與全方位資安強化
- **移除舊版高風險依賴**：移除 Vue 2 / Webpack 4 / Babel / Element UI / Bootstrap 等含有歷史漏洞之舊套件，改以 **Astro 7 + TypeScript Strict Mode** 建置純靜態網站（`npm audit` **0 vulnerabilities**）。
- **第三方供應鏈與隱私強化**：移除外部 Font Awesome、Google Fonts CDN，改用內嵌 SVG 圖示（[`src/components/Icons.astro`](./src/components/Icons.astro)）與系統字體堆疊；YouTube 嵌入改為 `youtube-nocookie.com` 點擊才載入之隱私預覽（Facade）。
- **圖片最佳化與中繼資料清理**：透過 `sharp` 於建置期自動轉檔響應式 WebP 並剝除 EXIF/GPS 資訊。
- **HTTP 安全標頭與雙語 SEO**：建立 [`public/_headers`](./public/_headers)、`robots.txt`、`/.well-known/security.txt`、自動產生 `sitemap-index.xml`、雙語靜態路由（`/` 與 `/en` 回傳 HTTP 200）、Open Graph / Twitter Card / `hreflang` 與 `Organization` JSON-LD。
- **CI 與自動化依賴巡檢**：新增 GitHub Actions CI（[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)，Action SHA Pinned）與 Dependabot（[`.github/dependabot.yml`](./.github/dependabot.yml)）。

# Cloudflare Pages 正式環境架構與部署維運手冊

本文件記錄 `brucemovie.com` 正式站於 **Cloudflare DNS + Cloudflare Pages** 的目前線上架構設定、日常自動化 CI/CD 部署流程、緊急回滾方式，以及聯絡表單與郵件安全設定。

---

## 一、目前正式環境設定總覽（已於 2026-11-19 完成上線）

| 項目 | 目前線上設定值 |
| :--- | :--- |
| **正式主網域** | `https://brucemovie.com`（中：`/`、英：`/en`） |
| **次要網域** | `https://www.brucemovie.com`（已綁定 SSL 憑證） |
| **Cloudflare Pages 專案名稱** | `bruce-movie`（預覽網址：`https://bruce-movie.pages.dev`） |
| **GitHub 連動倉庫** | `rkrshen/bruce-movie` |
| **正式環境分支（Production branch）** | `master` |
| **日常開發分支（Development branch）** | `develop` |
| **Node.js 執行環境版本** | Node `24`（由根目錄 [`.node-version`](./.node-version) 自動指定） |
| **組建命令（Build command）** | `npm run build` |
| **組建輸出目錄（Build output directory）** | `dist` |
| **網域註冊商** | Gandi.net（僅代管網域註冊與公司信箱 `MX` / `SRV`） |
| **Cloudflare 權威名稱伺服器（Nameservers）** | `elinore.ns.cloudflare.com`、`rajeev.ns.cloudflare.com` |

---

## 二、日常開發後的部署與維運流程

### 1. 標準發布流程（`develop` → `master`）

1. **在 `develop` 分支開發與驗證**：
   ```bash
   git checkout develop
   git pull origin develop
   # 修改程式碼或文案後，於本機執行靜態型別檢查與建置驗證
   npm run check && npm run build
   ```
2. **暫存推送（不部署正式站）**：
   - 若僅想把進度推上 GitHub 備份、不想觸發任何 CI 或 Cloudflare 預覽建置，請在 commit 訊息加上 `[CF Pages Skip] [skip ci]`：
     ```bash
     git commit -m "chore: save WIP [CF Pages Skip] [skip ci]"
     git push origin develop
     ```
3. **合併至 `master` 自動部署正式站**：
   ```bash
   git checkout master
   git pull origin master
   git merge develop
   git push origin master
   ```
   - 推送至 `master` 後：
     - **GitHub Actions CI**（[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)）會自動執行 `npm audit`、`npm run check` 與 `npm run build`。
     - **Cloudflare Pages** 會自動偵測 `master` 更新，於約 1 分鐘內完成建置並發布至 `https://brucemovie.com`。

### 2. 版本一鍵回滾（Rollback）

若新版本上線後發現內容需退回上一版：
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages → `bruce-movie` → 部署（Deployments）**。
2. 找到先前任一筆成功的 Production 部署紀錄，點擊右側 **`⋯` → 回滾至此部署（Rollback to this deployment）**，即可在數秒內無停機切換回舊版。

---

## 三、聯絡表單寄信架構與選配升級

> ℹ️ **技術背景（已實測驗證）**：Web3Forms 免費方案會阻擋所有伺服器端（含 Cloudflare Workers / Pages Functions）發出的 `POST` 請求並回傳 `HTTP 403`；其 `access_key` 本身即為官方設計的前端公開表單識別碼。

### 1. 目前線上模式：Web3Forms 瀏覽器直連（預設、免設環境變數）
- 前端表單直接向 `https://api.web3forms.com/submit` 發送 JSON 請求，寄信至 `brucemovie@gmail.com`（已於正式站實測收信正常）。
- 若日後需更換 Web3Forms Access Key，可於 **Cloudflare Pages → `bruce-movie` → 設定 → 環境變數** 新增 `PUBLIC_WEB3FORMS_ACCESS_KEY`（或直接修改 [`src/data/site.ts`](./src/data/site.ts) 中的 `web3formsAccessKey`）並重新部署。

### 2. 進階後端模式（選配：Cloudflare Pages Function + Resend + Turnstile）
若未來希望改由伺服器端 [`functions/api/contact.ts`](./functions/api/contact.ts) 寄信並加上 Cloudflare Turnstile 人機驗證：
1. 在 [Resend](https://resend.com/) 驗證 `brucemovie.com` 網域並取得 API Key（免費方案每月 3,000 封）。
2. 在 Cloudflare Dashboard → **Turnstile → Add widget**（`Domain`: `brucemovie.com`，`Widget Mode`: `Managed`）取得 **Site Key** 與 **Secret Key**。
3. 在 **Cloudflare Pages → `bruce-movie` → 設定 → 變數與機密（Variables and Secrets）** 設定以下變數並重新部署：

| 變數名稱 | 類型 | 說明 |
| :--- | :--- | :--- |
| `PUBLIC_CONTACT_ENDPOINT` | Plaintext（公開） | 設為 `/api/contact` 以切換至伺服器端寄信模式 |
| `PUBLIC_TURNSTILE_SITE_KEY` | Plaintext（公開） | Turnstile Site Key（前端顯示驗證元件用） |
| `TURNSTILE_SECRET_KEY` | **Secret（加密）** | Turnstile Secret Key（後端驗證用） |
| `RESEND_API_KEY` | **Secret（加密）** | Resend API Key（僅存於伺服器端） |
| `CONTACT_FROM_EMAIL` | Plaintext（公開） | 寄件人（如 `Bruce Movie <noreply@brucemovie.com>`） |
| `CONTACT_TO_EMAIL` | Plaintext（公開） | 收件人（預設 `brucemovie@gmail.com`） |

---

## 四、DNS 與網域安全進階設定（Cloudflare DNS）

目前 Cloudflare DNS 已完整保留 Gandi 郵件（`MX`、`SRV`、`webmail` 僅 DNS）與 Google Search Console 驗證紀錄。若欲進一步強化網域防護，可隨時於 Cloudflare **網站 → `brucemovie.com`** 調整：

1. **`www` 統一 301 轉址至主網域**（選配）：
   - 進入 **規則（Rules）→ 轉址規則（Redirect Rules）→ 建立規則**：
   - 當 `Hostname` `equals` `www.brucemovie.com` → Dynamic Redirect `concat("https://brucemovie.com", http.request.uri.path)`（Status code `301`，勾選 Preserve query string）。
2. **郵件防偽（SPF / DMARC）與憑證授權（CAA）**：
   - **SPF（`TXT` `@`）**：`v=spf1 include:_mailcust.gandi.net ~all`
   - **DMARC（`TXT` `_dmarc`）**：`v=DMARC1; p=quarantine; rua=mailto:brucemovie@gmail.com; pct=100;`
   - **CAA（`CAA` `@`）**：新增 `issue` `letsencrypt.org`、`pki.goog`、`digicert.com`。

---

## 五、正式站上線驗收狀態

- [x] `https://brucemovie.com/` 回傳 `HTTP/2 200`（`server: cloudflare`），HSTS、CSP、`X-Frame-Options: DENY`、`nosniff`、`Permissions-Policy` 等安全標頭全數生效。
- [x] `https://brucemovie.com/en` 直接開啟回傳 **`HTTP/2 200`**（全站英文文案與 84 筆作品紀錄雙語化完成）。
- [x] `https://www.brucemovie.com/` SSL 憑證已啟用並正常連線。
- [x] 正式站「聯絡我們」表單實際寄信與 `brucemovie@gmail.com` 收信測試正常。
- [ ] 待辦（選配）：將 [`src/data/site.ts`](./src/data/site.ts) 中的 `social.instagram` 替換為官方 Instagram 帳號網址。
- [ ] 待辦（選配）：至 Google Search Console 提交 `https://brucemovie.com/sitemap-index.xml`。

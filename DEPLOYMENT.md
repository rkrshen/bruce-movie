# Cloudflare Pages 部署與網域安全強化指南

本指南協助您在不更換原網域 `brucemovie.com` 的前提下，零停機將網站遷移至 **Cloudflare（免費方案）+ Cloudflare Pages**，一次完成 HTTPS 安全標頭、`www` 轉址、表單 Turnstile 防護與 DNS 郵件防偽設定。

---

## 步驟一：將 `brucemovie.com` DNS 接入 Cloudflare（免費方案）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Add a site** → 輸入 `brucemovie.com` → 選擇 **Free** 方案。
2. Cloudflare 會自動掃描現有 Gandi DNS 紀錄，**請務必核對以下紀錄完整保留（避免公司收信與 Google Search Console 中斷）**：
   - `MX` `brucemovie.com` → `10 spool.mail.gandi.net`、`50 fb.mail.gandi.net`
   - `TXT` `brucemovie.com` → `google-site-verification=qRXoIr7WV-rCE23IDDOKTnRx79Z4o6M8ITsoIckkB6M`
3. 依 Cloudflare 指示，到 **Gandi 網域後台**將 `brucemovie.com` 的 Nameservers 改為 Cloudflare 提供的兩組 NS。
4. 等待狀態變為 **Active**（通常 15 分鐘～數小時）。

---

## 步驟二：在 Cloudflare Pages 建立專案並部署

1. 在 Cloudflare Dashboard 進入 **Workers & Pages → Create → Pages → Connect to Git**。
2. 選擇 GitHub 倉庫 `rkrshen/rkrshen.github.io`，設定如下：
   - **Production branch**：`master`
   - **Framework preset**：`Astro`
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - **Environment variables（Production & Preview）**：
     - `NODE_VERSION` = `22`
3. 點擊 **Save and Deploy**，確認 `*.pages.dev` 預覽網址運作正常（含 `/`、`/en`、`/404`）。

---

## 步驟三：設定 Cloudflare Turnstile 與聯絡表單機密金鑰

> ⚠️ **安全提醒**：舊版正式站曾將 Web3Forms Access Key 直接暴露在前端 JavaScript 中，建議前往 [Web3Forms Dashboard](https://app.web3forms.com/) **重新產生一組新的 Access Key**（或至少開啟 Domain Whitelist 限制僅允許 `brucemovie.com`）。

1. 在 Cloudflare Dashboard 進入 **Turnstile → Add widget**：
   - **Domain**：新增 `brucemovie.com`（可選加上您的 `*.pages.dev` 測試網址）
   - **Widget Mode**：`Managed`
   - 取得 **Site Key** 與 **Secret Key**。
2. 回到 **Cloudflare Pages 專案 → Settings → Variables and Secrets**，設定以下環境變數（設定後需重新觸發一次部署使前端讀到 `PUBLIC_TURNSTILE_SITE_KEY`）：

| 變數名稱 | 類型 | 說明 |
| :--- | :--- | :--- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Plaintext（公開） | Turnstile Site Key（前端顯示驗證元件用） |
| `TURNSTILE_SECRET_KEY` | **Secret（加密）** | Turnstile Secret Key（`functions/api/contact.ts` 後端驗證用） |
| `WEB3FORMS_ACCESS_KEY` | **Secret（加密）** | Web3Forms Access Key（僅存於後端，不再外洩至瀏覽器） |

---

## 步驟四：綁定自訂網域 `brucemovie.com` 與 `www` HTTPS 轉址

1. 進入 **Cloudflare Pages 專案 → Custom domains → Set up a custom domain**：
   - 新增 `brucemovie.com`（Cloudflare 會自動建立 Proxied CNAME 並簽發免費 HTTPS 憑證）。
   - 新增 `www.brucemovie.com`（請先刪除原本指向 `webredir.vip.gandi.net` 的舊 CNAME 紀錄）。
2. 在 Cloudflare 網域管理頁 → **Rules → Redirect Rules → Create rule**，設定 `www` 統一 301 導向主網域：
   - **When incoming requests match**：`Hostname` `equals` `www.brucemovie.com`
   - **Then URL redirect**：Dynamic → `concat("https://brucemovie.com", http.request.uri.path)`，Status code `301`，勾選 **Preserve query string**。
3. 在 **SSL/TLS → Overview** 確認加密模式為 **Full (strict)**，並開啟 **SSL/TLS → Edge Certificates → Always Use HTTPS**。

---

## 步驟五：強化 DNS 郵件防偽造與憑證安全（SPF / DMARC / CAA）

在 Cloudflare **DNS → Records** 中調整以下紀錄：

1. **更新 SPF（取代原本寬鬆的 `?all`）**：
   - Type: `TXT`｜Name: `@`
   - Content: `v=spf1 include:_mailcust.gandi.net ~all`
   - （確認寄信一段時間皆正常後，可進一步收緊為 `-all`）
2. **強化 DMARC（取代原本的 `p=none`）**：
   - Type: `TXT`｜Name: `_dmarc`
   - 建議先設定觀察報告：`v=DMARC1; p=quarantine; rua=mailto:brucemovie@gmail.com; pct=100;`
   - 確認 Gandi 郵件 DKIM/SPF 報告正常後，可收緊至 `p=reject`。
3. **新增 CAA 紀錄（限制允許簽發 SSL 憑證的 CA 機構）**：
   - Type: `CAA`｜Name: `@`｜Tag: `issue`｜Value: `letsencrypt.org`
   - Type: `CAA`｜Name: `@`｜Tag: `issue`｜Value: `pki.goog`
   - Type: `CAA`｜Name: `@`｜Tag: `issue`｜Value: `digicert.com`

---

## 上線後驗收清單

- [ ] `https://brucemovie.com/` 回傳 `HTTP/2 200`，並可透過 [SecurityHeaders.com](https://securityheaders.com/) 驗證獲得 **A / A+**。
- [ ] `https://brucemovie.com/en` 直接開啟回傳 **`HTTP/2 200`**（不再是 404）。
- [ ] `https://www.brucemovie.com/` 正常以 HTTPS 301 轉址至 `https://brucemovie.com/`。
- [ ] 在 LINE / Facebook 分享檢錯工具中測試 `https://brucemovie.com/` 與 `https://brucemovie.com/en`，確認正常顯示 OG 預覽圖與摘要。
- [ ] 實際送出一筆聯絡表單測試，確認 Turnstile 驗證通過且 `brucemovie@gmail.com` 成功收信。
- [ ] 更新 [`src/data/site.ts`](./src/data/site.ts) 中的 `social.instagram` 為官方帳號網址後提交推送。
- [ ] 至 Google Search Console 重新提交 `https://brucemovie.com/sitemap-index.xml`。

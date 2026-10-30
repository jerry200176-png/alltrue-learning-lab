# 發佈與維護作業

本網站是靜態網站，不含使用者帳號或資料庫。上游教材及封面依 CC BY-NC 4.0 授權，僅供非商業用途；使用時須保留來源、授權連結、修改說明與 three.js 第三方聲明。品牌 Logo 由使用者提供。不要把自動化檢查結果解讀為教材已完成專業審查。

## 變更與版本

1. 以分支及 PR 提出修改；在 PR 說明變更目的、來源、授權、測試與已知限制。不要為通過 CI 而移除測試或降低斷言。
2. 在 `CHANGELOG.md` 更新版本與使用者可見變化。版本採 SemVer；未完成教學驗收的版本保留 `preview` 標記。
3. 使用固定的 Git commit、`package-lock.json` 與 Node 22 建置。建置產生的 `/version.json` 記錄套件版本、實際建置 commit、是否有未提交變更及固定上游 commit；若無 Git 資訊，以 `null` 表示，不得猜測。
4. 每次實際發布後建立一筆發佈紀錄：版本、網站與保存版本 ID、建置與上游 SHA、發佈時間、CI 連結、驗證項目、已知限制、負責人及上一個可回滾版本。不要把候選版本記成已發布。

## 發佈前

- 在乾淨 checkout 執行 `npm ci`、`npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`、`npm run check:release`，確認相同 commit 的 GitHub Actions 通過。
- 依 README 啟動 production preview，執行瀏覽器與科學檢查。上游檔案須通過雜湊比對；更換上游版本時重新檢查授權及模型差異。
- 檢查首頁提示、署名和授權連結、分類搜尋、四科代表單元、WebGL 失敗提示、手機與平板版面。實體裝置、螢幕閱讀器、科學與教學審查未完成時保留 PENDING，不得稱為 production verified。
- 將實際建置與待發布的原始碼 SHA 比對；若來源、建置或權限無法核實，不要發布。公開分享仍限定已批准的非商業用途。

## 發佈後及回滾

- 記錄實際網站 URL、保存版本 ID、建置 SHA 與狀態，並從外部連線檢查首頁、`version.json`、授權連結、至少一個 3D 單元及瀏覽器主控台。未能完成的項目記為 PENDING。
- 若出現錯誤或教學風險，先限制使用或撤回公開存取，再用託管平台的已保存版本清單選擇上一個已驗證版本重新部署，並核對其版本資訊及基本功能；如果沒有可用的舊版本，暫停公開存取並依已知 Git SHA 重新建置與驗證。
- 留下事故時間、影響、部署及回滾版本、症狀與修正 PR。釐清原因並通過原有檢查後才再次發布。
- 目前沒有設定外部可用性監測或告警。日常維護應定期檢視站點可用性、依賴與上游授權變動；不要宣稱監控已啟用。需要自動監測時，另行建立具明確接收對象與告警規則的監測。

## GitHub Pages 靜態試用站備援

若使用 GitHub Pages 的「Deploy from a branch」，以專用發布分支的根目錄存放已驗證的 `dist` 內容及 `.nojekyll`，不要將建置產物混入原始碼分支。專用分支名稱、產物 commit、來源 SHA、CI 執行紀錄與實際網址都必須列入發布紀錄；`version.json` 應呈現乾淨且已通過檢查的來源 SHA。儲存庫擁有者需在 Settings → Pages 選擇發布分支與 `/ (root)`；分支推送本身不代表網站已啟用。完成設定後確認 Pages 建置結果並從公開網址驗證。

更新時從已通過檢查的乾淨原始碼重新建置，在發布分支建立新的產物 commit；保留舊 commit，不以強制推送改寫歷史。回滾可把先前的產物狀態還原為一個新 commit，推送至同一發布分支，再確認 Pages 已更新且 `version.json` 指向預期的來源。若需要立即停止公開，使用儲存庫 Settings → Pages 停用發布。這是靜態試用站的手動備援流程，不代表已建立自動發布或監控。

參考：[Google SRE Release Engineering](https://sre.google/sre-book/release-engineering/)、[GitHub Actions 部署環境](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments) 與 [Semantic Versioning](https://semver.org/)。這些是設計依據，不表示本專案已具備其全部組織流程。

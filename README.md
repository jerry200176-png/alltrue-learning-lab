# 全真 Learning Lab

以 [Tongjiang Lab](https://github.com/smithjohn78390/tongjiang-lab) 的 54 個 3D 單元為基礎的繁體中文教材網站。**目前為未完成的教學原型，不可視為已通過課堂或正式上線驗收。**

## 執行與檢查

需要 Node.js 22 或更新版本。

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:release
```

如本機有 Chromium，可先執行 `npm run build && npm run preview`，再以另一個終端執行 `node scripts/browser-check.mjs`；若要逐一檢查 54 個單元的基本載入，可執行 `node scripts/all-lessons-check.mjs`；各單元控制項可用 `node scripts/control-check.mjs` 及 `node scripts/toggle-check.mjs` 檢查；代表性科學數值可另以 `node scripts/science-check.mjs` 檢查。可用 `CHROMIUM_PATH` 指定 Chromium 路徑。此檢查使用模擬器及軟體 WebGL，不代表實體手機、平板驗收。

## 狀態與限制

- 已加入 54 個上游教材的目錄、封面和未修改原始 HTML。54 個單元均有專屬教學內容草稿，尚待逐單元專業審查。
- 顯示文字以獨立轉換層套用 OpenCC 及台灣術語表。這是輔助轉換，並非逐句校對；尚未確認所有互動、畫布標籤、回饋與術語。原始教材程式未改動，但轉換層可能影響依賴顯示文字的互動，須逐單元檢查。
- 全部教案草稿、模擬的科學與數學正確性及三道概念題的可操作性均待專業審查。實際裝置驗收 **PENDING**。逐項紀錄見 [docs/acceptance.md](docs/acceptance.md)，代表性科學檢查的依據見 [docs/science-checks.md](docs/science-checks.md)。
- 不支援 WebGL 2 時顯示替代說明。窄螢幕預設收起兩側面板，並可透過分頁切換；模擬控制項補上可存取名稱。上游控制器、螢幕閱讀器及效能仍待真實裝置測試。

## 來源與授權

上游基準：Tongjiang Lab commit `4d63ce0a72d987c850ec6d919e570bdb752c87a6`。`public/upstream/` 保存未修改的教材、封面、目錄和授權聲明；`docs/upstream-sha256.json` 記錄上游檔案雜湊並由單元測試核對。網站外殼、教材草稿及顯示文字轉換層是本專案新增內容；所提供的全真 Logo 保存在 `logo.jpg` 和 `public/logo.jpg`。

上游教材、封面與目錄採 [CC BY-NC 4.0](public/upstream/LICENSE)，使用或改編時須署名 Tongjiang Lab、連結授權並說明修改，且僅限非商業用途。內嵌 three.js 使用 MIT 授權，見 [第三方聲明](public/upstream/THIRD_PARTY_NOTICES.md)。

翻譯目錄由 `scripts/generate-catalog.mjs` 從上游目錄產生；人工校訂寫在 `src/catalog-overrides.json`，重新產生時會套用這些修訂。使用 `node scripts/extract-lesson-text.mjs <單元 slug> <輸出 JSON 路徑>` 可按語法情境列出上游文字、UTF-16 位置及來源雜湊，供校對追溯；標示 `unclassified` 的項目必須人工判斷，不會自動改寫引擎或程式鍵值。`src/glossary.json` 為轉換術語表，`src/education.ts` 與 `src/teaching-*.ts` 為教案草稿，`src/bridge.ts` 為單元頁的顯示層轉換。

## 回滾

未部署。本變更合併後若需回滾，還原合併 commit，或部署前切回合併前的 commit `71302b6bb04452c4e2cc942502a3e6cbdcd95292`。不要刪除上游授權或第三方聲明而保留其素材。

版本與維護流程見 [CHANGELOG.md](CHANGELOG.md) 和 [docs/operations.md](docs/operations.md)。

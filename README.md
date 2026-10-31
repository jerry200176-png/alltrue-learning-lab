# 全真 Learning Lab

以 [Tongjiang Lab](https://github.com/smithjohn78390/tongjiang-lab) 的 54 個 3D 單元為基礎，並加入小白教育授權的平面鏡成像、等高線、原子結構、透鏡成像及核裂變單元的繁體中文教材網站。**目前為未完成的教學原型，不可視為已通過課堂或正式上線驗收。**

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

如本機有 Chromium，可先執行 `npm run build && npm run preview`，再以另一個終端執行 `node scripts/browser-check.mjs`；若要逐一檢查 54 個單元的基本載入，可執行 `node scripts/all-lessons-check.mjs`；手機尺寸的全部單元基本載入可用 `node scripts/mobile-lessons-check.mjs` 檢查；各單元控制項可用 `node scripts/control-check.mjs` 及 `node scripts/toggle-check.mjs` 檢查；代表性科學數值可另以 `node scripts/science-check.mjs` 檢查。可用 `CHROMIUM_PATH` 指定 Chromium 路徑。此檢查使用模擬器及軟體 WebGL，不代表實體手機、平板驗收。

CI 另以 Playwright 的 Linux WebKit 和手機視窗設定，依序檢查 54 個單元與控制面板的基本載入；CI 使用 Xvfb 虛擬顯示器執行完整檢查；可在已安裝 Playwright WebKit 的環境執行 `node scripts/webkit-mobile-check.mjs`，或以 `WEBKIT_HEADED=1 xvfb-run -a node scripts/webkit-mobile-check.mjs` 重現 CI 的顯示環境。這不是 iOS Safari 或 iPhone 實機，不得視為實體裝置驗收。

## 狀態與限制

- 已加入 54 個上游教材的目錄、封面和未修改原始 HTML，及五個小白教育授權教材。小白教材的來源與修改說明見 [docs/xiaobai-source.md](docs/xiaobai-source.md)。54 個單元均有專屬教學內容草稿，尚待逐單元專業審查。
- 顯示文字以獨立轉換層套用 OpenCC 及台灣術語表。這是輔助轉換，並非逐句校對；尚未確認所有互動、畫布標籤、回饋與術語。原始教材程式未改動，但轉換層可能影響依賴顯示文字的互動，須逐單元檢查。
- 全部教案草稿、模擬的科學與數學正確性及三道概念題的可操作性均待專業審查。實際裝置驗收 **PENDING**。逐項紀錄見 [docs/acceptance.md](docs/acceptance.md)，代表性科學檢查的依據見 [docs/science-checks.md](docs/science-checks.md)。
- 不支援 WebGL 2 時顯示替代說明。窄螢幕預設收起兩側面板，並可透過分頁切換；模擬控制項補上可存取名稱。上游控制器、螢幕閱讀器及效能仍待真實裝置測試。

## 來源與授權

上游基準：Tongjiang Lab commit `4d63ce0a72d987c850ec6d919e570bdb752c87a6`。`public/upstream/` 保存未修改的教材、封面、目錄和授權聲明；`docs/upstream-sha256.json` 記錄上游檔案雜湊並由單元測試核對。網站外殼、教材草稿及顯示文字轉換層是本專案新增內容；所提供的全真 Logo 保存在 `logo.jpg` 和 `public/logo.jpg`。

首頁地球貼圖 `public/derived/earth-blue-marble.jpg` 逐位元組取自上述上游 `courses/earth-motion-step.html` 中的 JPEG，上游在教材中標示來源為 NASA Blue Marble；SHA-256 為 `05d06639f1afcdba63ae009fc2d1191bb148c1fe27ddbcef008c64ae2e72b8dc`。首頁以 MIT 授權的 three.js 繪製互動地球，四科圖片使用上游教材封面；自動旋轉是視覺展示，不代表實際時間尺度。

首頁的臺北晝夜互動採用 [NOAA 太陽位置公式](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)的非閏年近似，計算臺北（25.033° N、121.5654° E、UTC+8）的太陽高度與受光方向；不含大氣折射、地形或逐年差異，接近地平線時不得當成精確日出日落時間。自動旋轉只改變視角。互動設計參考 [NASA Eyes on the Earth](https://eyes.nasa.gov/apps/earth/)、[PhET 互動教學設計](https://phet.colorado.edu/translation/1534/about)與 [three.js 地球範例](https://threejs.org/examples/webgpu_tsl_earth.html)，未複製它們的模型或圖片。

上游教材、封面與目錄採 [CC BY-NC 4.0](public/upstream/LICENSE)，使用或改編時須署名 Tongjiang Lab、連結授權並說明修改，且僅限非商業用途。內嵌 three.js 使用 MIT 授權，見 [第三方聲明](public/upstream/THIRD_PARTY_NOTICES.md)。

翻譯目錄由 `scripts/generate-catalog.mjs` 從上游目錄產生；人工校訂寫在 `src/catalog-overrides.json`，重新產生時會套用這些修訂。使用 `node scripts/extract-lesson-text.mjs <單元 slug> <輸出 JSON 路徑>` 可按語法情境列出上游文字、UTF-16 位置及來源雜湊，供校對追溯；標示 `unclassified` 的項目必須人工判斷，不會自動改寫引擎或程式鍵值。`src/glossary.json` 為轉換術語表，`src/education.ts` 與 `src/teaching-*.ts` 為教案草稿，`src/bridge.ts` 為單元頁的顯示層轉換。

## 回滾

程式碼可透過還原合併 commit 回滾。設定 GitHub Pages 使用 GitHub Actions 後，`main` 的 CI 通過才會部署建置產物；切換完成前網站仍由 `preview-site` 分支發佈。參見維護流程確認實際使用的發布來源及回滾方式。不要刪除上游授權或第三方聲明而保留其素材。

首頁高解析 NASA 地球貼圖來源與設備回退方式見 [docs/earth-texture.md](docs/earth-texture.md)。

版本、發佈紀錄與維護流程見 [CHANGELOG.md](CHANGELOG.md)、[docs/releases.md](docs/releases.md) 和 [docs/operations.md](docs/operations.md)。

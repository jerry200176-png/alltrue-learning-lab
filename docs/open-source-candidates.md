# 開源互動教材：初步候選

調查日期：2026-10-31（臺北時間）。比對本站 54 個 Tongjiang Lab 單元與 7 個小白教育單元的名稱與介紹；下列是初步篩選，不是逐一核實全部內容、模型及授權。課堂使用前仍須由教師審閱。原站的畫面、模型和資料也可能各有不同的第三方授權。

| 來源 | 初步可補充的主題 | 形式與授權 | 狀態 |
| --- | --- | --- | --- |
| [Science Simulations](https://github.com/ai-science-sims/science-simulations) | 原子軌域與電子組態、聲波干涉、力矩、比熱、理想氣體；3D 磁場可補充本站既有電流磁場 | 該儲存庫為 MIT，包含 2D 和 3D；本次比對 commit `ce111aecaa85c9d75e8aaa4d9f54c8c205c575ff` | 原子軌域改編版已依使用者要求移除；其餘僅為候選，須逐項審查建模品質與授權。聲波干涉是 2D，不應標成 3D。 |
| [PhET](https://phet.colorado.edu/) | 電路、浮力、聲音、熱學等；部分與現有單元重疊，可參考控制和教案 | [PhET HTML 單檔說明](https://phet-dev.colorado.edu/license.html)載明 CC BY 4.0 與署名；模擬專屬原始碼多採 GPLv3，共用程式碼依各庫授權。多數是 2D，商標另有規範 | 未引入；使用前逐份確認現行授權與第三方聲明。 |
| [Concord Consortium Lab](https://github.com/concord-consortium/lab) | 分子運動、物質性質、生態及圖表，可補充既有單元 | 框架程式碼 MIT；個別模型、圖片及其他資料須另查。多為 2D | 未引入；先核對單元及素材授權。 |
| [Solar Wanderer](https://github.com/hyqzz/Solar-Wanderer) | 太陽系與行星位置，可延伸本站地球運動 | 主程式 MIT、Three.js／WebGL 3D；專案所稱 NASA 等資料及素材需逐項核對 | 未引入；數據、第三方素材、手機效能與科學正確性待審查。 |
| [Biology Simulation](https://github.com/BiologySimulation/BiologySimulation) | 細胞、器官等，與本站細胞教材可相互參考 | 儲存庫顯示 MIT，但使用 Sketchfab 等第三方模型；程式授權不能自動涵蓋模型 | 未引入，模型授權未完成確認。 |
| [Effectual Learning](https://effectuall.github.io/sims.html) | 浮力、熱學、單擺、光學等 | 網站有 3D Three.js 模型，但未查到明確授予教材重製的授權；Three.js 的授權不等於教材授權 | 僅列為參考，不複製模型或素材。 |
| [Valence](https://github.com/exergonic/valence) | 分子結構與軌域，與本站球棍模型部分重疊 | README 顯示 MIT 標章，但本次未找到根目錄 LICENSE；其 OCC 為 LGPL-3，JSME 與其他依賴須另查 | 不引入，待釐清完整授權、效能及可供教學的適用範圍。 |

## REA 檢視與科學問題

使用本機隔離瀏覽器與 REA 6.8.0 的 `inspect-web-page` 檢視 Science Simulations 的聲波干涉頁（evidence `ev_1eef0eef54f4fabe474d4ca06108971bf1a86bad6735b61945db1d997242b9fc`）。該頁使用 2D canvas，可移動麥克風並觀察路徑差；REA 只記錄附掛後的頁面事件，不等於科學或授權審查。

曾檢視原子軌域程式與已移除的本站改編頁（REA evidence `ev_17a248ee7b1541fc854471a4914c1583bf1e90bad7ac0b264fd8cf1e56a2dbd7`）。上游原始 `getOrbitalsForZ` 對鉀固定顯示 4s²，且鉻、銅的 3d／4s 數量與文字組態不一致；觸控只有開始及結束，缺少移動處理。該改編版現已移除，保留此紀錄供後續選材參考。REA 不證明模型科學正確，也不能賦予額外使用權。

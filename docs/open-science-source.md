# Science Simulations 原子軌域教材來源

- 上游：[Hong Kong Physics Teachers / Science Simulations](https://github.com/ai-science-sims/science-simulations)，commit `ce111aecaa85c9d75e8aaa4d9f54c8c205c575ff`，`simulations/chemistry/atomic-orbital.html`，作者列示 Bryan Leung；上游程式以 MIT 授權。完整授權包含於 `vendor/open-science/LICENSE` 及網站 `public/open-science/LICENSE`。
- 上游原始 HTML SHA-256：`41d16fbe38026ec4a2f155e804e5aa810eb3c9ce3ffb4a0a90506bb537390ffe`；供比對的原檔保存在 `vendor/open-science/atomic-orbital.original.html`。
- 本站改編 HTML SHA-256：`e8684cac4cdc6b5fb71d70cac6b1b6a254642b7cde576332b0f7449f446c07a2`；`scripts/prepare-orbital.py` 可由原檔重建。原始外部 CDN、字型及語言切換已移除，使用本站隔離框架、獨立繁體中文資源及離線打包的 Three.js。渲染時不需連接第三方服務。
- `public/open-science/orbital-tailwind.css` 以 Tailwind CSS 3.4.17 從上游 HTML 的類別產生，SHA-256 `59dadaeff2d1e96164fd33d4465299711b1ad7add88229c96634bb03b7296bd3`；Tailwind CSS 及 Three.js 均為 MIT，授權檔在 `public/open-science/` 與 `vendor/open-science/`。
- 封面 `public/open-science/atomic-orbital-cover.png` 為本站整合後模型的本機瀏覽器擷取，SHA-256 `ca4dd217a942fdfa920fdb75d302b71137fb2298a8413a305ec9a8bb3de3349d`；未引入額外 3D 模型。
- 修正原始程式對鉀 4s、副層中鉻與銅的電子數；自動檢查 1–36 號元素的副層總電子數，以及 K、Ca、Cr、Cu 的基態組態與滑桿回饋。以 [NIST 原子參考資料](https://www.nist.gov/pml/atomic-reference-data-electronic-structure-calculations)為電子組態查核參考。
- 圖形是程序生成的代表性形狀，**不是精確的波函數或機率密度**，不表現量子數、節面、同位素及個別軌域佔據；d 的四葉形亦不代表所有 d 軌域。原先自行估算中子數的球群已改為單一示意原子核。移除隨機方向，加入觸控與鍵盤旋轉及減少動態效果設定；調整手機版佈局並釋放舊幾何與材質。
- REA 僅作為頁面觀察輔助；模型、術語、全部教案的專業審查與真實手機／平板驗收均為 **PENDING**。不宣稱 production verified。

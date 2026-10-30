# 代表性科學檢查依據

這份紀錄只涵蓋列出的模型與測試條件，不能推論其他控制器、所有單元或教案已完成專業審查。可用 `npm run build && npm run preview` 啟動網站，另開終端執行 `node scripts/science-check.mjs`。

| 單元 | 獨立原理與條件 | 瀏覽器檢查 | 外部參考 |
| --- | --- | --- | --- |
| 水平拋射 | 忽略空氣阻力，水平等速度、鉛直等加速度；以 g = 9.8 m/s²、模型讀取的 v₀ 和 y 求 x = v₀√(2y/g)。 | 依序設定 y = 20、80、180、320 mm，比對位移、等時距離比例與 k = g/(2v₀²)。 | [OpenStax Physics：Projectile Motion](https://openstax.org/books/physics/pages/5-3-projectile-motion) |
| 強酸強鹼滴定 | 在 25 °C 且強酸、強鹼完全解離的近似下；以 HCl 與 NaOH 的 1:1 反應及混合體積，計算等量點前後剩餘 OH⁻ 或 H⁺ 的 pH。 | 模型條件為 HCl 0.1000 mol/L、NaOH 20.00 mL、等量點 21.04 mL。比對五個酸體積、滴定管讀數，以及等量點推得的 0.1052 mol/L。pH 顯示有動畫，容差 0.12。 | [OpenStax Chemistry 2e：Acid-Base Titrations](https://openstax.org/books/chemistry-2e/pages/14-7-acid-base-titrations) |
| 酵素活性 | 溫度與 pH 均可能影響酵素活性；不同酵素的最佳條件不同。 | 以模型原始 pH 與未處理條件，比較 0、37、70 °C 下相對活性；僅驗證此教材模型的趨勢，非推論所有酵素。 | [OpenStax Biology 2e：Enzymes](https://openstax.org/books/biology-2e/pages/6-5-enzymes) |
| 地球運動 | 理想太陽正午高度角 α = 90° − \|φ − δ\|；測試中模型第 172 日的赤緯近似 +23.44°。極夜時高度可為負，應與太陽是否可見分開判斷。 | 比對北緯 0°、23°、40°與南緯 20°四種設定的高度讀數，容許模型近似及顯示四捨五入造成 0.15° 差異。 | [教育部氣候變遷教育：理論太陽入射輻射量](https://climatechange.moe.edu.tw/Home/getFileByNewId/99b53959-adb7-4535-a8a0-96b9d5858d7b) |

以上外部資料用於核對基本原理，並不代表其作者或機構審核或背書本專案。原始模型的預設數值來自上游，不是外部參考資料指定的實驗數值。

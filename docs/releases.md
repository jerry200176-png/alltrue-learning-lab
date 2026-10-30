# 發佈紀錄

## 0.1.0-preview.1 — 2026-10-30

- 狀態：GitHub Pages 部署作業於 2026-10-30 09:43 UTC 回報成功；公開網址的實際載入與瀏覽器操作仍為 **PENDING**，本環境無法連線至該網址。
- 網址：https://jerry200176-png.github.io/alltrue-learning-lab/
- 發布來源：`preview-site` 分支，產物 commit `b09d173e185881cf6054e141eae213c68f9499d9`；來源 commit `d0c0da5af09161204f9264777ff1caf2b64f6427`，上游 commit `4d63ce0a72d987c850ec6d919e570bdb752c87a6`。產物內的 `version.json` 記錄來源與上游版本。
- 檢查：[來源 CI](https://github.com/jerry200176-png/alltrue-learning-lab/actions/runs/41034498385) 通過；[Pages 部署](https://github.com/jerry200176-png/alltrue-learning-lab/actions/runs/41035434537) 回報成功。本機 GitHub Pages 子路徑的 Chromium 四個代表單元、手機／平板模擬及 WebGL 替代畫面重跑通過；先前一次手機面板狀態斷言失敗，原因仍待追查。
- 限制：非商業試用；逐單元教學、科學與繁體中文審查及實體手機、平板驗收仍為 PENDING。未設定外部可用性監控與告警，不宣稱 production verified。
- 回滾：這是首次部署，尚無上一個已驗證的公開版本；發生問題時在 GitHub Pages 設定停止發布。未來版本應保留已驗證產物 commit，依 `docs/operations.md` 回滾並再次驗證。

此紀錄在部署之後加入原始碼分支；所發布網站的來源 SHA 仍為上述 `d0c0da5`，不會因本紀錄而改變。

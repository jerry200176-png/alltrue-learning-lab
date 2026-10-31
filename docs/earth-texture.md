# 首頁地球貼圖

## 先前使用的素材（保留供追溯）

首頁先使用 Tongjiang Lab 地球教材中隨附的 Blue Marble 影像；授權與來源保留在既有 upstream 聲明。支援足夠大材質的非觸控裝置，會在載入後改用 NASA Earth Observatory 的高解析度影像：

- NASA Blue Marble: Next Generation with Topography and Bathymetry，2004 年 7 月；影像製作 Reto Stöckli，NASA Earth Observatory / NASA Goddard Space Flight Center。
- 官方介紹：<https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry>
- 官方檔案：<https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x5400x2700.jpg>
- 本站檔案 `public/derived/earth-blue-marble-nasa-5400.jpg`：5400 × 2700，未修改原始檔；SHA-256 `4f4240673a3a1b173d61b92ca4b07bac5fd17059ea5f725ba6da5a9c5386b7ba`。
- NASA 影像使用說明：<https://www.nasa.gov/nasa-brand-center/images-and-media/>。本站標示來源，不使用 NASA 標誌或暗示 NASA 背書。

高解析貼圖含 mipmap 時約需 78 MB 顯示記憶體；為減少觸控裝置資源壓力，手機和平板沿用較小貼圖。大貼圖無法載入時保留標準貼圖。實體手機及平板驗收仍為 PENDING。

## 首頁寫實地球與星圖（0.1.0-preview.13）

- 地球使用 NASA/Goddard Space Flight Center Scientific Visualization Studio 的 [Equirectangular Projected Earth for LARGEST](https://svs.gsfc.nasa.gov/3615/)，影像由 Greg Shirah 製作；Blue Marble Next Generation 資料由 Reto Stöckli、NASA/GSFC 與 NASA Earth Observatory 提供，雲圖採用 Climate Prediction Center 的 2007 年衛星合成資料。雲層為固定歷史合成影像，**不是即時天氣**；顏色和雲層外觀由 NASA 為影片進行藝術調整。
- 官方 8192 × 4096 JPEG：<https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/flat_earth_Largest_still.0330.jpg>；原始檔 SHA-256 `5ea6b68a4412421cae11711ae4fec1a7b1f2dbd7265c0c3004d487a03c43be9a`。本站 `public/derived/nasa-earth-4096.jpg` 由原檔縮至 4096 × 2048、JPEG 品質 90，SHA-256 `0ebad1eb6124f842ba4cc84044f6d4abc8450ed2e5ef50d3bb2bced62f8c6ee1`。標準版 `nasa-earth-2048.jpg` 由原檔縮至 2048 × 1024、JPEG 品質 88，SHA-256 `664d012fe9be21c64ab7629aeeb5841053c94030d32607a391a098f2fba9c94a`。
- 星空採 NASA/Goddard Space Flight Center Scientific Visualization Studio 的 [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851/)（Ernie Wright；Gaia DR2: ESA/Gaia/DPAC）。以官方 `starmap_2020_4k.exr`（SHA-256 `69b841cd048c2ef35543eb1c5819b322530e78aa4b0cab97ec1de3ef56a4ddcd`）轉成 sRGB、調整亮度範圍並輸出 4096 × 2048 JPEG；`nasa-stars-4096.jpg` SHA-256 `668f9116c34315fdf985b7b08deebfb36c3425d761346b507f8c23e531973d04`。背景採裁切及視覺調色，不宣稱與當前觀測方向或時間一致。
- 4K 影像搭配 mipmap 約需 45 MB 顯示記憶體，只在支援 4096 材質的非觸控裝置載入；其他裝置使用 2048 版。大圖失敗時保留標準圖；大氣光暈是視覺效果，不代表天氣資料。實體手機與平板驗收仍為 **PENDING**。

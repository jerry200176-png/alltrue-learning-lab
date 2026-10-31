import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { TAIPEI } from './solar';

// The viewer configuration is adapted from God's Eye View, MIT, Bilawal Sidhu.
// Satellite imagery and terrain use the same keyless sources as the upstream
// project; the previously reviewed NASA image is kept as an offline fallback.
export function mountGlobe(holder: HTMLElement, textureUrl: string, onRotationChange: (playing: boolean) => void, detailedTextureUrl?: string) {
  const credits = document.createElement('div');
  credits.className = 'globe-credits';
  const mapStatus = document.createElement('div');
  mapStatus.className = 'globe-map-status';
  mapStatus.hidden = true;
  const attribution = document.createElement('div');
  attribution.className = 'globe-attribution';
  attribution.innerHTML = '衛星影像：<a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>、Vantor、Earthstar Geographics、GIS 社群 · 地形：<a href="https://terrain.reearth.land/" target="_blank" rel="noreferrer">Re:Earth / Mapterhorn</a>、EGM2008 (NGA)、Protomaps、OpenStreetMap <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>';
  const container = document.createElement('div');
  container.className = 'cesium-globe';
  holder.replaceChildren(container, credits, mapStatus, attribution);
  const viewer = new Cesium.Viewer(container, {
    animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
    homeButton: false, sceneModePicker: false, navigationHelpButton: false,
    fullscreenButton: false, vrButton: false, selectionIndicator: false,
    infoBox: false, baseLayer: false, skyBox: false, creditContainer: credits,
    contextOptions: { webgl: { alpha: true, preserveDrawingBuffer: true } },
    msaaSamples: 2, requestRenderMode: true, maximumRenderTimeChange: Infinity,
  });
  const { scene, camera, canvas } = viewer;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '互動地球，拖曳或使用左右方向鍵旋轉，滾輪或加減鍵縮放');
  scene.backgroundColor = Cesium.Color.TRANSPARENT;
  canvas.dataset.tilesPending = '0';
  scene.globe.tileLoadProgressEvent.addEventListener((pending: number) => { canvas.dataset.tilesPending = String(pending); });
  scene.globe.enableLighting = true;
  scene.globe.dynamicAtmosphereLighting = false;
  scene.globe.showGroundAtmosphere = false;
  scene.screenSpaceCameraController.enableInputs = false;
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = true;
    scene.skyAtmosphere.saturationShift = -0.12;
    scene.skyAtmosphere.brightnessShift = -0.08;
  }
  // In the upstream viewer per-vertex model atmosphere is disabled for Apple
  // Metal compatibility; this page does not load 3D tiles or models.
  viewer.targetFrameRate = 60;
  let disposed = false;
  let visible = true;
  let dragging = false;
  let previousX = 0;
  let previousY = 0;
  let animationFrame = 0;
  let lastTime = 0;
  let latitude: number = TAIPEI.latitude;
  let longitude: number = TAIPEI.longitude;
  let altitude = 9_500_000;
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotionChange = (event: MediaQueryListEvent) => { playing = !event.matches; onRotationChange(playing); };
  motion.addEventListener('change', onMotionChange);
  onRotationChange(playing);
  const render = () => { if (!disposed) { scene.requestRender(); viewer.render(); } };
  const updateView = () => {
    const ground = scene.globe.getHeight(Cesium.Cartographic.fromDegrees(longitude, latitude)) ?? 0;
    camera.setView({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude + Math.max(0, ground)), orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 } });
    render();
  };
  const rotate = (direction: number) => { longitude += direction * 20; updateView(); };
  const zoom = (factor: number) => {
    const distance = Cesium.Math.clamp(altitude * factor, 500, 28_000_000);
    if (distance === altitude) return false;
    altitude = distance; updateView(); return true;
  };
  const taipei = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(TAIPEI.longitude, TAIPEI.latitude, 100_000), point: { pixelSize: 7, color: Cesium.Color.WHITE } });
  const subsolar = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(0, 0, 100_000), point: { pixelSize: 9, color: Cesium.Color.TRANSPARENT, outlineColor: Cesium.Color.fromCssColorString('#ffce52'), outlineWidth: 2 } });
  const grid: Cesium.Entity[] = [];
  const addLine = (positions: number[]) => grid.push(viewer.entities.add({ show: false, polyline: { positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions), width: 1, material: Cesium.Color.fromCssColorString('#95daf3').withAlpha(0.5) } }));
  for (let lat = -60; lat <= 60; lat += 30) { const points: number[] = []; for (let lon = -180; lon <= 180; lon += 3) points.push(lon, lat, 30_000); addLine(points); }
  for (let lon = -180; lon < 180; lon += 30) { const points: number[] = []; for (let lat = -90; lat <= 90; lat += 3) points.push(lon, lat, 30_000); addLine(points); }
  const setSun = (sunLatitude: number, sunLongitude: number) => {
    const direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.fromDegrees(sunLongitude, sunLatitude), new Cesium.Cartesian3());
    scene.light = new Cesium.DirectionalLight({ direction: Cesium.Cartesian3.negate(direction, new Cesium.Cartesian3()) });
    subsolar.position = new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(sunLongitude, sunLatitude, 100_000));
    render();
  };
  const resize = () => {
    const { width, height } = holder.getBoundingClientRect(); if (!width || !height) return;
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2.5, Math.sqrt(1_200_000 / (width * height)));
    viewer.useBrowserRecommendedResolution = true;
    viewer.resize(); render();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(holder);
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; });
  visibilityObserver.observe(holder);
  const animate = (time: number) => {
    if (disposed) return;
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0; lastTime = time;
    if (visible && !document.hidden && playing && !dragging) { longitude += elapsed * 5; updateView(); }
    animationFrame = requestAnimationFrame(animate);
  };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;
  const distance = () => { const [a, b] = [...pointers.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; };
  canvas.addEventListener('pointerdown', event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragging = true; previousX = event.clientX; previousY = event.clientY;
    if (pointers.size === 2) pinchDistance = distance();
    holder.classList.add('is-dragging'); canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) { const next = distance(); if (pinchDistance && next) zoom(pinchDistance / next); pinchDistance = next; return; }
    const sensitivity = 0.4 * Cesium.Math.clamp(altitude / 9_500_000, 0.0003, 1);
    longitude -= (event.clientX - previousX) * sensitivity;
    latitude = Cesium.Math.clamp(latitude + (event.clientY - previousY) * sensitivity, -89, 89);
    previousX = event.clientX; previousY = event.clientY; updateView();
  });
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId); pinchDistance = 0;
    const remaining = [...pointers.values()][0];
    if (remaining) { previousX = remaining.x; previousY = remaining.y; }
    else { dragging = false; holder.classList.remove('is-dragging'); }
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', event => {
    // Cesium otherwise consumes wheel events even when its input controller is disabled.
    event.stopImmediatePropagation();
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? canvas.clientHeight : 1);
    if (zoom(Math.exp(Cesium.Math.clamp(delta, -1000, 1000) * 0.002))) event.preventDefault();
  }, { passive: false, capture: true });
  canvas.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -1 : 1); }
    else if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); zoom(event.key === '+' || event.key === '=' ? 0.9 : 1 / 0.9); }
  });
  const loadTexture = async () => {
    try {
      const standard = await Cesium.SingleTileImageryProvider.fromUrl(textureUrl, { credit: 'NASA / GSFC Scientific Visualization Studio' });
      if (disposed) return;
      viewer.imageryLayers.addImageryProvider(standard); canvas.dataset.ready = 'true'; canvas.dataset.texture = 'standard'; canvas.dataset.map = 'loading'; render();
      const gl = canvas.getContext('webgl2');
      if (detailedTextureUrl && (gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0) >= 4096 && !window.matchMedia('(pointer: coarse)').matches) {
        canvas.dataset.detailLoading = 'true';
        try {
          const detailed = await Cesium.SingleTileImageryProvider.fromUrl(detailedTextureUrl, { credit: 'NASA / GSFC Scientific Visualization Studio' });
          if (!disposed) { viewer.imageryLayers.addImageryProvider(detailed); canvas.dataset.texture = 'detailed'; render(); }
        } catch { /* Standard NASA image remains available. */ }
        delete canvas.dataset.detailLoading;
      }
    } catch { if (!disposed) holder.classList.add('texture-unavailable'); }
  };
  const withDeadline = async <T>(request: Promise<T>, milliseconds: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([request, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Map service timed out')), milliseconds); })]); }
    finally { if (timer !== undefined) clearTimeout(timer); }
  };
  const loadMap = async () => {
    try {
      const imagery = await withDeadline(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', { credit: 'Powered by Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community', enablePickFeatures: false }), 10000);
      if (disposed) return;
      const layer = viewer.imageryLayers.addImageryProvider(imagery);
      let errors = 0;
      imagery.errorEvent.addEventListener(() => {
        if (disposed || canvas.dataset.map === 'fallback' || ++errors < 2) return;
        viewer.imageryLayers.remove(layer); canvas.dataset.map = 'fallback';
        mapStatus.textContent = '衛星地圖暫時無法載入，顯示地球概覽。'; mapStatus.hidden = false; render();
      });
      canvas.dataset.map = 'satellite'; render();
    } catch {
      if (!disposed) { canvas.dataset.map = 'fallback'; mapStatus.textContent = '衛星地圖暫時無法載入，顯示地球概覽。'; mapStatus.hidden = false; }
    }
    try {
      const terrain = await withDeadline(Cesium.CesiumTerrainProvider.fromUrl('https://terrain.reearth.land/cesium-mesh/ellipsoid'), 10000);
      if (!disposed) {
        viewer.terrainProvider = terrain;
        let terrainErrors = 0;
        terrain.errorEvent.addEventListener(() => {
          if (disposed || ++terrainErrors < 2) return;
          viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
          if (canvas.dataset.map !== 'fallback') { mapStatus.textContent = '地形暫時無法載入，顯示平面衛星地圖。'; mapStatus.hidden = false; }
          render();
        });
        render();
      }
    } catch {
      if (!disposed && canvas.dataset.map !== 'fallback') { mapStatus.textContent = '地形暫時無法載入，顯示平面衛星地圖。'; mapStatus.hidden = false; }
    }
  };
  void loadTexture().then(loadMap); updateView(); resize(); animationFrame = requestAnimationFrame(animate);
  return { rotate, setSun, setOverlay(show: boolean) { grid.forEach(line => { line.show = show; }); render(); }, setView(viewpoint: 'taipei' | 'north') { latitude = viewpoint === 'north' ? 89 : TAIPEI.latitude; longitude = viewpoint === 'north' ? 0 : TAIPEI.longitude; updateView(); }, toggleRotation() { playing = !playing; onRotationChange(playing); }, dispose() {
    disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); visibilityObserver.disconnect(); motion.removeEventListener('change', onMotionChange);
    void taipei; viewer.destroy();
  } };
}

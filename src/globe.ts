import * as THREE from 'three';
import { earthVector, TAIPEI } from './solar';

/** A decorative globe using the Blue Marble texture bundled with the upstream Earth lesson. */
export function mountGlobe(holder: HTMLElement, textureUrl: string, onRotationChange: (playing: boolean) => void, detailedTextureUrl?: string) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '互動地球，拖曳或使用左右方向鍵旋轉');
  holder.replaceChildren(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.z = 3.6;
  scene.add(new THREE.AmbientLight(0xa6b9db, 0.24));
  const view = new THREE.Group();
  view.rotation.set(0.12, 2.3, 0.08); scene.add(view);
  const sunlight = new THREE.DirectionalLight(0xfff3da, 2.8);
  view.add(sunlight);
  const geometry = new THREE.SphereGeometry(1, 96, 64);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const earth = new THREE.Mesh(geometry, material);
  view.add(earth);
  // Fine geographic graticules echo the Earth lesson while remaining Earth-fixed.
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x95daf3, transparent: true, opacity: 0.34, depthWrite: false });
  const gridGeometries: THREE.BufferGeometry[] = [];
  const addGridLine = (points: THREE.Vector3[]) => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    gridGeometries.push(lineGeometry);
    view.add(new THREE.Line(lineGeometry, gridMaterial));
  };
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 3) points.push(new THREE.Vector3().fromArray(earthVector(latitude, longitude)).multiplyScalar(1.003));
    addGridLine(points);
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let latitude = -90; latitude <= 90; latitude += 3) points.push(new THREE.Vector3().fromArray(earthVector(latitude, longitude)).multiplyScalar(1.003));
    addGridLine(points);
  }
  const markerGeometry = new THREE.SphereGeometry(0.022, 16, 12);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f7fa });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.fromArray(earthVector(TAIPEI.latitude, TAIPEI.longitude)).multiplyScalar(1.008);
  view.add(marker);
  // Parallel rays indicate the incoming direction; distances are illustrative.
  const rayPoints: THREE.Vector3[] = [];
  for (const [x, y] of [[-0.48, 0], [0, 0.42], [0.48, 0]]) {
    const tip = new THREE.Vector3(x, y, 1.1);
    rayPoints.push(new THREE.Vector3(x, y, 1.6), tip,
      tip, new THREE.Vector3(x - 0.045, y, 1.2),
      tip, new THREE.Vector3(x + 0.045, y, 1.2));
  }
  const rayGeometry = new THREE.BufferGeometry().setFromPoints(rayPoints);
  const rayMaterial = new THREE.LineBasicMaterial({ color: 0xffd36e, transparent: true, opacity: 0.8 });
  const sunRays = new THREE.LineSegments(rayGeometry, rayMaterial);
  view.add(sunRays);
  // The gold ring marks the subsolar point: where the Sun is directly overhead.
  const sunMarkerGeometry = new THREE.RingGeometry(0.024, 0.034, 32);
  const sunMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffce52, side: THREE.DoubleSide });
  const sunMarker = new THREE.Mesh(sunMarkerGeometry, sunMarkerMaterial);
  view.add(sunMarker);

  let disposed = false;
  let visible = true;
  let dragging = false;
  let previousX = 0;
  let previousY = 0;
  let animationFrame = 0;
  let lastTime = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !motion.matches;
  const onMotionChange = (event: MediaQueryListEvent) => { playing = !event.matches; onRotationChange(playing); };
  motion.addEventListener('change', onMotionChange);
  onRotationChange(playing);
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  const rotate = (direction: number) => { view.rotation.y += direction * 0.35; render(); };
  const setSun = (latitude: number, longitude: number) => {
    const direction = new THREE.Vector3().fromArray(earthVector(latitude, longitude));
    sunlight.position.copy(direction).multiplyScalar(5);
    sunMarker.position.copy(direction).multiplyScalar(1.01);
    sunMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    sunRays.quaternion.copy(sunMarker.quaternion);
    render();
  };
  const resize = () => {
    const { width, height } = holder.getBoundingClientRect();
    if (!width || !height) return;
    // Keep high-density screens sharp while bounding the drawing buffer on large displays.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5, Math.sqrt(1_200_000 / (width * height)));
    renderer.setPixelRatio(pixelRatio);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); render();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(holder);
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; });
  visibilityObserver.observe(holder);
  const animate = (time: number) => {
    if (disposed) return;
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0; lastTime = time;
    if (visible && !document.hidden && playing && !dragging) { view.rotation.y += elapsed * 0.09; render(); }
    animationFrame = requestAnimationFrame(animate);
  };
  canvas.addEventListener('pointerdown', event => {
    dragging = true; previousX = event.clientX; previousY = event.clientY;
    holder.classList.add('is-dragging');
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    view.rotation.y += (event.clientX - previousX) * 0.008;
    view.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.rotation.x + (event.clientY - previousY) * 0.008));
    previousX = event.clientX; previousY = event.clientY; render();
  });
  const release = () => { dragging = false; holder.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -1 : 1);
  });
  const loader = new THREE.TextureLoader();
  const applyTexture = (texture: THREE.Texture, quality: 'standard' | 'detailed') => {
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    material.map?.dispose(); material.map = texture; material.needsUpdate = true;
    canvas.dataset.ready = 'true'; canvas.dataset.texture = quality; render();
  };
  loader.load(textureUrl, texture => {
    applyTexture(texture, 'standard');
    // The large texture needs about 78 MB of GPU memory with mipmaps. Keep the
    // smaller map on touch devices and GPUs that cannot fit its dimensions.
    if (!disposed && detailedTextureUrl && renderer.capabilities.maxTextureSize >= 5400 && !window.matchMedia('(pointer: coarse)').matches) {
      canvas.dataset.detailLoading = 'true';
      loader.load(detailedTextureUrl, detailed => {
        delete canvas.dataset.detailLoading; applyTexture(detailed, 'detailed');
      }, undefined, () => { delete canvas.dataset.detailLoading; });
    }
  }, undefined, () => {
    if (!disposed) holder.classList.add('texture-unavailable');
  });
  resize(); animationFrame = requestAnimationFrame(animate);
  return { rotate, setSun, setView(viewpoint: 'taipei' | 'north') {
    if (viewpoint === 'north') view.rotation.set(Math.PI / 2, 0, 0);
    else view.rotation.set(0.12, 2.3, 0.08);
    render();
  }, toggleRotation() { playing = !playing; onRotationChange(playing); }, dispose() {
    disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); visibilityObserver.disconnect();
    motion.removeEventListener('change', onMotionChange);
    material.map?.dispose(); material.dispose(); geometry.dispose(); markerGeometry.dispose(); markerMaterial.dispose(); gridGeometries.forEach(line => line.dispose()); gridMaterial.dispose(); rayGeometry.dispose(); rayMaterial.dispose(); sunMarkerGeometry.dispose(); sunMarkerMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
  } };
}

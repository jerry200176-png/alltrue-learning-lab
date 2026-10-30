import * as THREE from 'three';
import { earthVector, TAIPEI } from './solar';

/** A decorative globe using the Blue Marble texture bundled with the upstream Earth lesson. */
export function mountGlobe(holder: HTMLElement, textureUrl: string, onRotationChange: (playing: boolean) => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '互動地球，拖曳或使用左右方向鍵旋轉');
  holder.replaceChildren(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.z = 3.8;
  scene.add(new THREE.AmbientLight(0xa6b9db, 0.24));
  const view = new THREE.Group();
  view.rotation.set(0.12, 2.3, 0.08); scene.add(view);
  const sunlight = new THREE.DirectionalLight(0xfff3da, 2.8);
  view.add(sunlight);
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const earth = new THREE.Mesh(geometry, material);
  view.add(earth);
  const markerGeometry = new THREE.SphereGeometry(0.022, 16, 12);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffd354 });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.fromArray(earthVector(TAIPEI.latitude, TAIPEI.longitude)).multiplyScalar(1.008);
  view.add(marker);

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
    sunlight.position.fromArray(earthVector(latitude, longitude)).multiplyScalar(5); render();
  };
  const resize = () => {
    const { width, height } = holder.getBoundingClientRect();
    if (!width || !height) return;
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
    view.rotation.x = Math.max(-1.1, Math.min(1.1, view.rotation.x + (event.clientY - previousY) * 0.008));
    previousX = event.clientX; previousY = event.clientY; render();
  });
  const release = () => { dragging = false; holder.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -1 : 1);
  });
  new THREE.TextureLoader().load(textureUrl, texture => {
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace; material.map = texture; material.needsUpdate = true; canvas.dataset.ready = 'true'; render();
  }, undefined, () => {
    if (!disposed) holder.classList.add('texture-unavailable');
  });
  resize(); animationFrame = requestAnimationFrame(animate);
  return { rotate, setSun, toggleRotation() { playing = !playing; onRotationChange(playing); }, dispose() {
    disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); visibilityObserver.disconnect();
    motion.removeEventListener('change', onMotionChange);
    material.map?.dispose(); material.dispose(); geometry.dispose(); markerGeometry.dispose(); markerMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
  } };
}

import * as THREE from 'three';

/** A decorative globe using the Blue Marble texture bundled with the upstream Earth lesson. */
export function mountGlobe(holder: HTMLElement, textureUrl: string) {
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x46657c, 2));
  const sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunlight.position.set(-3, 2, 4); scene.add(sunlight);
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const earth = new THREE.Mesh(geometry, material);
  earth.rotation.set(0.12, 2.3, 0.08); scene.add(earth);

  let disposed = false;
  let visible = true;
  let dragging = false;
  let previousX = 0;
  let previousY = 0;
  let animationFrame = 0;
  let lastTime = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  const rotate = (direction: number) => { earth.rotation.y += direction * 0.35; render(); };
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
    if (visible && !document.hidden && !motion.matches && !dragging) { earth.rotation.y += elapsed * 0.09; render(); }
    animationFrame = requestAnimationFrame(animate);
  };
  canvas.addEventListener('pointerdown', event => {
    dragging = true; previousX = event.clientX; previousY = event.clientY;
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    earth.rotation.y += (event.clientX - previousX) * 0.008;
    earth.rotation.x = Math.max(-1.1, Math.min(1.1, earth.rotation.x + (event.clientY - previousY) * 0.008));
    previousX = event.clientX; previousY = event.clientY; render();
  });
  const release = () => { dragging = false; };
  window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
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
  return { rotate, dispose() {
    disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); visibilityObserver.disconnect();
    window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release);
    material.map?.dispose(); material.dispose(); geometry.dispose(); renderer.dispose();
  } };
}

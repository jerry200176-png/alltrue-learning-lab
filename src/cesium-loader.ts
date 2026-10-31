// Load the Cesium runtime only when the homepage needs a globe. Individual
// course pages retain their existing lightweight startup path.
let pending: Promise<void> | undefined;
export function loadCesium(): Promise<void> {
  if (import.meta.env.DEV) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}cesium/Cesium.js`;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); pending = undefined; reject(new Error('Cesium unavailable')); };
    document.head.append(script);
  });
  return pending;
}

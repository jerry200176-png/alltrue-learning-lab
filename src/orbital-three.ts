// The upstream simulation expects the Three.js namespace on its own window.
import * as THREE from 'three';
Object.assign(globalThis, { THREE });

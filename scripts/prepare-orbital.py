from pathlib import Path
import re
source=Path('vendor/open-science/atomic-orbital.original.html').read_text()
s=source.replace('<html lang="en">','<html lang="zh-Hant-TW">',1)
s,n=re.subn(r'\s*<!-- Tailwind CSS -->\s*<script src="https://cdn\.tailwindcss\.com"></script>\s*<!-- Three\.js -->\s*<script src="https://cdnjs\.cloudflare\.com/ajax/libs/three\.js/0\.160\.0/three\.min\.js"></script>\s*<link\s+href="https://fonts\.googleapis\.com/[^>]+>', '\n    <!-- Local styles and Three.js are supplied by the host. -->',s,count=1);assert n==1
start=s.index('    <!-- Language Selector -->');end=s.index('    <div class="flex flex-col md:flex-row',start);s=s[:start]+s[end:]
start=s.index('        const translations = {');end=s.index('        const ELEMENTS = [',start);s=s[:start]+'        const translations = window.__ALLTRUE_ORBITAL_TRANSLATIONS;\n\n'+s[end:]
s=s.replace("let currentLang = 'en-US';","let currentLang = 'zh-HK';",1)
s=s.replace('        let animationId;', "        let animationId;\n        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');",1)
s=s.replace('            if (atomGroup) {\n                atomGroup.rotation.y += 0.002;', '            if (atomGroup && !reducedMotion.matches) {\n                atomGroup.rotation.y += 0.002;',1)
start=s.index('        function setLanguage(lang)');end=s.index('        function getOrbitalsForZ(z)',start)
s=s[:start]+'''        function updateLanguageUI() {
            document.title = translations[currentLang].app_title;
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const value = translations[currentLang][el.getAttribute('data-i18n')];
                if (value) el.textContent = value;
            });
        }

'''+s[end:]
s=s.replace("if (z >= 19) orbitals.push({ type: 's', n: 4, electrons: 2 });", "if (z >= 19) orbitals.push({ type: 's', n: 4, electrons: (z === 19 || z === 24 || z === 29) ? 1 : 2 });")
s=s.replace("if (z >= 21) orbitals.push({ type: 'd', n: 3, electrons: Math.min(z - 20, 10) });", "if (z >= 21) orbitals.push({ type: 'd', n: 3, electrons: Math.min(z - 20 + ((z === 24 || z === 29) ? 1 : 0), 10) });")
s=s.replace('id="canvas-container">','id="canvas-container" tabindex="0" role="img" aria-label="原子軌域形狀示意，可拖曳或用方向鍵旋轉">',1)
s=s.replace('<div class="flex flex-col md:flex-row min-h-screen md:h-screen overflow-x-hidden">','<div id="orbital-layout" class="flex flex-col md:flex-row min-h-screen md:h-screen overflow-x-hidden">',1)
s=s.replace('class="w-full md:w-96 bg-gray-800/90 backdrop-blur-md p-6 flex flex-col gap-6 border-r border-gray-700 z-10 shadow-2xl overflow-y-auto shrink-0">','id="orbital-controls" class="w-full md:w-96 bg-gray-800/90 backdrop-blur-md p-6 flex flex-col gap-6 border-r border-gray-700 z-10 shadow-2xl overflow-y-auto shrink-0">',1)
assert 'id="orbital-layout"' in s and 'id="orbital-controls"' in s
s=s.replace('<!-- Element Display Card -->\n            <div class="space-y-4">','<!-- Element Display Card -->\n            <div id="element-display" class="space-y-4">',1)
assert 'id="element-display"' in s
s=s.replace("            if (oldGroup) scene.remove(oldGroup);", """            if (oldGroup) {
                scene.remove(oldGroup);
                const materials = new Set(), geometries = new Set();
                oldGroup.traverse(child => { if (child.geometry) geometries.add(child.geometry); if (child.material) materials.add(child.material); });
                geometries.forEach(geometry => geometry.dispose());
                materials.forEach(material => material.dispose());
            }""")
start=s.index('            // 1. Nucleus');end=s.index('            // 2. Orbitals',start)
s=s[:start]+'''            // A symbolic nucleus; isotope or nucleon counts are not represented.
            const nucleusGeometry = new THREE.SphereGeometry(0.32, 24, 16);
            const nucleusMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x440000 });
            atomGroup.add(new THREE.Mesh(nucleusGeometry, nucleusMaterial));

'''+s[end:]
s=s.replace('                        lobe.rotation.z = angle;', '                        lobe.rotation.z = angle - Math.PI / 2;')
s=s.replace('                    dGroup.rotation.x = Math.random() * Math.PI;\n                    dGroup.rotation.y = Math.random() * Math.PI;\n','')
start=s.index('        function setupInteraction()');end=s.index('        // -----------------------------------------------------------------------------\n        // 3. UI UPDATE LOGIC',start)
s=s[:start]+'''        function setupInteraction() {
            let previous = null;
            container.style.touchAction = 'none';
            container.addEventListener('pointerdown', event => {
                previous = { x: event.clientX, y: event.clientY };
                container.setPointerCapture(event.pointerId);
            });
            container.addEventListener('pointermove', event => {
                if (!previous || !atomGroup) return;
                atomGroup.rotation.y += (event.clientX - previous.x) * 0.01;
                atomGroup.rotation.x += (event.clientY - previous.y) * 0.01;
                previous = { x: event.clientX, y: event.clientY };
            });
            const release = () => { previous = null; };
            container.addEventListener('pointerup', release);
            container.addEventListener('pointercancel', release);
            container.addEventListener('keydown', event => {
                if (!atomGroup || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault();
                if (event.key === 'ArrowLeft') atomGroup.rotation.y -= 0.2;
                if (event.key === 'ArrowRight') atomGroup.rotation.y += 0.2;
                if (event.key === 'ArrowUp') atomGroup.rotation.x -= 0.2;
                if (event.key === 'ArrowDown') atomGroup.rotation.x += 0.2;
            });
            const resize = () => {
                if (!camera || !renderer || !container.clientWidth || !container.clientHeight) return;
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight);
            };
            new ResizeObserver(resize).observe(container);
        }

'''+s[end:]
start=s.index("            // Init Language\n",s.index("window.addEventListener('DOMContentLoaded'"));end=s.index('            updateUI(currentZ);',start)
s=s[:start]+'''            updateLanguageUI();
'''+s[end:]
s=s.replace("        const slider = document.getElementById('z-slider');", "        const slider = document.getElementById('z-slider');\n        slider.setAttribute('aria-label', '選擇元素的原子序');")
assert 'https://' not in s and 'Math.random()' not in s and 'touchstart' not in s
assert "window.__ALLTRUE_ORBITAL_TRANSLATIONS" in s
Path('public/open-science/atomic-orbital.html').write_text(s)

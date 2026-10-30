import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['dist/**', 'public/**', 'node_modules/**'] }, js.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.ts'], languageOptions: { globals: { document: 'readonly', window: 'readonly', location: 'readonly', history: 'readonly', navigator: 'readonly', HTMLCanvasElement: 'readonly', CanvasRenderingContext2D: 'readonly', MutationObserver: 'readonly', Node: 'readonly', HTMLElement: 'readonly', HTMLInputElement: 'readonly', fetch: 'readonly', URL: 'readonly', console: 'readonly' } }
});

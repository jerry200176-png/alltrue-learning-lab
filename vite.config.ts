import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import packageJson from './package.json';

// Metadata describes the actual checkout used by the build; missing Git is explicit.
function buildMetadata() {
  let revision: string | null = null;
  let dirty: boolean | null = null;
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
  } catch { /* A source archive without Git cannot establish a commit identity. */ }
  return { version: packageJson.version, revision, dirty, upstream: '4d63ce0a72d987c850ec6d919e570bdb752c87a6' };
}
export default defineConfig({
  base: './',
  plugins: [{ name: 'release-metadata', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(buildMetadata(), null, 2) + '\n' }); } }]
});

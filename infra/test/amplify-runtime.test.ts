import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { describe, it, type TestContext } from 'node:test';

const scriptPath = path.resolve(__dirname, '../scripts/prepare-amplify-next-runtime.mjs');

function fixture(testContext: TestContext, appRoot: string) {
  const root = mkdtempSync(path.join(tmpdir(), 'despega-amplify-runtime-'));
  testContext.after(() => rmSync(root, { recursive: true, force: true }));
  const app = path.join(root, appRoot);
  const next = path.join(app, '.next');
  const nextPackage = path.join(app, 'node_modules/next');
  mkdirSync(path.join(next, 'server'), { recursive: true });
  mkdirSync(path.join(nextPackage, 'dist'), { recursive: true });
  for (const name of ['@next/env', '@swc/helpers', 'client-only', 'react', 'react-dom', 'scheduler', 'styled-jsx']) {
    const directory = path.join(app, 'node_modules', name);
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
    writeFileSync(path.join(directory, 'index.js'), 'export default {};');
  }
  return { root, app, next, nextPackage };
}

for (const appRoot of ['apps/web', 'apps/admin']) {
  describe(`empaquetado SSR de Amplify: ${appRoot}`, () => {
    it('retira solo mapas de Next y limpia sus referencias sin quitar runtime ni mapas de la app', (testContext) => {
      const { root, next, nextPackage } = fixture(testContext, appRoot);
      const runtime = path.join(nextPackage, 'dist/server.js');
      const sourceMap = `${runtime}.map`;
      const binary = path.join(nextPackage, 'dist/runtime.node');
      const applicationMap = path.join(next, 'server/page.js.map');
      writeFileSync(runtime, 'module.exports = {};');
      writeFileSync(sourceMap, '{"version":3}');
      writeFileSync(binary, 'runtime binary');
      writeFileSync(applicationMap, '{"version":3}');
      const tracePaths = [path.join(next, 'next-server.js.nft.json'), path.join(next, 'server/page.js.nft.json')];
      for (const tracePath of tracePaths) {
        const files = [runtime, sourceMap, binary, applicationMap].map((filePath) => path.relative(path.dirname(tracePath), filePath));
        writeFileSync(tracePath, JSON.stringify({ version: 1, files }));
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const result = spawnSync(process.execPath, [scriptPath, appRoot], { cwd: root, encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(existsSync(sourceMap), false);
        assert.ok(existsSync(runtime) && existsSync(binary) && existsSync(applicationMap));
        assert.ok(existsSync(path.join(root, 'node_modules/@swc/helpers/index.js')));
        for (const tracePath of tracePaths) {
          const trace = JSON.parse(readFileSync(tracePath, 'utf8')) as { files: string[] };
          const files = trace.files.map((filePath) => path.resolve(path.dirname(tracePath), filePath));
          assert.equal(files.includes(sourceMap), false);
          assert.ok(files.includes(runtime) && files.includes(binary) && files.includes(applicationMap));
        }
      }
    });

    it('rechaza un Next enlazado para no modificar el almacén compartido de pnpm', (testContext) => {
      const { root, nextPackage } = fixture(testContext, appRoot);
      const sharedPackage = path.join(root, 'shared-next');
      mkdirSync(sharedPackage);
      writeFileSync(path.join(sharedPackage, 'server.js.map'), '{}');
      rmSync(nextPackage, { recursive: true });
      symlinkSync(sharedPackage, nextPackage, 'dir');
      const result = spawnSync(process.execPath, [scriptPath, appRoot], { cwd: root, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Materialize the app node_modules/);
      assert.ok(existsSync(path.join(sharedPackage, 'server.js.map')));
      assert.equal(existsSync(path.join(root, 'node_modules/@next/env')), false);
    });
  });
}

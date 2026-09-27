import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const appRoot = process.argv[2];

if (!appRoot) {
  throw new Error('Usage: node infra/scripts/prepare-amplify-next-runtime.mjs <appRoot>');
}

const runtimePackages = [
  '@next/env',
  '@swc/helpers',
  'client-only',
  'react',
  'react-dom',
  'scheduler',
  'styled-jsx',
];
const traceFiles = ['next-server.js.nft.json', 'next-minimal-server.js.nft.json'];
const repoRoot = process.cwd();
const appDir = path.resolve(repoRoot, appRoot);
const nextDir = path.join(appDir, '.next');
const rootNodeModules = path.join(repoRoot, 'node_modules');
const materializedPackages = new Set();
const pendingPackages = runtimePackages.map((packageName) => ({
  sourcePackageName: packageName,
  targetPackageName: packageName,
  required: true,
}));
const tracedFiles = [];

if (!existsSync(nextDir)) {
  throw new Error(`Missing Next.js build output at ${nextDir}.`);
}

const turbopackPackageAliases = await detectTurbopackPackageAliases();
await rewriteTurbopackPackageAliases(turbopackPackageAliases);

for (const alias of turbopackPackageAliases) {
  const packageName = packageNameFromTurbopackAlias(alias);
  pendingPackages.push({
    sourcePackageName: packageName,
    targetPackageName: packageName,
    required: true,
  });
}

while (pendingPackages.length > 0) {
  const { sourcePackageName, targetPackageName, required } = pendingPackages.shift();
  const materializedKey = `${sourcePackageName}->${targetPackageName}`;
  if (materializedPackages.has(materializedKey)) continue;

  const source = resolvePackageSource(sourcePackageName, { required });
  if (!source) continue;

  materializedPackages.add(materializedKey);

  const target = path.join(rootNodeModules, targetPackageName);
  await rm(target, { force: true, recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, {
    dereference: true,
    filter: (entryPath) => shouldCopyRuntimeEntry(source, entryPath),
    recursive: true,
  });

  for (const dependencyName of await readRuntimeDependencyNames(source)) {
    pendingPackages.push({
      sourcePackageName: dependencyName,
      targetPackageName: dependencyName,
      required: false,
    });
  }

  for await (const filePath of walkFiles(target)) {
    const relativeToNextDir = path.relative(nextDir, filePath).split(path.sep).join('/');
    tracedFiles.push(relativeToNextDir);
  }
}

for (const traceFile of traceFiles) {
  const tracePath = path.join(nextDir, traceFile);
  if (!existsSync(tracePath)) continue;

  const manifest = JSON.parse(await readFile(tracePath, 'utf8'));
  const files = new Set(Array.isArray(manifest.files) ? manifest.files : []);
  for (const filePath of tracedFiles) files.add(filePath);

  manifest.files = [...files].sort();
  await writeFile(tracePath, `${JSON.stringify(manifest)}\n`);
}

function resolvePackageSource(packageName, options = { required: true }) {
  const candidates = [
    path.join(appDir, 'node_modules', packageName),
    path.join(appDir, 'node_modules', '.pnpm', 'node_modules', packageName),
    path.join(rootNodeModules, '.pnpm', 'node_modules', packageName),
  ];

  const source = candidates.find((candidate) => existsSync(candidate));
  if (!source) {
    if (!options.required) return undefined;
    throw new Error(`Missing runtime package ${packageName}. Checked: ${candidates.join(', ')}`);
  }

  return source;
}

async function detectTurbopackPackageAliases() {
  const aliases = new Set();
  const serverDir = path.join(nextDir, 'server');
  if (!existsSync(serverDir)) return aliases;

  const aliasPattern = /(?:^|["'])((?:@[^/'"]+\/)?[^/'"]+-[a-f0-9]{16})(?=\/|["'])/g;
  for await (const filePath of walkFiles(serverDir)) {
    if (!filePath.endsWith('.js')) continue;

    const source = await readFile(filePath, 'utf8');
    for (const match of source.matchAll(aliasPattern)) aliases.add(match[1]);
  }

  return aliases;
}

async function rewriteTurbopackPackageAliases(aliases) {
  if (aliases.size === 0) return;

  const serverDir = path.join(nextDir, 'server');
  for await (const filePath of walkFiles(serverDir)) {
    if (!filePath.endsWith('.js')) continue;

    const source = await readFile(filePath, 'utf8');
    let rewritten = source;
    for (const alias of aliases) {
      rewritten = rewritten.replaceAll(alias, packageNameFromTurbopackAlias(alias));
    }

    if (rewritten !== source) await writeFile(filePath, rewritten);
  }
}

function packageNameFromTurbopackAlias(alias) {
  const suffixPattern = /-[a-f0-9]{16}$/;
  if (alias.startsWith('@')) {
    const [scope, packageName] = alias.split('/');
    return `${scope}/${packageName.replace(suffixPattern, '')}`;
  }

  return alias.replace(suffixPattern, '');
}

function shouldCopyRuntimeEntry(packageDir, entryPath) {
  const relativePath = path.relative(packageDir, entryPath).split(path.sep).join('/');
  if (!relativePath) return true;

  const segments = relativePath.split('/');
  const baseName = segments.at(-1);
  return !(
    segments.some((segment) =>
      ['.github', '__tests__', 'coverage', 'docs', 'examples', 'src', 'test', 'tests'].includes(
        segment,
      ),
    ) || /\.(?:d\.)?(?:cts|map|md|mts|ts|tsx)$/.test(baseName)
  );
}

async function readRuntimeDependencyNames(packageDir) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!existsSync(packageJsonPath)) return [];

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const ignoredDependencyNames = new Set(['next', 'typescript']);
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {}).filter(
    (dependencyName) => !packageJson.peerDependenciesMeta?.[dependencyName]?.optional,
  );

  return [
    ...new Set([...Object.keys(packageJson.dependencies ?? {}), ...peerDependencies]),
  ].filter(
    (dependencyName) =>
      !ignoredDependencyNames.has(dependencyName) && !dependencyName.startsWith('@types/'),
  );
}

async function* walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(entryPath);
    } else if (entry.isFile()) {
      yield entryPath;
    }
  }
}

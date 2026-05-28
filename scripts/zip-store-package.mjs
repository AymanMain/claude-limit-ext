import { execSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

export function getVersion() {
  return JSON.parse(readFileSync('package.json', 'utf-8')).version;
}

export function zipForStore(store) {
  const version = getVersion();
  const outDir = join('release', store);
  const zipName = `claude-session-tracker-${store}-v${version}.zip`;
  const outPath = join(outDir, zipName);

  mkdirSync(outDir, { recursive: true });

  if (process.platform === 'win32') {
    execSync(
      `powershell -Command "Compress-Archive -Path 'dist\\*' -DestinationPath '${outPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd dist && zip -r "../${outPath.replace(/\\/g, '/')}" .`, {
      stdio: 'inherit',
      shell: true,
    });
  }

  console.log(`\n✓ ${outPath}`);
}

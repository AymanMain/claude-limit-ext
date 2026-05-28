import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const checks = [];

function check(label, pass, detail = '') {
  checks.push({ label, pass, detail });
}

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'));

check(
  'Version aligned',
  pkg.version === manifest.version,
  pkg.version === manifest.version
    ? pkg.version
    : `package.json=${pkg.version} manifest=${manifest.version}`
);

check('Manifest V3', manifest.manifest_version === 3);

check(
  'No activeTab permission',
  !(manifest.permissions ?? []).includes('activeTab')
);

const hostPerms = manifest.host_permissions ?? [];
check(
  'No broad host permissions',
  !hostPerms.includes('<all_urls>') && !hostPerms.includes('*://*/*')
);

check('Privacy docs exist', existsSync('docs/privacy.html'));
check('SECURITY.md exists', existsSync('SECURITY.md'));
check('CHANGELOG.md exists', existsSync('CHANGELOG.md'));
check('Build output exists', existsSync('dist/manifest.json'));

try {
  execSync('npm audit --omit=dev --audit-level=high', { stdio: 'pipe' });
  check('Production audit clean (high+)', true);
} catch {
  check('Production audit clean (high+)', false, 'run: npm audit --omit=dev');
}

let allPass = true;
for (const { label, pass, detail } of checks) {
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`);
  if (!pass) allPass = false;
}

if (!allPass) {
  console.error('\nRelease validation failed.');
  process.exit(1);
} else {
  console.log('\nAll checks passed. Ready to package.');
}

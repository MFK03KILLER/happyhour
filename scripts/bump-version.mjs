#!/usr/bin/env node
// Bump the release version for one or both apps, on both platforms.
//
//   node scripts/bump-version.mjs            -> patch bump on both apps
//   node scripts/bump-version.mjs 1.1.0      -> set an explicit version
//   node scripts/bump-version.mjs --app customer-app 1.0.2
//
// Android needs versionCode to strictly increase; iOS needs CURRENT_PROJECT_VERSION
// (the build number) to increase within the same MARKETING_VERSION. Both stores
// reject an upload that reuses a number, which is the usual reason a release stalls.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const args = process.argv.slice(2);
let apps = ['customer-app', 'merchant-app'];
let version = null;

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--app') { apps = [args[i + 1]]; i += 1; continue; }
  if (/^\d+\.\d+\.\d+$/.test(args[i])) version = args[i];
}

function bumpPatch(v) {
  const [a, b, c] = v.split('.').map(Number);
  return `${a}.${b}.${c + 1}`;
}

for (const app of apps) {
  const gradle = `${app}/android/app/build.gradle`;
  let nextVersion = version;
  let nextCode = null;

  // ---- Android ----
  if (existsSync(gradle)) {
    let g = readFileSync(gradle, 'utf8');
    const curName = g.match(/versionName\s+"([^"]+)"/)?.[1];
    const curCode = Number(g.match(/versionCode\s+(\d+)/)?.[1]);
    if (!curName || !Number.isFinite(curCode)) {
      console.error(`${app}: could not read versionName/versionCode from build.gradle`);
      process.exit(1);
    }
    nextVersion = nextVersion || bumpPatch(curName);
    nextCode = curCode + 1;
    g = g.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`);
    g = g.replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);
    writeFileSync(gradle, g);
    console.log(`${app}  android  ${curName} (${curCode})  ->  ${nextVersion} (${nextCode})`);
  } else {
    console.log(`${app}  android  no android/ folder — skipped`);
  }

  // ---- iOS ----
  const pbx = `${app}/ios/App/App.xcodeproj/project.pbxproj`;
  if (existsSync(pbx)) {
    let p = readFileSync(pbx, 'utf8');
    const curBuild = Number(p.match(/CURRENT_PROJECT_VERSION = (\d+)/)?.[1] ?? 0);
    const nextBuild = curBuild + 1;
    nextVersion = nextVersion || '1.0.1';
    p = p.replace(/CURRENT_PROJECT_VERSION = \d+/g, `CURRENT_PROJECT_VERSION = ${nextBuild}`);
    p = p.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextVersion};`);
    writeFileSync(pbx, p);
    console.log(`${app}  ios      build ${curBuild} -> ${nextBuild}, version ${nextVersion}`);
  } else {
    console.log(`${app}  ios      no ios/ folder here — set Version/Build in Xcode instead`);
  }
}

console.log('\nNext: commit, then build and upload. See ANDROID/README-FINGLISH.md.');

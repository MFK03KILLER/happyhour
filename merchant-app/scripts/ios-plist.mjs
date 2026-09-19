// Ensures the iOS Info.plist always carries the usage strings this app needs.
// The scanner calls getUserMedia; without NSCameraUsageDescription iOS kills the
// app the moment the Scan tab opens. Runs after `cap sync ios`, so a freshly
// generated ios/ folder is never missing them.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const PLIST = 'ios/App/App/Info.plist';

const ENTRIES = [
  ['NSCameraUsageDescription',
    '<string>The camera scans member coupon QR codes at the counter.</string>'],
  // Standard HTTPS only - declaring it here stops the export-compliance prompt.
  ['ITSAppUsesNonExemptEncryption', '<false/>'],
];

if (!existsSync(PLIST)) {
  console.log('ios-plist: no ios/ platform yet — run `npx cap add ios` first. Skipping.');
  process.exit(0);
}

let s = readFileSync(PLIST, 'utf8');
let added = 0;

for (const [key, value] of ENTRIES) {
  if (s.includes(`<key>${key}</key>`)) continue;
  const idx = s.lastIndexOf('</dict>');
  if (idx === -1) { console.error('ios-plist: malformed Info.plist'); process.exit(1); }
  s = `${s.slice(0, idx)}\t<key>${key}</key>\n\t${value}\n${s.slice(idx)}`;
  added += 1;
  console.log(`ios-plist: added ${key}`);
}

if (added) writeFileSync(PLIST, s);
console.log(added ? `ios-plist: ${added} key(s) written` : 'ios-plist: already complete');

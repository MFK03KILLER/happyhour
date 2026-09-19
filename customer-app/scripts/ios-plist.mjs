// Ensures the iOS Info.plist always carries the usage strings this app needs.
// Without NSLocationWhenInUseUsageDescription iOS kills the app the moment it asks
// for location, and App Store Connect nags for export compliance on every upload.
// Runs after `cap sync ios`, so a freshly generated ios/ folder is never missing them.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const PLIST = 'ios/App/App/Info.plist';

const ENTRIES = [
  ['NSLocationWhenInUseUsageDescription',
    '<string>Happy Hour uses your location to show partner venues near you.</string>'],
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

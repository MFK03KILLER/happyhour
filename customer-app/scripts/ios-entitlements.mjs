// Gives the iOS app the Sign in with Apple capability. Without the
// com.apple.developer.applesignin entitlement Apple's sign-in sheet fails with
// ASAuthorizationError 1000. Runs after `cap sync ios`; safe to repeat, and it
// keeps whatever was already added in Xcode (+ Capability writes the same file).
import { existsSync, readFileSync, writeFileSync } from 'fs';

const PBX = 'ios/App/App.xcodeproj/project.pbxproj';
const KEY = 'com.apple.developer.applesignin';

if (!existsSync(PBX)) {
  console.log('ios-entitlements: no ios/ platform yet — run `npx cap add ios` first. Skipping.');
  process.exit(0);
}

let pbx = readFileSync(PBX, 'utf8');
// Xcode may already point at an entitlements file (added through + Capability).
const existing = pbx.match(/CODE_SIGN_ENTITLEMENTS = "?([^";]+)"?;/);
const rel = existing ? existing[1] : 'App/App.entitlements';   // relative to ios/App
const file = `ios/App/${rel}`;

let plist = existsSync(file)
  ? readFileSync(file, 'utf8')
  : '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
    + '<plist version="1.0">\n<dict>\n</dict>\n</plist>\n';
if (plist.includes(`<key>${KEY}</key>`)) {
  console.log(`ios-entitlements: ${rel} already has Sign in with Apple`);
} else {
  const idx = plist.lastIndexOf('</dict>');
  if (idx === -1) { console.error(`ios-entitlements: ${rel} is not a valid plist`); process.exit(1); }
  plist = `${plist.slice(0, idx)}\t<key>${KEY}</key>\n\t<array>\n\t\t<string>Default</string>\n\t</array>\n${plist.slice(idx)}`;
  writeFileSync(file, plist);
  console.log(`ios-entitlements: added Sign in with Apple to ${rel}`);
}

if (!existing) {
  // Both build configurations (Debug, Release) of the App target.
  let n = 0;
  pbx = pbx.replace(/\n(\t+)INFOPLIST_FILE = App\/Info\.plist;/g, (line, tabs) => {
    n += 1;
    return `\n${tabs}CODE_SIGN_ENTITLEMENTS = ${rel};${line}`;
  });
  if (!n) {
    console.error('ios-entitlements: could not find the App target settings. In Xcode: Signing & Capabilities → + Capability → Sign in with Apple.');
    process.exit(1);
  }
  writeFileSync(PBX, pbx);
  console.log(`ios-entitlements: App target now signs with ${rel} (${n} configurations)`);
}

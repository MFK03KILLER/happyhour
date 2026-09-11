// Writes capacitor.config.json for the chosen mode. Usage: node scripts/cap-config.mjs bundled|remote
//   bundled (store release per web update)  |  remote (shell loads the live site; web deploys update the app instantly)
import { writeFileSync } from 'fs';
const mode = process.argv[2] || 'bundled';
const REMOTE_URL = process.env.HH_REMOTE_URL || 'https://happyhourz.org';
const ALLOW_NAV = ['happyhourz.org', '*.happyhourz.org', 'checkout.stripe.com', '*.stripe.com'];
const cfg = {
  appId: 'app.happyhour.customer',
  appName: 'Happy Hour',
  webDir: 'dist',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false, backgroundColor: '#0E5C5C' },
  // Stripe Checkout lives on checkout.stripe.com. Without allowNavigation the
  // WebView would punt it to the system browser and the customer would never
  // come back to the app after paying.
  server: mode === 'remote'
    ? { url: REMOTE_URL, cleartext: false, androidScheme: 'https', iosScheme: 'capacitor', allowNavigation: ALLOW_NAV }
    : { androidScheme: 'https', iosScheme: 'capacitor', allowNavigation: ALLOW_NAV },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: '#0E5C5C', showSpinner: false, androidScaleType: 'CENTER_CROP' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};
writeFileSync('capacitor.config.json', JSON.stringify(cfg, null, 2) + '\n');
console.log('capacitor.config.json ->', mode, mode === 'remote' ? REMOTE_URL : '(bundled assets)');

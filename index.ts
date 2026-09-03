import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

/**
 * App is *required*, not imported, and on web not until CanvasKit is up.
 *
 * `skia/Skia.web.js` runs `JsiSkApi(global.CanvasKit)` at module scope, so the
 * whole Skia API is built the instant anything imports the package — and it
 * throws if the WASM has not landed yet. A top-level `import App from './App'`
 * is hoisted above every statement here, so App's module graph (and with it
 * Skia) evaluated before `LoadSkiaWeb` had even been called. Requiring App
 * after the await is what puts those two in the right order.
 *
 * Native links Skia in, so there is nothing to wait for there.
 *
 * registerRootComponent calls AppRegistry.registerComponent('main', () => App).
 * It also ensures that whether the app is loaded in Expo Go or in a native
 * build, the environment is set up appropriately.
 */
function start() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  registerRootComponent(require('./App').default);
}

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  // Served from public/, so the browser fetches it from the dev server rather
  // than looking for it beside the bundle, where it is not.
  LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(start).catch(start);
} else {
  start();
}

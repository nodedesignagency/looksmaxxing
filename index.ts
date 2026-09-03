import { registerRootComponent } from 'expo';
import React from 'react';
import { Platform } from 'react-native';

/**
 * On native, Skia is linked in and the app registers as it always did.
 *
 * On web, Skia is CanvasKit — a WASM binary that has to be fetched before the
 * Skia API exists at all — and the package builds that API the moment anything
 * imports it. So App is not imported here: `WithSkiaWeb` fetches CanvasKit
 * first and then loads App's module graph, which is when Skia is safe to
 * touch. The version pinned in the URL is the one `@shopify/react-native-skia`
 * depends on; re-pin it from `package-lock.json` when Skia moves.
 *
 * registerRootComponent calls AppRegistry.registerComponent('main', () => App).
 * It also ensures that whether the app is loaded in Expo Go or in a native
 * build, the environment is set up appropriately.
 */
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WithSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  const Root = () =>
    React.createElement(WithSkiaWeb, {
      getComponent: () => import('./App'),
      opts: {
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.41.0/bin/full/${file}`,
      },
    });
  registerRootComponent(Root);
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  registerRootComponent(require('./App').default);
}

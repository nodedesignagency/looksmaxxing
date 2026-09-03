import React from 'react';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * Web: Skia is CanvasKit, a WASM binary that has to be fetched before the
 * Skia API exists at all, and the package builds that API the moment anything
 * imports it. So App is not imported here: `WithSkiaWeb` fetches CanvasKit
 * first and then loads App's module graph, which is when Skia is safe to
 * touch.
 *
 * The binary is served from `public/`, not a CDN. Expo copies that directory
 * to the web root, so the fetch is same-origin: it works offline, behind a
 * proxy, and on a locked-down network, none of which a CDN does. If it is
 * missing the page renders nothing at all, so `npm run web` puts it there
 * first — or run `npm run skia:web` by hand. It is 8MB of build output, so it
 * is generated rather than committed, and it must be re-copied whenever Skia
 * moves, which is what the script is for.
 */
export default function Root() {
  return (
    <WithSkiaWeb
      getComponent={() => import('./App')}
      opts={{ locateFile: (file: string) => `/${file}` }}
    />
  );
}

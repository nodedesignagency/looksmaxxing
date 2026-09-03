import React from 'react';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * Web: Skia is CanvasKit, a WASM binary that has to be fetched before the
 * Skia API exists at all, and the package builds that API the moment anything
 * imports it. So App is not imported here: `WithSkiaWeb` fetches CanvasKit
 * first and then loads App's module graph, which is when Skia is safe to
 * touch. The version in the URL is the `canvaskit-wasm` the Skia package
 * depends on; re-pin it from `package-lock.json` when Skia moves.
 */
export default function Root() {
  return (
    <WithSkiaWeb
      getComponent={() => import('./App')}
      opts={{
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.41.0/bin/full/${file}`,
      }}
    />
  );
}

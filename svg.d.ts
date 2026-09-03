declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

/**
 * Font files, imported by subpath so Metro bundles only the faces in use.
 * Metro resolves these to an asset module; TypeScript needs telling.
 */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}

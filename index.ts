import { registerRootComponent } from 'expo';
import Root from './root';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
//
// `./root` is a platform file: `root.tsx` on iOS and Android, `root.web.tsx` on
// web. Metro bundles every require it can see, whatever branch it sits in, so
// the web loader — which pulls in CanvasKit, which imports Node's `fs` — must
// not be referenced from anything the native bundle reads. A platform file is
// the one way to keep it out of the graph entirely. Both carry the same
// extension on purpose: Metro tries every extension before every platform,
// so `root.ts` would win over `root.web.tsx` on web.
registerRootComponent(Root);

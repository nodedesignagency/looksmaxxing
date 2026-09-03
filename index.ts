import { registerRootComponent } from 'expo';
import Root from './root';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
//
// `./root` is a platform file: `root.ts` on iOS and Android, `root.web.tsx` on
// web. Metro bundles every require it can see, whatever branch it sits in, so
// the web loader — which pulls in CanvasKit, which imports Node's `fs` — must
// not be referenced from anything the native bundle reads. A platform file is
// the one way to keep it out of the graph entirely.
registerRootComponent(Root);

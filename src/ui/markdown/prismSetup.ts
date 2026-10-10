// prismjs language components register themselves on a global `Prism`.
// Point that global at prism-react-renderer's instance before they load.
import { Prism } from "prism-react-renderer";

(globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;

export { Prism };

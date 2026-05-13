/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONKEY_MATCH?: string;
  readonly VITE_MONKEY_TARGET?: string;
  readonly VITE_MONKEY_BRAND?: "coral" | "sunmar";
  readonly VITE_YMAPS_API_KEY?: string;
}

declare global {
interface Window {
  OffreWidget?: {
    bootstrap?: (root?: ParentNode) => import("@/widget/entry").BootstrappedOffreWidget[];
    mount?: (
      scriptElement: HTMLScriptElement,
    ) => import("@/widget/entry").BootstrappedOffreWidget | null;
    unmount?: (
      target?: ParentNode | HTMLScriptElement | import("@/widget/entry").BootstrappedOffreWidget,
    ) => number | boolean;
  };
}
}

export {};

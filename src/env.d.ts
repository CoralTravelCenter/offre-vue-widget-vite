/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_MONKEY_MATCH?: string;
  readonly VITE_MONKEY_TARGET?: string;
  readonly VITE_MONKEY_BRAND?: "coral" | "sunmar";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $cityCorrectName: (name: string) => string;
    $cityGenitiveCase: (name: string) => string;
    $offreBrand: import("shared/types/brand").BrandKey;
  }
}

declare global {
interface Window {
  OffreWidget?: {
    bootstrap?: (root?: ParentNode) => import("widget/entry").BootstrappedOffreWidget[];
    mount?: (
      scriptElement: HTMLScriptElement,
    ) => import("widget/entry").BootstrappedOffreWidget | null;
    unmount?: (
      target?: ParentNode | HTMLScriptElement | import("widget/entry").BootstrappedOffreWidget,
    ) => number | boolean;
  };
}
}

export {};

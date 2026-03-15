import { computed, inject, provide, type ComputedRef, type InjectionKey } from "vue";

type ThemeClassResolver = () => string;

const offreThemeClassKey: InjectionKey<ComputedRef<string>> = Symbol("offre-theme-class");

export function provideOffreThemeClass(resolveThemeClass: ThemeClassResolver) {
  const themeClass = computed(() => resolveThemeClass() || "");

  provide(offreThemeClassKey, themeClass);

  return themeClass;
}

export function useOffreThemeClass() {
  return inject(offreThemeClassKey, computed(() => ""));
}

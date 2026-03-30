import {computed} from "vue";
import {useMediaQuery} from "@vueuse/core";

export type ViewportBreakpointKey = "base" | "md" | "lg" | "xl" | "xxl";

export const viewportBreakpointQueries = {
    md: "(min-width: 768px) and (max-width: 1023px)",
    lg: "(min-width: 1024px) and (max-width: 1279px)",
    xl: "(min-width: 1280px) and (max-width: 1439px)",
    xxl: "(min-width: 1440px)"
};

export function useViewportBreakpoints() {
    const isMd = useMediaQuery(viewportBreakpointQueries.md);
    const isLg = useMediaQuery(viewportBreakpointQueries.lg);
    const isXl = useMediaQuery(viewportBreakpointQueries.xl);
    const isXxl = useMediaQuery(viewportBreakpointQueries.xxl);

    const breakpointKey = computed<ViewportBreakpointKey>(() => {
        if (isXxl.value) return "xxl";
        if (isXl.value) return "xl";
        if (isLg.value) return "lg";
        if (isMd.value) return "md";
        return "base";
    });

    return {
        isMd,
        isLg,
        isXl,
        isXXL: isXxl,
        breakpointKey
    };
}

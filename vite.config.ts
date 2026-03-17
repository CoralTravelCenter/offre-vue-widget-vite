import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import {fileURLToPath, URL} from "node:url";
import {defineConfig, loadEnv} from "vite";
import monkey from "vite-plugin-monkey";

const widgetEntry = fileURLToPath(
    new URL("./src/widget/entry.ts", import.meta.url),
);
const monkeyEntry = fileURLToPath(
    new URL("./src/monkey/dev.ts", import.meta.url),
);
const aliasMap = {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    app: fileURLToPath(new URL("./src/app", import.meta.url)),
    brands: fileURLToPath(new URL("./src/brands", import.meta.url)),
    dev: fileURLToPath(new URL("./src/dev", import.meta.url)),
    directives: fileURLToPath(new URL("./src/directives", import.meta.url)),
    monkey: fileURLToPath(new URL("./src/monkey", import.meta.url)),
    offre: fileURLToPath(new URL("./src/offre", import.meta.url)),
    shared: fileURLToPath(new URL("./src/shared", import.meta.url)),
    styles: fileURLToPath(new URL("./src/styles", import.meta.url)),
    ui: fileURLToPath(new URL("./src/shared/components/ui", import.meta.url)),
    widget: fileURLToPath(new URL("./src/widget", import.meta.url)),
};

function resolveMonkeyMatches(rawValue: string | undefined) {
    return (rawValue ?? "https://www.coral.ru/monkey/*,https://www.sunmar.ru/monkey/*")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
}

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), "");
    const isMonkeyMode = mode === "monkey";
    const plugins = [
        vue(),
        tailwindcss(),
        isMonkeyMode &&
        monkey({
            entry: monkeyEntry,
            userscript: {
                name: "Offre Widget Dev Sandbox",
                namespace: "coral-offre-widget",
                description:
                    "Локальный dev-userscript для визуальной проверки виджета на живом сайте.",
                match: resolveMonkeyMatches(env.VITE_MONKEY_MATCH),
                version: "0.1.0",
            },
        }),
    ].filter(Boolean);

    return {
        plugins,
        resolve: {
            alias: aliasMap,
        },
        build: {
            target: "esnext",
            minify: "terser",
            sourcemap: false,
            cssCodeSplit: false,
            reportCompressedSize: true,
            lib: {
                entry: widgetEntry,
                name: "OffreWidget",
                formats: ["iife"],
                fileName: (format) => `offre-widget.${format}.js`,
            },
            rollupOptions: {
                external: ["vue"],
                output: {
                    globals: {
                        vue: "Vue",
                    },
                    assetFileNames: "assets/[name]-[hash][extname]",
                },
            },
        },
    };
});

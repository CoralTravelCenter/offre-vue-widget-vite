# Offre Widget Vite

Локальный migration-sandbox для перевода `offre-vue` с Parcel на Vite без привязки к старой структуре `site/coral`.

## Что уже настроено

- `TypeScript` как базовый язык проекта.
- `TanStack Query` для server state внутри виджета.
- `shadcn-vue` с alias-слоем и набором базовых UI-компонентов.
- `Vite` в режиме library/widget build.
- `Vue` вынесен во внешнюю зависимость на production build.
- `vite-plugin-monkey` для dev-режима на живом сайте.

## Архитектура

- `src/core` — общий runtime, plugins, directives и query-слой.
- `src/features` — функциональные модули виджета.
- `src/brands/coral` и `src/brands/sunmar` — брендовые темы, API-конфиг и UI-отличия.
- `src/shared` — типы, утилиты и общие UI-компоненты.
- `src/widget` — entrypoint для встраивания виджета через `data-offre-vue-test` (временно, чтобы не пересекаться со старым виджетом на сайте).
- `src/dev` — локальный playground.
- `src/monkey` — userscript entrypoint для запуска на живом сайте.

## Договоренности

- Делаем общий движок под Coral и Sunmar.
- `coral.by` в новый проект не переносим.
- Архитектуру строим под Vite и общий runtime, а не под legacy-ограничения Parcel.
- `TanStack Query` считается источником истины для server state.
- Если позже вернем `sessionStorage`, то только как persistence/hydration-слой, а не как параллельный кэш со своей логикой свежести.

## Скрипты

- `npm run dev` — локальный playground Vite.
- `npm run dev:monkey` — dev-userscript для проверки виджета на живом сайте.
- `npm run build` — production build виджета с external `Vue`.
- `npm run typecheck` — строгая проверка TypeScript.
- `npm run test` — Vitest.

## vite-monkey

Скопируйте `.env.example` в `.env` и при необходимости поменяйте:

- `VITE_MONKEY_MATCH` — список url-масок через запятую.
- `VITE_MONKEY_TARGET` — css-селектор host React-root, который должен реально появиться и получить высоту перед монтированием виджета.
- `VITE_MONKEY_BRAND` — `coral` или `sunmar`.

Важно: monkey-entry сначала делает `await hostReactAppReady(...)`, а уже потом создает `#monkey-app` и монтирует виджет. Это нужно для сред, где хостовое React-приложение дорисовывает DOM позже обычного `DOMContentLoaded`.

## Production build

Production build собирает библиотеку виджета в `dist/`:

- `dist/offre-widget.iife.js`
- `dist/assets/*.css`

Важно: `Vue` вынесен наружу, поэтому хост-страница должна предоставить global `Vue` для IIFE-сборки.

## Следующий перенос

1. Перенести shell и feature-runtime из текущего `OffreVue` в `src/features/offre`.
2. Разнести брендовые API-адаптеры Coral и Sunmar в `src/brands/*`.
3. Перенести controls, product-list и map-flow вертикальными срезами, а не всем проектом сразу.

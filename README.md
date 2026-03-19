# Offre Widget Vite

Локальный migration-sandbox для перевода `offre-vue` с Parcel на Vite без привязки к старой структуре `site/coral`.
Проект уже собирает рабочий embed-виджет, но архитектурно все еще находится в стадии аккуратной миграции, а не финальной продуктовой стабилизации.

## Что уже настроено

- `TypeScript` как базовый язык проекта.
- `TanStack Query` для server state внутри виджета.
- `shadcn-vue` с alias-слоем и набором базовых UI-компонентов.
- `Vite` в режиме library/widget build.
- `Vue` вынесен во внешнюю зависимость на production build.
- `vite-plugin-monkey` для dev-режима на живом сайте.

## Архитектура

- `src/app` — фабрика Vue-приложения виджета, регистрация plugins/directives и Query Client.
- `src/offre` — основной feature-модуль виджета: API, query-слой, composables, domain/lib и компоненты.
- `src/brands/coral` и `src/brands/sunmar` — брендовые темы и метаданные. Бренды отличаются темой и расположением части компонентов, остальной runtime общий.
- `src/shared` — типы, утилиты и общие UI-компоненты.
- `src/directives` — переиспользуемые Vue-директивы.
- `src/styles` — глобальные стили и style-abstracts.
- `src/widget` — entrypoint для встраивания виджета через `data-offre-vue-test` (временно, чтобы не пересекаться со старым виджетом на сайте).
- `src/dev` — локальный playground.
- `src/monkey` — userscript entrypoint для запуска на живом сайте.

## Договоренности

- Делаем общий движок под Coral и Sunmar.
- Различия брендов сейчас ограничены темой и отдельными layout/UI-отличиями, а не самостоятельной бизнес-логикой.
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

## Текущий статус

- Базовый widget runtime уже вынесен в отдельный entry и собирается как IIFE-библиотека.
- Основной рабочий модуль сейчас сосредоточен в `src/offre`.
- В репозитории еще есть следы миграции и незавершенные feature-ветки, поэтому `README` описывает текущее состояние, а не целевую финальную структуру.

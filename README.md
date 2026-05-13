# Offre Widget Vite

Embeddable Vue-виджет для подборки офферов Coral/Sunmar.
Проект собирает IIFE-виджет, который встраивается на страницу через `script[type="application/json"][data-offre-vue-test]`, читает payload с настройками и списком отелей, загружает данные с B2C API и рендерит карточки офферов с фильтрами, переключением `тур/отель`, пагинацией и брендовыми темами.

## Что здесь важно

- Общий runtime один для Coral и Sunmar.
- Бренд влияет в основном на тему и отдельные UI-детали, а не на отдельную бизнес-логику.
- Основная feature-логика живёт в `src/offre`.
- Виджет работает как embed: хост-страница передаёт сырой payload, bootstrap его санитизирует, app-слой нормализует в runtime-contract, а дальше feature-слой работает уже с приведёнными данными.

## Архитектурные правила

- `src/widget` — embed/runtime boundary: поиск JSON payload, mount/unmount, работа с DOM-хостом.
- `src/app` — composition root: создание Vue app, plugins, query client, theme/runtime wiring.
- `src/offre` — вся feature- и domain-логика виджета.
- `src/lib` — низкоуровневые общие утилиты без доменной привязки.
- `src/components/ui` — canonical UI root для shadcn и всех базовых UI-примитивов; импорты идут через `@/components/ui/...`.

## Быстрый старт

- `pnpm install`
- `pnpm run dev` — локальный playground
- `pnpm run dev:monkey` — запуск userscript на живом сайте
- `pnpm run build` — production build виджета
- `pnpm run typecheck` — проверка TypeScript
- `pnpm run test` — Vitest

## Переменные окружения

- `VITE_YMAPS_API_KEY` — ключ Yandex Maps для map-view
- `VITE_MONKEY_MATCH` — список `match`-масок для userscript-режима
- `VITE_MONKEY_TARGET` — CSS-селектор контейнера для dev-userscript
- `VITE_MONKEY_BRAND` — бренд userscript-стенда: `coral` или `sunmar`

## Как виджет монтируется

Payload передаётся через JSON-скрипт:

```html
<script type="application/json" data-offre-vue-test>
  {
    "brand": "coral",
    "options": {},
    "hotels": [123, 456]
  }
</script>
```

Bootstrap, санитизация payload и mount/unmount лежат в [src/widget/entry.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/entry.ts).

## Карта ключевых файлов

### Вход и bootstrap

- [src/widget/entry.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/entry.ts) — главный entrypoint embed-виджета: поиск JSON-скриптов, parsing/sanitize payload, mount/unmount.
- [src/app/create-offre-widget-app.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/app/create-offre-widget-app.ts) — composition root: runtime payload normalization, создание Vue app, QueryClient, plugins/directives, подключение темы бренда.
- [src/dev/main.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/dev/main.ts) — локальный playground.
- [src/monkey/dev.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/monkey/dev.ts) — dev userscript для проверки на живом сайте.

### Входные данные

- [src/widget/types.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/types.ts) — контракт payload виджета.
- [src/offre/lib/payload.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/payload.ts) — sanitize/normalize helpers для payload, `options` и `hotels`, плюс сборка runtime payload.
- [src/dev/offre-payloads.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/dev/offre-payloads.ts) — основной мок payload для dev-режима; здесь лежат данные, из которых собирается JSON-скрипт виджета.
- [src/dev/main.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/dev/main.ts) — вставляет моковый `script[type="application/json"]` в локальном playground.
- [src/monkey/dev.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/monkey/dev.ts) — вставляет тот же моковый JSON-скрипт в userscript-режиме на живом сайте.

### UI слой

- `src/components/ui/*` — source of truth для всех UI primitives и shadcn-компонентов.
- В feature-коде используем путь shadcn-конфига: `@/components/ui/*`.

### Данные и API

- [src/offre/api.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/api.ts) — HTTP-клиент, типы API-ответов и search criterias B2C API.
- [src/offre/query.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/query.ts) — query keys, TTL config и persistence query-кэша.

### Фильтры и список

- [src/offre/components/OffreWidgetRoot.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/OffreWidgetRoot.vue) — корневой контейнер feature-модуля: sticky navigation, состояние списка, loading/error/empty, пагинация.
- [src/offre/composables/useOffreFiltersQueryState.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreFiltersQueryState.ts) — orchestration фильтров, departures, hotels info, region/timeframe state.
- [src/offre/lib/filter-state.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/filter-state.ts) — чистые helper-функции для сборки region/departure/timeframe options и фильтрации отелей.
- [src/offre/composables/useOffreProductsQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreProductsQuery.ts) — основной batched query списка офферов.
- [src/offre/lib/search-criterias.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/search-criterias.ts) — сборка search criterias для пакетных и only-hotel запросов.
- [src/offre/composables/useOffreWidgetListState.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreWidgetListState.ts) — view mode, пагинация, `tourTypeByHotelId`.

### Карточка оффера

- [src/offre/components/results/OffreOfferCard.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferCard.vue) — контейнер карточки.
- [src/offre/components/results/OffreOfferPricingPanel.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferPricingPanel.vue) — правая pricing-колонка.
- [src/offre/components/results/OffreOfferTerms.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferTerms.vue) — термы с иконками.
- [src/offre/components/results/OffreCashbackPopover.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreCashbackPopover.vue) — popover CoralBonus.
- [src/offre/components/results/OffreCashbackBanner.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreCashbackBanner.vue) — баннер cashback.
- [src/offre/composables/useOffreOfferCard.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreOfferCard.ts) — orchestration данных карточки.
- [src/offre/composables/useOffreOfferPricing.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreOfferPricing.ts) — расчёт цены, old price, discount и подписи.
- [src/offre/composables/useOffreOfferTerms.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreOfferTerms.ts) — сборка термов карточки.
- [src/offre/composables/useHotelOfferQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useHotelOfferQuery.ts) — запрос `только отель` для карточки.
- [src/offre/lib/product-offer.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/product-offer.ts) — форматирование цены, дат, ссылок и подписей.

### CoralBonus

- [src/offre/lib/coral-bonus.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/coral-bonus.ts) — загрузка внешнего bonus-script и нормализация ответа.
- [src/offre/composables/useCoralBonus.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useCoralBonus.ts) — расчёт cashback для карточки.

### Навигация и controls

- [src/offre/components/RegionTabsNav.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/RegionTabsNav.vue) — tabs регионов.
- [src/offre/components/OffreControls.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/OffreControls.vue) — строка controls в navigation.
- [src/offre/components/CitySelect.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/CitySelect.vue) — выбор города вылета.
- [src/offre/components/MonthSelect.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/MonthSelect.vue) — выбор месяца.
- [src/offre/components/ViewModeSwitch.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/ViewModeSwitch.vue) — переключение список/карта.
- [src/offre/components/results/OffreOfferGuestsControl.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferGuestsControl.vue) — глобальный control выбора туристов в navigation.

### Skeleton / loading UI

- [src/offre/components/RegionTabsNavSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/RegionTabsNavSkeleton.vue)
- [src/offre/components/results/OffreOfferCardSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferCardSkeleton.vue)
- [src/offre/components/results/OffreOffersListSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOffersListSkeleton.vue)

### Темы и стили

- [src/styles/style.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/styles/style.css) — глобальные переменные, theme tokens и offre-specific tokens.
- [src/brands/coral.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/brands/coral.css) — тема Coral.
- [src/brands/sunmar.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/brands/sunmar.css) — тема Sunmar.

## Production build

Сборка лежит в `dist/`:

- `dist/offre-widget.iife.js`
- `dist/assets/*.css`

Важно: `Vue` вынесен наружу, поэтому хост-страница должна предоставить global `Vue` для IIFE-сборки.

## Замечания для разработки

- Если меняется payload-контракт, сначала смотреть [src/widget/types.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/types.ts), [src/widget/entry.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/entry.ts) и [src/offre/lib/payload.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/payload.ts).
- Если меняется логика запросов, сначала смотреть [src/offre/lib/search-criterias.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/search-criterias.ts), [src/offre/composables/useOffreProductsQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreProductsQuery.ts) и [src/offre/composables/useHotelOfferQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useHotelOfferQuery.ts).
- Если меняется UI карточки, входные точки — [src/offre/components/results/OffreOfferCard.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferCard.vue) и [src/offre/composables/useOffreOfferCard.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreOfferCard.ts).
- Если меняется navigation/filter UX, входные точки — [src/offre/components/OffreWidgetRoot.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/OffreWidgetRoot.vue), [src/offre/components/OffreControls.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/OffreControls.vue) и [src/offre/composables/useOffreFiltersQueryState.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreFiltersQueryState.ts).

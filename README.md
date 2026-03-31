# Offre Widget Vite

Embeddable Vue-виджет для подборки офферов Coral/Sunmar.
Проект собирает IIFE-виджет, который встраивается на страницу через `script[type="application/json"][data-offre-vue-test]`, читает payload с настройками и списком отелей, загружает данные с B2C API и рендерит карточки офферов с фильтрами, переключением `тур/отель`, пагинацией и брендовыми темами.

## Что здесь важно

- Общий runtime один для Coral и Sunmar.
- Бренд влияет в основном на тему и отдельные UI-детали, а не на отдельную бизнес-логику.
- Основная feature-логика живёт в `src/offre`.
- Виджет работает как embed: хост-страница передаёт payload, а дальше runtime сам нормализует данные, делает запросы и монтирует приложение.

## Быстрый старт

- `npm install`
- `npm run dev` — локальный playground
- `npm run dev:monkey` — запуск userscript на живом сайте
- `npm run build` — production build виджета
- `npm run typecheck` — проверка TypeScript
- `npm run test` — Vitest

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

Bootstrap, парсинг payload и mount/unmount лежат в [src/widget/entry.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/entry.ts).

## Карта ключевых файлов

### Вход и bootstrap

- [src/widget/entry.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/widget/entry.ts) — главный entrypoint embed-виджета: поиск JSON-скриптов, парсинг payload, mount/unmount.
- [src/app/create-offre-widget-app.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/app/create-offre-widget-app.ts) — создание Vue app, QueryClient, plugins/directives, подключение темы бренда.
- [src/dev/main.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/dev/main.ts) — локальный playground.
- [src/monkey/dev.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/monkey/dev.ts) — dev userscript для проверки на живом сайте.

### Входные данные

- [src/shared/types/widget.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/shared/types/widget.ts) — контракт payload виджета.
- [src/offre/lib/payload.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/payload.ts) — нормализация `options` и `hotels`, приведение входных данных к runtime-формату.
- [src/dev/fixtures/offre-payloads.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/dev/fixtures/offre-payloads.ts) — dev fixtures.

### Данные и API

- [src/offre/api/client.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/api/client.ts) — HTTP-клиент для B2C API.
- [src/offre/api/types.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/api/types.ts) — типы API-ответов и search criterias.
- [src/offre/query/keys.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/query/keys.ts) — query keys.
- [src/offre/query/config.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/query/config.ts) — TTL и query config.
- [src/offre/query/persister.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/query/persister.ts) — persistence query-кэша.

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
- [src/offre/components/controls/OffreControls.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/controls/OffreControls.vue) — строка controls в navigation.
- [src/offre/components/controls/CitySelect.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/controls/CitySelect.vue) — выбор города вылета.
- [src/offre/components/controls/MonthSelect.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/controls/MonthSelect.vue) — выбор месяца.
- [src/offre/components/controls/ViewModeSwitch.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/controls/ViewModeSwitch.vue) — переключение список/карта.
- [src/offre/components/results/OffreOfferGuestsControl.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferGuestsControl.vue) — глобальный control выбора туристов в navigation.

### Skeleton / loading UI

- [src/offre/components/RegionTabsNavSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/RegionTabsNavSkeleton.vue)
- [src/offre/components/results/OffreOfferCardSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferCardSkeleton.vue)
- [src/offre/components/results/OffreOffersListSkeleton.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOffersListSkeleton.vue)

### Темы и стили

- [src/styles/index.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/styles/index.css) — глобальные переменные, theme tokens и offre-specific tokens.
- [src/brands/coral/theme.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/brands/coral/theme.css) — тема Coral.
- [src/brands/sunmar/theme.css](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/brands/sunmar/theme.css) — тема Sunmar.

## Production build

Сборка лежит в `dist/`:

- `dist/offre-widget.iife.js`
- `dist/assets/*.css`

Важно: `Vue` вынесен наружу, поэтому хост-страница должна предоставить global `Vue` для IIFE-сборки.

## Замечания для разработки

- Если меняется payload-контракт, сначала смотреть [src/shared/types/widget.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/shared/types/widget.ts) и [src/offre/lib/payload.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/payload.ts).
- Если меняется логика запросов, сначала смотреть [src/offre/lib/search-criterias.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/lib/search-criterias.ts), [src/offre/composables/useOffreProductsQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreProductsQuery.ts) и [src/offre/composables/useHotelOfferQuery.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useHotelOfferQuery.ts).
- Если меняется UI карточки, входные точки — [src/offre/components/results/OffreOfferCard.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/results/OffreOfferCard.vue) и [src/offre/composables/useOffreOfferCard.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreOfferCard.ts).
- Если меняется navigation/filter UX, входные точки — [src/offre/components/OffreWidgetRoot.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/OffreWidgetRoot.vue), [src/offre/components/controls/OffreControls.vue](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/components/controls/OffreControls.vue) и [src/offre/composables/useOffreFiltersQueryState.ts](/Users/mike/Documents/GitHub/offre-vue-widget-vite/src/offre/composables/useOffreFiltersQueryState.ts).

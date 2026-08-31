# Граф проекта Offre Widget

Эта карта нужна как постоянная точка входа в проект. Начинай отсюда, когда нужно быстро понять поток данных или найти место для изменения, не перечитывая всё дерево `src`.

## Система целиком

```mermaid
flowchart LR
    Host["Хост-страница"]
    Payload["JSON script<br/>data-offre-vue-test"]
    Entry["src/widget/entry.ts<br/>bootstrap / mount / unmount"]
    App["src/app/create-offre-widget-app.ts<br/>composition root"]
    Normalize["src/offre/lib/payload-*<br/>sanitize + normalize"]
    Brand["src/brands/*<br/>Coral / Sunmar themes"]
    QueryClient["TanStack QueryClient<br/>+ sessionStorage persisters"]
    Root["OffreWidgetRoot.vue<br/>feature orchestrator"]
    API["src/offre/api-client.ts<br/>/endpoints/*"]
    B2C["B2C API"]
    UI["List / Map / states"]

    Host --> Payload --> Entry --> App
    Entry --> Normalize
    App --> Normalize
    App --> Brand
    App --> QueryClient
    App --> Root
    Root --> API --> B2C
    QueryClient <--> Root
    Root --> UI
```

Главный runtime-контракт:

1. Хост кладёт сырой payload в `script[type="application/json"][data-offre-vue-test]`.
2. `src/widget/entry.ts` находит script, санитизирует payload и управляет lifecycle.
3. `src/app/create-offre-widget-app.ts` нормализует payload, выбирает бренд, создаёт QueryClient и Vue app.
4. `OffreWidgetRoot.vue` связывает фильтры, запросы, кэш, пагинацию, persistence и UI.

## Границы модулей

```mermaid
flowchart TB
    Widget["src/widget<br/>embed boundary"]
    App["src/app<br/>composition + directives"]
    Offre["src/offre<br/>feature/domain"]
    Brands["src/brands<br/>theme definitions"]
    UI["src/components/ui<br/>base primitives"]
    Shared["src/lib<br/>shared utilities"]
    Monkey["src/monkey + src/dev<br/>live-site dev harness"]

    Monkey --> Widget
    Widget --> App
    Widget --> Offre
    App --> Brands
    App --> Offre
    App --> UI
    Offre --> UI
    Offre --> Brands
    Offre --> Shared
```

Правило зависимостей: embed- и app-слои знают о feature-слое, но domain helpers не должны зависеть от Vue-компонентов или bootstrap-кода.

## Оркестрация корневого виджета

`src/offre/components/OffreWidgetRoot/OffreWidgetRoot.vue` — главный узел проекта.

```mermaid
flowchart TB
    Props["normalized props<br/>brand / options / hotels"]
    Visibility["useOffreWidgetVisibilityState<br/>lazy start"]
    Filters["useOffreFiltersQueryState<br/>hotels info / departures / selection"]
    UIState["useOffreWidgetUiState<br/>guests + effective options"]
    Session["useOffreWidgetSessionState<br/>reset + persistence keys"]
    Paging["useOffreRegionPagingState<br/>current page"]
    Runtime["useOffreWidgetRuntimeState<br/>visible hotels / list mode"]
    Products["useOffreProductsDataState<br/>query + cache facade"]
    ListState["useOffreWidgetListState<br/>pagination / tour type / view mode"]
    LoadMore["useOffreLoadMoreState<br/>load-more transaction"]
    Layout["useOffreWidgetLayoutState<br/>sticky nav / lazy map"]
    Results["useOffreWidgetResultsState<br/>loading / partial / error / empty"]
    Controls["RegionTabsNav + OffreControls<br/>+ ViewModeSwitch"]
    List["OffreOffersList"]
    Map["OffreMapView"]

    Props --> Visibility --> Filters
    Props --> UIState --> Session
    Filters --> UIState
    Filters --> Runtime
    Session --> Paging --> Runtime
    Runtime --> Products
    Filters --> Products
    UIState --> Products
    Products --> ListState --> LoadMore
    Products --> Results
    Runtime --> Results
    Filters --> Controls
    UIState --> Controls
    Layout --> Controls
    ListState --> List
    Results --> List
    Products --> List
    Products --> Map
    Layout --> Map
    Results --> Map
```

## Поток данных офферов

```mermaid
sequenceDiagram
    participant Root as OffreWidgetRoot
    participant Filters as useOffreFiltersQueryState
    participant Data as useOffreProductsDataState
    participant Cache as useOffreProductsCacheState
    participant Query as useOffreProductsQuery
    participant Builder as search-criterias
    participant API as api-client
    participant View as List / Map

    Root->>Filters: options + hotels + viewport enabled
    Filters->>API: ListHotelsInfo + ListDepartureLocations
    API-->>Filters: directories + departures
    Filters-->>Root: matchedHotels + selections
    Root->>Data: matched/visible hotels + filters + page
    Data->>Cache: ask whether region/page is already covered
    Cache-->>Data: shouldFetchRegionProducts
    Data->>Query: enabled + effective hotels
    Query->>Builder: build descriptors and criterias
    Query->>API: package / only-hotel requests concurrently
    API-->>Query: products + reference + partial/error metadata
    Query-->>Cache: products + queried hotel ids + request state
    Cache-->>Data: regionProducts + mapProducts + effective state
    Data-->>Root: stable view model
    Root-->>View: list/map props and state branches
```

### Важная семантика

- `useOffreProductsQuery.ts` отвечает за один фактический batch-запрос и его raw request state.
- `useOffreProductsCacheState.ts` накапливает продукты между страницами/регионами и решает, надо ли запрашивать ещё.
- `useOffreProductsDataState.ts` — фасад между query и cache; наружу лучше зависеть от него, а не связывать эти два composable напрямую.
- `regionProductsSource` ограничен видимыми отелями списка; `mapProductsSource` содержит продукты всей выбранной группы.
- `partial` не равен `success` и не должен помечать все queried hotel ids как загруженные.

## UI-дерево

```mermaid
flowchart TB
    Root["OffreWidgetRoot"]
    Nav["Sticky navigation"]
    Region["RegionTabsNav"]
    Controls["OffreControls"]
    City["CitySelect"]
    Month["MonthSelect"]
    Guests["OffreOfferGuestsControl"]
    Switch["ViewModeSwitch"]
    List["OffreOffersList"]
    Card["OffreOfferCard"]
    Terms["OffreOfferTerms"]
    Pricing["OffreOfferPricingPanel"]
    Bonus["OffreCashbackPopover / Banner"]
    Map["OffreMapView"]
    Sidebar["OffreMapSidebar"]
    Marker["OffreMapMarker / ClusterBadge"]
    Overlay["OffreMapOverlayCard"]
    States["Skeletons + OffreResultsStateNotice"]

    Root --> Nav
    Nav --> Region
    Nav --> Controls
    Nav --> Switch
    Controls --> City
    Controls --> Month
    Controls --> Guests
    Root --> List --> Card
    Card --> Terms
    Card --> Pricing --> Bonus
    Root --> Map
    Map --> Sidebar
    Map --> Marker
    Map --> Overlay
    Root --> States
```

## Ветка карты

```mermaid
flowchart LR
    MapView["OffreMapView.vue"]
    ViewState["useOffreMapViewState<br/>display points + overlay model"]
    HotelOffers["useOffreMapHotelOffers<br/>package/hotel prices"]
    Selection["useOffreMapSelection<br/>active hotel + popup"]
    Location["useOffreMapLocation<br/>center / fit / active point"]
    PureMap["lib/offre-map.ts<br/>pure transformations"]
    YMaps["vue-yandex-maps<br/>Yandex Maps SDK"]

    MapView --> HotelOffers
    MapView --> ViewState
    MapView --> Selection
    MapView --> Location
    HotelOffers --> PureMap
    ViewState --> PureMap
    Selection --> PureMap
    Location --> PureMap
    MapView --> YMaps
```

## Где что менять

| Задача | Начать с | Соседние узлы |
|---|---|---|
| Embed, повторный mount, unmount, DOM markers | `src/widget/entry.ts` | `src/widget/entry.test.ts`, `src/env.d.ts` |
| Создание Vue app, plugins, query client, portal | `src/app/create-offre-widget-app.ts` | `create-widget-query-client.ts`, `offre-portal-target.ts` |
| Sticky navigation | `src/app/fixed-directive.ts` | `fixed-directive.helpers.ts`, `useOffreWidgetLayoutState.ts` |
| Coral/Sunmar и theme variants | `src/brands/registry.ts` | `coral.ts`, `sunmar.ts`, соответствующие CSS |
| Payload contract и нормализация | `src/widget/types.ts` | `src/offre/lib/payload-*.ts` |
| Корневая UI-оркестрация | `OffreWidgetRoot.vue` | `useOffreWidget*State.ts` |
| Регионы, города вылета, timeframe | `useOffreFiltersQueryState.ts` | `filter-state-*.ts`, `timeframes.ts` |
| Search criterias B2C | `src/offre/lib/search-criterias.ts` | `search-criterias-builder/common/helpers/types.ts` |
| HTTP endpoints и transport errors | `src/offre/api-client.ts` | `api-types.ts`, `api.ts` |
| Batch запрос продуктов | `useOffreProductsQuery.ts` | `products-batch.ts`, `concurrency.ts` |
| Кэш продуктов и переходы между регионами | `useOffreProductsCacheState.ts` | `.helpers.ts`, `useOffreProductsDataState.ts` |
| Pagination / load more | `useOffreWidgetListState.ts` | `useOffreRegionPagingState.ts`, `useOffreLoadMoreState.ts` |
| Loading/error/partial/empty UI | `useOffreWidgetResultsState.ts` | `offre-widget-view.ts`, `OffreResultsStateNotice.vue` |
| Карточка отеля | `OffreOfferCard.vue` | `useOffreOfferCardState.ts`, pricing/terms composables |
| Тур/отель для карточки | `useHotelOfferQuery.ts` | `hotel-offer.ts`, `OffreTourTypeTabs.vue` |
| Вся карта | `OffreMapView.vue` | map composables, `lib/offre-map.ts` |
| Гостевой состав | `useOffreWidgetUiState.ts` | `.helpers.ts`, `OffreOfferGuestsControl.vue` |
| Persistence | `useOffreWidgetSessionState.ts` | `offre-widget-root.ts`, `query.ts` |
| Базовые UI-компоненты | `src/components/ui` | `components.json`, `src/lib/utils.ts` |
| Live-site разработка | `src/monkey/dev.ts` | `src/dev/offre-payloads.ts`, `vite.config.ts` |

## Ключевые состояния и владельцы

| State | Владелец |
|---|---|
| `activeRegionId`, departure, timeframe | `useOffreFiltersQueryState` |
| adults / children, `effectiveSearchOptions` | `useOffreWidgetUiState` |
| reset nonce и persistence keys | `useOffreWidgetSessionState` |
| `currentPage` | `useOffreRegionPagingState` |
| `viewMode`, tour type per hotel | `useOffreWidgetListState` + root ref |
| products request state | `useOffreProductsQuery` |
| accumulated products and region outcomes | `useOffreProductsCacheState` |
| list/map loading and empty branches | `useOffreWidgetResultsState` |
| active map hotel and popup | `useOffreMapSelection` |
| map viewport | `useOffreMapLocation` |

## Проверки

```text
pnpm run typecheck   # TypeScript contract
pnpm run test        # unit/component regression suite
pnpm run build       # production IIFE + CSS
pnpm run dev:monkey  # smoke на живой хост-странице
```

Тесты лежат рядом с app/widget файлами или в `__tests__` соответствующего feature-слоя. При изменении orchestration сначала ищи тест одноимённого composable; при изменении pure helper — тест в `src/offre/lib/__tests__`.

## Как поддерживать карту

Обновляй этот файл, когда появляется новый entrypoint, новый владелец состояния, новый внешний сервис или меняется направление основного data flow. Добавление локального helper или UI primitive обычно не требует обновления графа.

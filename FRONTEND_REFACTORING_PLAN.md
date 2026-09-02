# План frontend-рефакторинга Offre Widget

Документ основан на [графе проекта](./PROJECT_GRAPH.md) и [аудите проекта](./PROJECT_ANALYSIS.md). План ограничен frontend-кодом и построен как последовательность небольших изменений без большого одномоментного rewrite.

## Статус выполнения

| PR | Статус | Результат |
|---|---|---|
| 1. Browser baseline и performance marks | Выполнен | Добавлены детерминированный Playwright smoke, mock B2C API, lifecycle/multi-instance проверки и семь frontend performance marks. |
| 2. CSS isolation | Выполнен | Отключён глобальный Preflight, utility selectors и runtime theme variables ограничены widget host; CSS sentinel, portal и multi-brand проверки включены. |
| 3. Bootstrap/products activation | Следующий | Разделение ранней загрузки справочников и viewport activation поиска цен. |

## Цели

1. Изолировать embed-виджет от CSS и runtime-состояния страницы-хоста.
2. Сократить воспринимаемое время до первой карточки при неизменной скорости B2C API.
3. Исключить лишние и устаревшие запросы list/map flow.
4. Сделать состояния загрузки, partial result, error и empty единообразными.
5. Упростить `OffreWidgetRoot.vue` и явно определить владельцев состояния.
6. Снизить стоимость list-only загрузки и закрепить ограничения performance-тестами.

## Не входит в план

- Ускорение backend `PriceSearchList` и его downstream-провайдеров.
- Исправление `meta.elapsedTime` или добавление `Server-Timing` на сервере.
- Изменение бизнес-правил поиска, состава фильтров или сортировки.
- Визуальный редизайн карточек и карты.
- Переход на Shadow DOM без отдельного технического решения по portals и Yandex Maps.

## Принципы выполнения

- Один PR решает одну проверяемую проблему.
- Сначала фиксируются наблюдаемое поведение и метрики, затем меняется архитектура.
- Новый controller не должен одновременно переписывать query/cache/persistence.
- Производительность сравнивается в одинаковой сети: VPN cold с VPN cold, VPN warm с VPN warm.
- Изменения list-flow не должны ухудшать map-flow и наоборот.
- Каждый этап должен оставлять ветку готовой к production build.

## Этап 0. Зафиксировать baseline и защитную сетку

### Задачи

1. Добавить Playwright smoke harness для реального браузера.
2. Зафиксировать сценарии mount, второй mount, unmount/remount и два виджета на одной странице.
3. Добавить host CSS sentinel: стили `body`, обычной кнопки и тестового блока не меняются после подключения widget CSS.
4. Добавить сценарии list/map switch, sticky navigation и восстановление сохранённого view mode.
5. Добавить performance marks:
   - `offre:mounted`;
   - `offre:visible`;
   - `offre:bootstrap-ready`;
   - `offre:products-request-start`;
   - `offre:products-request-end`;
   - `offre:first-card-rendered`;
   - `offre:first-image-loaded`.
6. В debug mode выводить итоговые durations одним структурированным сообщением без персональных данных и полного payload.

### Основные файлы

- `src/widget/entry.ts`
- `src/offre/composables/useOffreWidgetVisibilityState.ts`
- `src/offre/composables/useOffreFiltersQueryState.ts`
- `src/offre/composables/useOffreProductsQuery.ts`
- `src/offre/components/results/OffreOffersList/OffreOffersList.vue`
- новый каталог browser smoke/e2e

### Критерии готовности

- В тесте измеряется путь от `visible` до `first-card-rendered`.
- Frontend overhead между получением products и первой карточкой не превышает `100 ms` на desktop smoke profile.
- Тест обнаруживает изменение host styles после подключения виджета.
- Все существующие Vitest-тесты остаются зелёными.

## Этап 1. Изолировать CSS embed-виджета

### Задачи

1. Перенести общие CSS variables из `:root` в `.offre-widget-host`.
2. Ограничить правила для `button`, `[role="button"]`, `*` и фонового контейнера областью виджета.
3. Настроить Tailwind Preflight так, чтобы он не сбрасывал элементы страницы-хоста.
4. Проверить portals: popup/select/popover должны рендериться внутри widget host и получать theme tokens.
5. Проверить совместную работу Coral и Sunmar на одной странице.
6. Удалить глобальную `.dark` зависимость либо scope-ить её через widget theme container.

### Основные файлы

- `src/styles/style.css`
- `src/brands/coral.css`
- `src/brands/sunmar.css`
- `src/app/create-offre-widget-app.ts`
- `src/app/offre-portal-target.ts`

### Критерии готовности

- Host CSS sentinel проходит до и после mount/unmount.
- Coral и Sunmar не переопределяют tokens друг друга.
- Select/popover сохраняют позиционирование и тему.
- В production CSS нет глобальных widget-owned правил для `body`, `button` и универсального `*`.

## Этап 2. Улучшить время до первой карточки

Этот этап не обещает ускорить сам B2C API. Его задача — раньше запускать необходимую работу, не блокировать готовые данные и сделать ожидание предсказуемым.

### 2.1. Разделить bootstrap и products activation

1. Выделить отдельные сигналы `bootstrapEnabled` и `productsEnabled` вместо одного `hasEnteredViewport`.
2. Запускать дешёвые `ListHotelsInfo` и `ListDepartureLocations` раньше price search.
3. Сравнить две frontend-политики:
   - bootstrap сразу после mount, products при приближении к viewport;
   - bootstrap на увеличенном root margin, например `1000px`, products на текущих `240px`.
4. Выбрать политику по метрикам лишнего трафика и времени `visible -> first-card`.

Критерий: быстрый scroll к виджету не должен начинать весь cold bootstrap только после появления skeleton в viewport.

### 2.2. Настроить retry, timeout и cancellation

1. Убрать общий `retry: 1` как единственную политику для всех endpoint.
2. Задать endpoint-specific retry:
   - не повторять abort и большинство `4xx`;
   - допускать ограниченный retry для сетевой ошибки и выбранных `5xx`;
   - не удваивать многосекундное ожидание без явной причины.
3. Добавить frontend timeout для price search через составной `AbortSignal`.
4. Различать `timeout`, `abort`, transport error и partial result в debug telemetry.
5. Проверить отмену старого запроса при смене города, месяца, гостей и региона.

Критерий: устаревший запрос физически abort-ится и никогда не меняет UI/cache после смены критериев.

### 2.3. Подготовить progressive batch rendering

1. Сохранить текущий один grouped request для одинаковых критериев.
2. Для нескольких descriptors не ждать завершения самого медленного запроса перед публикацией успешных результатов.
3. Ввести batch state с явными полями `pending`, `fulfilled`, `failed` и стабильным merge по hotel id.
4. Сохранять порядок карточек согласно `sortBy` и не допускать скачков уже показанных карточек.
5. Показывать skeleton только для ещё не разрешённых позиций.

Критерий: первый успешный descriptor может показать карточки до завершения остальных, а итоговый state корректно становится `success`, `partial` или `error`.

### 2.4. Оптимизировать изображения карточек

1. Добавить `width`, `height` или `aspect-ratio`, чтобы исключить layout shift.
2. Для первой видимой карточки рассмотреть `fetchpriority="high"`.
3. Для остальных изображений использовать `loading="lazy"` и `decoding="async"`.
4. Добавить placeholder/error fallback без повторной загрузки исходного изображения.
5. Проверить, что CDN URL запрашивает минимально достаточный размер.

Критерии: изображения ниже первого viewport не загружаются eagerly; layout карточки не прыгает при появлении изображения.

## Этап 3. Привести map request lifecycle в безопасное состояние

### Задачи

1. Передать `AbortSignal` в `hotelPriceSearchList` внутри `useOffreMapHotelOffers`.
2. Отменять предыдущую группу при изменении products, search options или map offer mode.
3. Не загружать hotel-only цену сразу для всех точек карты.
4. Сформировать приоритетную очередь:
   - активная точка;
   - видимые элементы sidebar;
   - точки в текущем viewport карты;
   - остальные только по запросу пользователя.
5. Дедуплицировать запросы через TanStack Query и общий query key.
6. Исправить map bootstrap states: отдельно показать ошибки hotels info, departures и products.
7. Сохранить package-price fallback, если hotel-only цена недоступна.

### Основные файлы

- `src/offre/composables/useOffreMapHotelOffers.ts`
- `src/offre/components/results/OffreMapView/OffreMapView.vue`
- `src/offre/composables/useOffreMapViewState.ts`
- `src/offre/components/OffreWidgetRoot/OffreWidgetRoot.vue`

### Критерии готовности

- Смена фильтра прекращает старые network requests.
- Открытие карты не создаёт запрос на каждый отель.
- Активная карточка получает цену раньше фоновых элементов.
- Ошибка bootstrap не выглядит как пустая карта.

## Этап 4. Укрепить frontend API boundary

### Задачи

1. Разделить transport DTO и внутренние domain models.
2. Добавить лёгкие parsers/guards для:
   - `ListHotelsInfo`;
   - `ListDepartureLocations`;
   - package `PriceSearchList`;
   - hotel-only `PriceSearchList`.
3. Нормализовать отсутствующие массивы и optional reference fields в API-слое.
4. Превращать несовместимый ответ в типизированную ошибку API contract, а не в случайный exception UI.
5. Не сохранять невалидные ответы в TanStack Query cache/sessionStorage.

### Основные файлы

- `src/offre/api-client.ts`
- `src/offre/api-types.ts`
- новый `src/offre/api-parsers.ts`
- тесты API boundary

### Критерии готовности

- Повреждённый JSON и структурно неправильный JSON различаются.
- UI получает нормализованные данные либо типизированную ошибку.
- Guards покрыты fixtures для valid, partial и invalid responses.

## Этап 5. Упростить products state и корневую оркестрацию

Этот этап начинается только после этапов 0–4, когда поведение закреплено тестами.

### 5.1. Устранить циклический query/cache bridge

1. Определить единый `OffreProductsRepository` или controller, владеющий query result и accumulated cache.
2. Убрать `shallowRef<ReturnType<typeof useOffreProductsQuery> | null>` как мост к ещё не созданному query state.
3. Сделать входы repository явными: filters, active region, page, view mode и reset signal.
4. Сделать выходы repository явными: list products, map products, request state, pagination coverage и commands.
5. Сохранить TanStack Query как server-state слой, не переносить UI state в query cache.

### 5.2. Выделить widget controller

1. Создать `useOffreWidgetController`, который связывает filters, session, paging, products и layout.
2. Оставить `OffreWidgetRoot.vue` ролью composition/render shell.
3. Ввести явные команды:
   - `selectRegion`;
   - `selectDeparture`;
   - `selectTimeframe`;
   - `applyGuests`;
   - `loadMore`;
   - `setViewMode`;
   - `retry`.
4. Собрать list/map result state в единый discriminated union:

```ts
type OffreResultState =
  | { status: "idle" }
  | { status: "loading"; cachedProducts: B2CProduct[] }
  | { status: "success"; products: B2CProduct[] }
  | { status: "partial"; products: B2CProduct[]; failedQueries: number }
  | { status: "empty" }
  | { status: "error"; kind: "hotels" | "departures" | "products" | "contract" };
```

5. Удалить дублирующиеся list/map error branches из template через общий state presenter там, где тексты и поведение совпадают.

### Критерии готовности

- `OffreWidgetRoot.vue` не владеет деталями query/cache coordination.
- У каждого изменяемого state есть один владелец.
- Переходы фильтр -> reset -> request -> result тестируются как controller scenarios.
- Persistence и cache не очищаются случайно при UI-only изменении.

## Этап 6. Сократить bundle и стоимость инициализации

### Задачи

1. Получить bundle composition report и определить вклад `vue-yandex-maps`, UI primitives и icons.
2. Зафиксировать baseline: JS `446.30 kB`, `123.31 kB gzip`; CSS `88.57 kB`, `14.75 kB gzip`.
3. Проверить три варианта delivery:
   - отдельные `offre-widget.iife.js` и `offre-widget-map.iife.js`;
   - ESM entry с dynamic import карты и IIFE compatibility wrapper;
   - внешний map adapter, подключаемый только при активации карты.
4. Выбрать вариант без нарушения текущего embed-контракта.
5. Удалить неиспользуемые exports/styles после анализа, а не вслепую.
6. Добавить CI budget на raw и gzip размеры.

### Критерии готовности

- List-only сценарий не загружает map implementation до первой активации карты.
- Повторное открытие карты не загружает SDK заново.
- Embed API и глобальный `OffreWidget` остаются обратно совместимыми либо миграция документирована.
- Bundle budget проверяется автоматически.

## Этап 7. Завершить hardening и документацию

### Задачи

1. Добавить browser regression suite в обязательные CI checks.
2. Зафиксировать performance budgets и способ локального измерения с VPN/без VPN.
3. Обновить `PROJECT_GRAPH.md` после появления controller/repository и изменения map delivery.
4. Обновить `PROJECT_ANALYSIS.md` фактическими результатами повторного аудита.
5. Удалить временные compatibility adapters только после одного стабильного release cycle.

### Definition of Done проекта

- `typecheck`, unit/component tests, browser smoke и production build проходят в CI.
- Widget CSS не меняет host page.
- Первая list page выполняет один grouped price request для одинаковых критериев.
- Устаревшие list/map запросы abort-ятся.
- Map не создаёт N запросов сразу при открытии.
- Frontend overhead `products response -> first card` не превышает `100 ms` в reference profile.
- Loading/error/partial/empty состояния одинаково определены для list и map.
- List-only пользователь не оплачивает полную стоимость map implementation.
- Граф проекта и документация соответствуют фактической архитектуре.

## Рекомендуемое разбиение на PR

| PR | Содержание | Риск |
|---|---|---|
| 1 | Browser smoke, CSS sentinel, performance marks | Низкий |
| 2 | CSS isolation и portal regression | Средний |
| 3 | Разделение bootstrap/products activation | Средний |
| 4 | Endpoint-specific retry, timeout и cancellation | Средний |
| 5 | Image loading и visual readiness | Низкий |
| 6 | Map cancellation и bootstrap error states | Средний |
| 7 | Demand-driven hotel prices на карте | Высокий |
| 8 | API parsers и contract errors | Средний |
| 9 | Progressive products batch | Высокий |
| 10 | Products repository без циклического bridge | Высокий |
| 11 | Widget controller и общий result state | Высокий |
| 12 | Map/list delivery split и bundle budget | Высокий |
| 13 | Финальный browser/performance hardening и обновление графа | Низкий |

## Контрольные точки

### После PR 1–2

Embed-граница защищена тестами, CSS не протекает на host page, доступны frontend timings.

### После PR 3–5

Cold-start начинается раньше, retry/timeout предсказуемы, первая карточка и изображения имеют измеримые сроки готовности.

### После PR 6–9

List/map network lifecycle управляем, успешные части batch могут отображаться без ожидания самого медленного запроса.

### После PR 10–12

Архитектура имеет явный controller/repository, root упрощён, list-only загрузка отделена от карты.

### После PR 13

Рефакторинг подтверждён unit, browser и performance checks; граф и аудит обновлены по фактическому состоянию.

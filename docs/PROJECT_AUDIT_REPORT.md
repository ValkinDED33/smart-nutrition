# Полный аудит проекта Smart Nutrition

Дата аудита: 2026-04-03

## 1. Краткий итог

Проект уже не MVP-заготовка. Сейчас это рабочий nutrition tracker с:

- локальным и backend-режимом
- регистрацией и логином
- `access + refresh` API-сессиями
- профилем, калориями, БЖУ и дневником питания
- поиском продуктов, штрих-кодами, рецептами и шаблонами
- аналитикой, историей веса и персонализацией поведения
- photo-draft flow без платных AI/Vision API
- SQLite backend, cloud sync, outbox, SSE, multi-tab sync
- conflict-aware multi-device sync с кешем cloud-состояния

## 2. Готовность по этапам

| Этап | Готовность | Статус |
| --- | --- | --- |
| Этап 1. Основа | 97% | Практически закрыт |
| Этап 2. Умный трекинг | 88% | Сильная реализация |
| Этап 3. AI и автоматизация | 58% | Частично, без настоящего AI |
| Этап 4. Фото и распознавание | 55% | Частично, без computer vision |
| Этап 5. Продвинутый UX | 82% | В основном реализован |
| Этап 6. Интеграции и масштаб | 62% | Сильная база, без внешних интеграций |

Два честных общих вывода:

- Как бесплатный/self-hosted трекер проект готов примерно на `75-80%`.
- Как “уровень топ-приложения с интеграциями и AI” проект готов примерно на `55-60%`.

## 3. Что есть по этапам

### Этап 1. Основа

#### 1. Аутентификация

Статус: `сделано`

Есть:

- регистрация
- логин
- logout
- хранение пользователя
- локальный auth provider
- backend auth provider
- `access + refresh` flow для remote режима
- хеширование паролей
- ограничение неудачных попыток входа
- восстановление сессии

Нет:

- email verification
- password reset
- OAuth
- logout-all sessions
- production-grade secret management policy

#### 2. Профиль пользователя

Статус: `сделано`

Есть:

- рост
- вес
- возраст
- пол
- цель
- активность
- target weight
- diet style
- allergies
- excluded ingredients
- language preference
- avatar
- assistant customization

Нет:

- глубокая медицинская модель профиля
- продвинутая preference engine на уровне behavioral ML

#### 3. Расчёт калорий

Статус: `сделано`

Есть:

- BMR / maintenance calories
- дневная цель калорий
- adaptive calories
- расчёт личных целей по БЖУ
- прогресс по БЖУ на dashboard/profile

Нет:

- полноценный macro-planner с ручной настройкой процентов/ratio

#### 4. Локализация

Статус: `сделано`

Есть:

- выбор языка при первом запуске
- переключатель языка
- хранение language preference

Ограничение:

- языков сейчас только два: `uk` и `pl`

#### 5. База продуктов

Статус: `сделано`

Есть:

- локальный каталог
- ручное добавление продукта
- хранение калорий и нутриентов
- сохранённые и недавние продукты
- personal barcode products

Нет:

- большой каталог уровня MyFitnessPal / Yazio

#### 6. Добавление еды

Статус: `сделано`

Есть:

- добавление продукта
- записи в дневник
- дневной подсчёт калорий
- редактирование записи
- удаление записи
- группировка по приёмам пищи

#### 7. Базовый UI

Статус: `сделано`

Есть:

- landing
- login
- register
- dashboard
- meal builder
- profile
- history views

### Этап 2. Умный трекинг

#### 1. Поиск продуктов

Статус: `сделано`

Есть:

- быстрый поиск
- live search
- autocomplete suggestions
- локальный search cache
- merge локальных данных с Open Food Facts

Нет:

- ресторанный knowledge graph
- глубокие synonyms/ontology

#### 2. Сканер штрих-кодов

Статус: `сделано`

Есть:

- камера
- ручной ввод кода
- Open Food Facts lookup
- fallback на локальные и ручные данные
- barcode cache

Нет:

- advanced confidence scoring источника
- offline confirmed barcode workflow уровня production-app

#### 3. Рецепты

Статус: `сделано`

Есть:

- создание рецепта
- расчёт нутриентов
- сохранение
- шаблоны

Нет:

- import recipe from URL
- goal-based meal planning

#### 4. Быстрые действия

Статус: `сделано`

Есть:

- saved foods
- recent foods
- repeat yesterday
- templates

#### 5. Аналитика

Статус: `сделано / усилено`

Есть:

- daily overview
- weekly insights
- monthly analytics
- история веса
- daily history explorer

Нет:

- более сильные графики и variance analytics уровня top analytics suite

### Этап 3. AI и автоматизация

#### 1. AI анализ питания

Статус: `частично`

Есть:

- локальный nutrition coach
- weekly scoring
- insights
- next actions

Нет:

- настоящий LLM-анализ
- OpenAI integration

#### 2. Генерация советов

Статус: `сделано, но rule-based`

Есть:

- рекомендации по белку
- рекомендации по калориям
- meal-based suggestions
- coach reminders

Нет:

- контекстный conversational AI

#### 3. Адаптация калорий

Статус: `сделано`

Есть:

- адаптация по intake history
- адаптация по weight trend
- automatic/manual adaptive mode

#### 4. Напоминания

Статус: `частично`

Есть:

- browser meal reminders
- calorie alerts
- behavior-based reminder tuning
- вечерние coach nudges

Нет:

- push notifications
- mobile background delivery
- email notifications

### Этап 4. Фото и распознавание

#### 1. Фото еды

Статус: `сделано`

Есть:

- загрузка фото
- photo draft flow
- визуальная привязка фото к черновику

#### 2. Определение блюда

Статус: `частично`

Есть:

- free draft creation
- editable dish name
- editable ingredient list

Нет:

- реальное распознавание блюда по изображению

#### 3. Оценка порции

Статус: `частично`

Есть:

- portion presets `light / regular / large`
- scaling helpers
- суммарный вес и калории draft

Нет:

- реальная фото-оценка веса/порции из vision-модели

#### 4. Редактирование

Статус: `сделано`

Есть:

- изменение блюда
- изменение ингредиентов
- изменение граммовки
- изменение БЖУ / ккал на 100 г
- duplicate item
- remove item
- add missing food

### Этап 5. Продвинутый UX

#### 1. Умные уведомления

Статус: `частично / сильно`

Есть:

- browser reminders
- calorie alerts
- behavior analysis
- smart reminder suggestions
- weakest habit detection

Нет:

- push/email layer

#### 2. История и прогресс

Статус: `сделано`

Есть:

- weight trend
- total delta
- recent delta
- check-ins summary
- daily history
- monthly analytics

#### 3. Персонализация

Статус: `частично / сильно`

Есть:

- assistant customization
- behavior score
- active days
- current streak
- best streak
- strongest/weakest meal habit
- suggested reminder schedule

Нет:

- продвинутая ML-персонализация

### Этап 6. Интеграции и масштаб

#### 1. Интеграции

Статус: `не сделано`

Нет:

- Apple Health
- Google Fit

#### 2. Синхронизация

Статус: `частично / сильно`

Есть:

- backend API
- SQLite storage
- snapshot + normalized state
- SSE pull updates
- sync outbox
- retry sync
- remote state pull
- local multi-tab realtime sync
- cached remote snapshot/meta
- conflict-aware sync by device/version
- manual pull-latest flow on conflict

Нет:

- managed production cloud
- durable jobs/queue layer
- full SaaS infra

#### 3. Производительность

Статус: `частично`

Есть:

- route preloading
- product search cache
- barcode cache
- remote snapshot/meta cache
- rate limiting on server

Нет:

- observability
- queue jobs
- deeper backend cache strategy
- performance budgets and profiling suite

## 4. Что уже реализовано сверх исходного MVP

Дополнительно уже есть:

- account export
- delete account
- assistant customization
- motivation hub
- achievements/tasks
- daily micronutrient support
- adaptive goals
- cloud sync status UI
- backend health/metrics
- SQLite migration from legacy JSON

## 5. Что отсутствует полностью

- Apple Health
- Google Fit
- Firebase push
- SendGrid email delivery
- Edamam
- Nutritionix
- Google Cloud Vision
- реальный OpenAI AI-анализ
- production observability stack
- queues / workers / scheduled jobs

## 6. Внешние API и деньги

Платные API в runtime больше не нужны.

Сейчас реально используется:

- `Open Food Facts` — бесплатный поиск продуктов и штрих-кодов

Удалено или не используется:

- `OpenAI`
- `Edamam`
- `Nutritionix`
- `Firebase`
- `SendGrid`
- `Google Cloud Vision`

## 7. Что исправлено в последнем полном проходе

За этот проход дополнительно исправлено:

- усилен `Этап 6` через conflict-aware sync
- добавлен device-aware cloud meta/cache слой
- добавлен ручной resolve для cloud-конфликтов
- обновлён sync status UI под реальное текущее состояние
- убран mojibake в переключателе языка
- убраны устаревшие тексты вида `cloud sync belongs to the next phase`
- audit-report обновлён под текущую фактическую реализацию

## 8. Что ещё нужно доделать в первую очередь

### Приоритет P1

- довести auth/security до production-уровня
- добавить password reset / email verification при необходимости
- усилить search intelligence и продуктовый каталог
- улучшить charting и долгосрочную аналитику

### Приоритет P2

- решить окончательно стратегию photo-feature:
  либо оставить бесплатный manual-assist навсегда,
  либо позже вынести AI recognition в отдельный optional provider
- улучшить UX локализации и вычистить оставшийся технический англоязычный copy

### Приоритет P3

- интеграции Apple Health / Google Fit
- push/email notifications
- production infra: queues, monitoring, deployment hardening

## 9. Финальный честный вывод

Если цель проекта:

- `бесплатный, умный, self-hosted nutrition tracker` — проект уже сильный и реально рабочий
- `топовый consumer app с AI и интеграциями` — база очень хорошая, но ещё не закрыты внешние сервисы, интеграции и production infrastructure

Самое важное состояние на сегодня:

- `Этап 1` — практически закрыт
- `Этап 2` — сильный и удобный
- `Этап 3` — умный, но без настоящего AI
- `Этап 4` — полезный manual photo flow, но без real vision
- `Этап 5` — уже заметно сильнее среднего MVP
- `Этап 6` — хорошая sync/performance база без внешних интеграций

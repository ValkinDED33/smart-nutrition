# Smart Nutrition — актуальный план реализации

Обновлено: 2026-04-12

## Что уже закрыто

- [x] Язык вынесен в профиль и есть first-run language setup
- [x] Профиль хранит goal, diet style, allergies, exclusions и adaptive mode
- [x] Мотивационный слой собран: tasks, points, achievements, history, weekly и paid day off
- [x] Assistant customization собран: имя, роль, тон и humor toggle
- [x] Fuzzy search работает и покрыт тестами
- [x] Inline editing записей в дневнике работает
- [x] Monthly analytics, weekly insights, smart recommendations и nutrition coach уже в UI
- [x] Cloud sync, cross-tab sync, export, backups, logout everywhere и account deletion уже есть
- [x] Photo meal draft уже есть как безопасный review-first поток
- [x] На dashboard есть assistant runtime block с быстрыми вопросами и свободным вводом
- [x] Ответы runtime используют calories, protein, coach context и motivation context
- [x] Новые assistant, motivation, photo и habit surface прошли i18n-pass
- [x] Lint, tests и build остаются зелёными после добавления runtime-слоя

## Что ещё критично

- [ ] Подключить реальный AI runtime вместо только local contextual logic
- [ ] Добавить историю диалога и безопасную деградацию при недоступном backend
- [ ] Довести photo flow до production-grade recognition с прозрачной confidence-моделью
- [ ] Усилить observability и production hardening для cloud режима
- [ ] Добавить внешние интеграции: Google Fit / Apple Health

## Статус по этапам

### Этап A. Shared Foundation

- [x] Завершён

### Этап B. Motivation MVP

- [x] Завершён

### Этап C. Assistant MVP

- [x] Завершён

### Этап D. Assistant Runtime

- [x] D1 Assistant Runtime MVP завершён
- [ ] D2 Runtime Upgrade в процессе

## Что входит в закрытый D1

- [x] Диалоговый assistant card на dashboard
- [x] Быстрые вопросы и follow-up chips
- [x] Local intent detection для свободного вопроса
- [x] Честный local-preview/runtime badge
- [x] Provider-слой `local -> remote`, чтобы UI не переписывать при подключении backend AI
- [x] Полный i18n-pass по assistant, motivation, photo и reminder-поверхностям

## Следующий рабочий срез

### D2. Runtime Upgrade

- [ ] Подключение remote AI endpoint к существующему provider-слою
- [ ] Короткая история диалога и безопасный fallback на local runtime
- [ ] Более богатые proactive prompts и облачные assistant-ответы

### D3. Production Intelligence

- [ ] AI photo analysis
- [ ] Более сильная персонализация на основе истории и поведения
- [ ] Наблюдаемость, hardening и release-подготовка cloud режима

## Definition of Done для текущего этапа

- [x] На dashboard есть рабочий assistant runtime block
- [x] Пользователь может задать быстрый вопрос и получить ответ из текущих данных
- [x] Ответ учитывает calorie, protein, weekly coach status и motivation context
- [x] Интерфейс честно сообщает, что это local runtime preview, если remote AI ещё не подключён
- [x] Lint, tests и build зелёные

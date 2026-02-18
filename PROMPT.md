# Ad Testing SaaS — Ralph Loop Prompt

Ты строишь MVP SaaS-платформы для тестирования рекламных офферов через AI-персоны.

## Контекст

Все файлы находятся в **`experiments/ad-testing-agents/`**.

- **Дизайн:** `2026-02-04-ad-testing-saas-design.md`
- **План:** `2026-02-04-implementation-plan.md`
- **Прогресс:** `PROGRESS.md`
- **Python-прототип:** `src/ad_testing_agents/` (портировать промпты и логику в TypeScript)
- **Next.js приложение:** `saas/` (подпапка, создаётся в Phase 0)

**ВАЖНО:** Next.js проект живёт в подпапке `saas/`. Все пути из плана (`lib/`, `app/`, `components/`, `prisma/`, `workers/`) — относительно `saas/`. Python-код остаётся в `src/`.

**Прочитай дизайн и план перед началом работы. Они содержат полную Prisma-схему, сигнатуры функций, промпты, Zod-схемы, docker-compose и порядок создания файлов.**

---

## Правила работы

1. **Читай план** — `2026-02-04-implementation-plan.md` содержит точные имена файлов, код и зависимости. Следуй ему.
2. **Одна фаза за итерацию** — определи текущую фазу по `PROGRESS.md`, выполни следующую, обнови прогресс.
3. **Коммить после каждой фазы** — `git add` конкретные файлы + `git commit` с сообщением `Phase N: краткое описание`.
4. **Тесты сразу** — каждая фаза имеет секцию «Тесты фазы N». Пиши тесты в той же итерации, запусти `cd saas && npx vitest run` для проверки.
5. **Не делай лишнего** — только то, что описано в плане для текущей фазы. Никаких улучшений, рефакторинга, доп. фич.
6. **Портируй из Python** — таблица «Переиспользование из эксперимента» в плане показывает что откуда брать. Python-код в `src/ad_testing_agents/`.
7. **Русский язык** — промпты для AI, комментарии в коде, seed data — на русском.
8. **Рабочая директория** — для npm/vitest/prisma команд всегда `cd saas` сначала.
9. **Unit-тесты мокают БД** — используй vi.mock для Prisma client. Integration-тесты (api/*.test.ts) используют тестовую БД `adtesting_test`.

---

## Алгоритм каждой итерации

```
1. Прочитать PROGRESS.md → определить текущую незавершённую фазу
2. Прочитать план → найти секцию этой фазы
3. cd saas (если Phase 0 завершена)
4. Создать/изменить файлы по плану
5. Написать тесты для фазы
6. Запустить тесты (npx vitest run)
7. Если тесты падают → исправить → повторить запуск
8. git add <конкретные файлы> && git commit -m "Phase N: описание"
9. Обновить PROGRESS.md (заменить [ ] на [x] для завершённой фазы)
10. Если все фазы [x] → вывести promise
```

---

## Трекер прогресса

Файл `PROGRESS.md` уже создан. Прочитай его в начале каждой итерации.

Когда фаза завершена (код написан, тесты проходят, коммит сделан), замени `[ ]` на `[x]`.

---

## Детали по фазам

### Phase 0: Scaffold
- `npx create-next-app@latest saas --app --typescript --tailwind --eslint --src-dir=false --import-alias="@/*" --use-npm`
- `cd saas`
- `npm install @prisma/client bullmq ioredis openai rate-limiter-flexible pino @sentry/nextjs zod next-auth @auth/prisma-adapter bcryptjs`
- `npm install -D prisma vitest @testing-library/react @vitejs/plugin-react jsdom @types/bcryptjs`
- `npx shadcn@latest init --defaults`
- Создать `docker-compose.yml` — полная версия из плана §0.3 (postgres с env vars и ports, redis с AOF, volumes declaration)
- Создать `.env.local` — конкретные значения из плана §0.2
- Создать `vitest.config.ts` — из плана §0.2 (path aliases, setup file)
- Создать `vitest.setup.ts` — базовый setup
- `docker compose up -d`
- **Проверка:** `docker compose ps` — healthy, `npm run dev` — стартует, `npx vitest run` — 0 tests found (OK)

### Phase 1: DB + Auth + Security
- `npx prisma init` (создаёт prisma/ директорию)
- `prisma/schema.prisma` — полная схема из плана §1.1 (включая generator + datasource блоки, поле password в User)
- `npx prisma migrate dev --name init`
- `lib/db.ts` — Prisma client singleton
- `lib/auth.ts` — NextAuth с PrismaAdapter + CredentialsProvider (email + password через bcrypt)
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/auth/register/route.ts` — POST: регистрация (email, password, name)
- `app/(auth)/login/page.tsx` — логин (email + password)
- `app/(auth)/register/page.tsx` — регистрация
- `middleware.ts` — защита /dashboard/*
- `lib/auth-guard.ts` — requireProjectAccess
- `lib/rate-limit.ts` — rate-limiter-flexible на Redis
- Тесты: `__tests__/lib/auth-guard.test.ts`, `__tests__/lib/rate-limit.test.ts` (мокать Prisma и Redis)
- **Проверка:** `npx vitest run` — тесты проходят

### Phase 2: CRUD
- Layout: `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`
- Проекты: API routes + страницы (new, [id])
- Персоны: API routes + компоненты (persona-card, persona-editor). `personas/generate/route.ts` — заглушка 501
- Офферы: API routes + компоненты (offer-card, offer-editor)
- `lib/limits.ts` — все check-функции из плана §2.5
- `lib/validation.ts` — Zod-схемы из плана §2.6
- Пустые состояния на всех страницах
- Тесты: `__tests__/lib/limits.test.ts`, `__tests__/lib/validation.test.ts`, `__tests__/api/projects.test.ts`
- **Проверка:** `npx vitest run` — тесты проходят

### Phase 3: AI Engine
- `lib/openrouter.ts` — обёртка с retry, logging, Sentry breadcrumbs
- `lib/prompts/system-prompt.ts` — портировать из `../src/ad_testing_agents/prompts/system_prompts.py`, добавить `<user_input>` маркеры
- `lib/prompts/evaluation-prompt.ts` — портировать из `../src/ad_testing_agents/prompts/evaluation_prompts.py`, добавить `<user_input>` маркеры
- `lib/ai/generate-personas.ts` — детальный промпт из плана §3.3
- `lib/ai/parse-response.ts` — парсинг JSON, валидация полей
- Заменить заглушку `personas/generate/route.ts` на реальную реализацию с AI
- Тесты: `__tests__/lib/parse-response.test.ts`, `__tests__/lib/prompts/system-prompt.test.ts`, `__tests__/lib/prompts/evaluation-prompt.test.ts`
- **Проверка:** `npx vitest run` — тесты проходят

### Phase 4: Test Runner
- `lib/queue/connection.ts` — Redis connection
- `lib/queue/test-queue.ts` — BullMQ queue definition
- `workers/evaluation-worker.ts` — worker с retry, logging, status updates
- `app/api/projects/[id]/test-runs/route.ts` — POST
- `app/api/projects/[id]/test-runs/[runId]/status/route.ts` — GET
- `app/api/projects/[id]/test-runs/[runId]/retry/route.ts` — POST
- `Dockerfile.worker`
- Тесты: `__tests__/workers/evaluation-worker.test.ts` (mock OpenRouter), `__tests__/api/test-runs.test.ts`
- **Проверка:** `npx vitest run` — тесты проходят

### Phase 5: Report
- `app/(dashboard)/projects/[id]/test-runs/[runId]/page.tsx` — страница отчёта с polling
- Компоненты: `components/report/heatmap.tsx`, `winners-table.tsx`, `insights.tsx`, `strategy.tsx`, `persona-detail.tsx`, `progress-bar.tsx`, `failed-card.tsx`
- `lib/analytics/insights.ts` — rule-based инсайты (7 правил из плана §5.3)
- Мобильная адаптация: горизонтальный скролл heatmap, sticky колонка
- Тесты: `__tests__/lib/insights.test.ts`
- **Проверка:** `npx vitest run` — тесты проходят

### Phase 6: Onboarding + Deploy
- `lib/onboarding.ts` — createDemoProject с pre-recorded результатами из `prisma/demo-results.json`
- `prisma/demo-results.json` — 12 записей (4 персоны × 3 оффера)
- `prisma/seed.ts` — seed для dev
- Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `app/api/health/route.ts`
- `app/page.tsx` — лендинг
- `Dockerfile` (multi-stage), `docker-compose.prod.yml`, `nginx/default.conf`
- `.github/workflows/deploy.yml`
- `scripts/backup.sh`
- Тесты: `__tests__/lib/onboarding.test.ts` (mock Prisma)
- **Проверка:** `npx vitest run` — тесты проходят, `docker build .` успешен

### Phase 7: CI/CD + Final
- `.github/workflows/ci.yml` (lint → typecheck → test → build)
- `npx vitest run` — все тесты проходят
- `npx tsc --noEmit` — без ошибок типов
- Pre-deploy checklist из плана §7.4
- **Проверка:** все чекпоинты выполнены

---

## Completion Promise

Когда **все 8 фаз** отмечены как `[x]` в PROGRESS.md, все тесты проходят, и последний коммит сделан:

<promise>MVP COMPLETE</promise>

**Не выводи promise пока хоть одна фаза не завершена.**

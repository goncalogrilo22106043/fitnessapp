# ROTINA

Rotina is an adaptive nutrition app built around long-term adherence, meal tolerance and guilt-free planning.

The product is not a calorie counter. Its core loop is:

1. Generate a weekly plan.
2. Collect simple meal feedback.
3. Learn tolerance, repetition, texture, volume, timing and context.
4. Adapt the next meals without negative language.

## Architecture

- `packages/domain`: isolated Adaptive Nutrition Engine and shared product types.
- `apps/api`: Node.js, Express, Prisma, PostgreSQL and JWT.
- `apps/mobile`: Expo, React Native, TypeScript and TanStack Query.

The engine has no dependency on Express, Prisma, React Native or storage. That keeps nutrition decisions testable and portable.

## Local Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL with Docker:

```bash
docker --version
docker compose up -d
```

Create the API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

The development database URL is:

```bash
DATABASE_URL="postgresql://rotina:rotina_dev_password@localhost:5432/rotina?schema=public"
```

For Supabase, use `apps/api/.env` and paste the URLs from the Supabase dashboard:

```bash
DATABASE_URL=""
DIRECT_URL=""
JWT_SECRET=""
PORT=4000
NODE_ENV=development
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
```

- `DATABASE_URL`: paste the Supabase Pooler connection string. This is the URL the app should use at runtime.
- `DIRECT_URL`: paste the Supabase Direct connection string. Prisma uses this for migrations.
- `JWT_SECRET`: set a long random local secret. Do not commit this file.
- `OPENAI_API_KEY`: optional locally, required for real AI meal generation. Without it, the API returns deterministic fallback suggestions.
- `OPENAI_MODEL`: model used by the AI meal generator.
- `OPENAI_TIMEOUT_MS`: timeout for server-side OpenAI calls.
- `OPENAI_MAX_RETRIES`: retry count for server-side OpenAI calls.

Do not put Supabase credentials in `schema.prisma`, source code, README examples or committed files.

Run migrations and seed starter meals:

```bash
npm run db:migrate
npm run db:seed
```

Start API and mobile app:

```bash
npm run dev
```

Start only the API:

```bash
npm run dev:api
```

Start only the mobile app:

```bash
npm run dev:mobile
```

For the mobile app, create `apps/mobile/.env` with the API base URL:

```bash
EXPO_PUBLIC_API_BASE_URL="http://localhost:4000"
```

When using the Railway API from Expo Go:

```bash
EXPO_PUBLIC_API_BASE_URL="https://rotina.up.railway.app"
```

Demo user:

- Email: `demo@rotina.local`
- Password: `rotina-demo-2026`
- Scenario: 21-year-old hardgainer, 64kg, 171cm, training 6x/week, low volume tolerance, prefers sweet breakfast, avoids dry food, Easy Bulking mode.

## Useful Commands

Validate TypeScript:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Generate Prisma Client manually:

```bash
npm run prisma:generate
```

Build Expo web if needed later:

```bash
npm run build:web -w @rotina/mobile
```

Deploy existing migrations, useful for shared/staging/prod databases:

```bash
npm run db:deploy
```

## Current Product Surface

- Onboarding is a 10-step guided flow that saves body data, target weight, desired pace, daily routine, training days/time, appetite windows, texture tolerance, safe foods, disliked foods, budget, plan mode and meal slots.
- The API calculates BMR, TDEE and macros through the domain package.
- The daily dashboard shows calories, protein, hydration, Appetite Score, Food Variety Index, Consistency Score, today's meals and a personalized reason for the plan.
- The "Hoje nao consigo" mode adapts remaining meals toward lower volume and Safe Meals, persists a daily adjustment and avoids duplicate activation in the same day.
- Meal substitutions explain why each alternative was suggested.
- Daily plans are versioned. Swaps, rollbacks and hard-day mode create adjustment logs without losing the original plan.
- Hydration logs support water timeline and daily progress.
- Weight logs support a simple trend view.
- Meal history and weekly insights expose tolerance, variety, consistency, hydration and weight context.
- Favorite meals and Safe Meals are persisted per user profile and reflected in the daily dashboard.
- Meal detail exposes ingredients, recipe steps, Meal DNA, score and recent feedback.
- Mobile starts with real login/register before onboarding, so profile, targets, meals, feedback, water, weight and preferences are scoped to the logged-in account.
- Meal feedback captures mood, percentage eaten, issue tags, ingredient notes and free notes; the API stores these signals and updates future avoidance/preference context.
- The "Comer" tab lists real MealOptions, filters by slot/texture/volume/favorite/safe/paused and persists favorite/Safe Meal changes.
- The "Comer" tab now also stores what the user has at home and can ask AI for meal ideas based on pantry, profile, targets and notes.
- The "Progresso" tab combines weekly insights, hydration, weight trend and meal feedback signals.
- The mobile UI uses a premium card-based design system with badges, progress bars, skeletons, toasts and clear empty states.
- Profile screen shows targets, water goal, eating mode, volume/texture preferences, budget, recalculation actions and a visual "Meal Genome" pattern.
- Charts use `react-native-chart-kit@6.12.0` with `react-native-svg` for Expo SDK 54 / React 19 compatibility.

## GitHub and Vercel

Recommended API deployment:

1. Push this repository to GitHub.
2. Deploy the API on Vercel from the repository root.
3. Use Expo Go locally for mobile testing.

Vercel setup:

1. Create or import a Vercel project from the GitHub repository.
2. Set Root Directory to the repository root. Do not set it to `apps/api`.
3. Keep Framework Preset as Other.
4. Vercel uses `server.mts` at the repository root as the Node/Express entrypoint.
5. Build Command:

```bash
npm run vercel:build
```

6. Install Command:

```bash
npm install
```

7. Output Directory: leave empty.
8. Add these environment variables in Vercel, never in Git:

```bash
DATABASE_URL="Supabase Pooler URL"
DIRECT_URL="Supabase Direct connection URL or Session Pooler URL"
JWT_SECRET="long random secret"
NODE_ENV=production
OPENAI_API_KEY="OpenAI API key"
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_TIMEOUT_MS=20000
OPENAI_MAX_RETRIES=1
```

Vercel health check URL:

```bash
https://your-vercel-domain.vercel.app/health
```

Expected health response:

```json
{ "status": "ok", "product": "rotina" }
```

Run migrations manually before or after deployment when schema changes:

```bash
npm run db:deploy
```

Run seed manually only when needed:

```bash
npm run db:seed
```

The API is deployed as a Vercel Node.js server entrypoint. Vercel uses the root `server.mts`, captures `app.listen()`, and routes requests to the Express app. The API imports the domain package through real monorepo source paths for the Vercel runtime, so the serverless function does not need to resolve `@rotina/domain` as a workspace package after deployment. Keep the Vercel Root Directory at the repository root, not `apps/api`.

## Railway Legacy

Railway is no longer the recommended deployment target for this project, but the old config remains as a fallback.

Railway setup:

1. Create a Railway project.
2. Connect the GitHub repository.
3. Use the repository root as the service root. Do not set the root directory to `apps/api`.
4. Railway reads `nixpacks.toml` and `railway.json` from the repository root. The install command is pinned to:

```bash
npm install
```

5. If you configure commands manually, use this build command:

```bash
npm run railway:build
```

6. If you configure commands manually, use this start command:

```bash
npm run railway:start
```

7. Add these environment variables in Railway, never in Git:

```bash
DATABASE_URL="Supabase Pooler URL"
DIRECT_URL="Supabase Direct connection URL"
JWT_SECRET="long random secret"
NODE_ENV=production
OPENAI_API_KEY="OpenAI API key"
OPENAI_MODEL="gpt-4.1-mini"
```

For Supabase, do not use the same direct `db.<project>.supabase.co:5432` URL for both variables in Railway. Use the Supabase pooler connection string for `DATABASE_URL`. Use the direct connection string for `DIRECT_URL` only if the Railway service can reach it; otherwise use the Supabase session pooler for migrations.

Railway health check path:

```bash
/health
```

Expected health response:

```json
{ "status": "ok", "product": "rotina" }
```

Run seed manually only when needed:

```bash
npm run db:seed
```

Run production migrations as a Railway one-off command after the database URL is correct:

```bash
npm run railway:migrate
```

The Railway API starts the compiled server at `apps/api/dist/apps/api/src/server.js`.

## Supabase

In Supabase, copy the Shared Pooler URI for `DATABASE_URL`. Use a reachable Direct connection or Session Pooler URI for `DIRECT_URL`.

If your database password has special characters, percent-encode them before pasting the URL into Vercel, Railway or `apps/api/.env`.

Required API variables:

```bash
DATABASE_URL=""
DIRECT_URL=""
JWT_SECRET=""
PORT=4000
NODE_ENV=development
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
```

## Technical Decisions

- The Adaptive Nutrition Engine lives in `packages/domain` and has no dependency on React Native, Express, Prisma or storage.
- The API persists and validates data, but delegates scoring, nutrition calculations and adaptation decisions to the domain.
- The mobile app keeps UI state only; meal selection, hard-day adaptation and substitution explanations come from the API/domain.
- AI meal ideas, feedback learning and routine analysis are generated server-side in the API, never directly from the mobile app. The API sends minimized routine/profile context only after consent and stores validated outputs/signals.
- PostgreSQL is provided by `docker-compose.yml` for local development.
- Railway runs the API as a traditional Node process with `app.listen()` and `process.env.PORT`.
- Tests use Node's built-in test runner with `tsx` loading TypeScript.
- Plans store `engineVersion` and `scoringWeightsVersion` so future scoring changes do not invalidate historical plans.
- Daily versioning uses immutable `DailyPlanVersion` rows plus `DailyPlanAdjustment` audit logs.
- Profile water target starts from `35ml * body weight` and can be adjusted later.
- Deep personalization fields live on `UserProfile` and `TrainingRoutine`; the mobile app collects them, the API validates them with Zod, and the domain engine uses them for scoring/adaptation.

## Current Limitations

- Authentication is still a simple JWT email/password flow. The mobile app does not yet persist the token securely after a full app restart.
- Supabase Storage is scaffolded but not wired to real credentials yet.
- Profile editing is still mostly read-only apart from water target and recalculation; the deep onboarding fields should become editable before beta.
- The "Adicionar refeicao" API exists, but the mobile form is intentionally deferred to avoid creating incomplete meal data.
- Weekly plan generation is still primarily the deterministic domain engine; AI currently powers "what can I eat now?" pantry-based ideas and is ready to expand into full weekly AI planning.
- Feedback learning updates avoided ingredients and issue tags, but the next full step is AI-assisted weekly plan generation using the complete feedback history.
- Charts are simple first-pass visualizations, not a full analytics experience yet.
- Weekly insights are first-pass aggregate rules; they are not yet personalized by training phase.
- The algorithm is versioned, but there is not yet an experiment assignment system for A/B tests.
- In this Codex environment, Prisma engine downloads can fail if DNS to `binaries.prisma.sh` is unavailable. Railway should run `prisma generate` normally during build.

## API Areas

- `PUT /onboarding`: save profile, training, tolerance, budget, eating mode and meal slots.
- `POST /plans/weekly`: generate a weekly plan with algorithm versions.
- `GET /plans/daily`: fetch the latest daily version.
- `POST /plans/daily/hard-day`: persist a hard-day adjustment.
- `GET /plans/daily/adjustments`: list adjustment history.
- `POST /plans/daily/rollback`: create a new version from a previous version.
- `GET /plans/substitutions`: list explained alternatives.
- `POST /plans/swap`: persist a meal swap as a new daily version.
- `GET /meals/:mealId`: fetch meal detail, ingredients, recipe, DNA and recent feedback.
- `PATCH /meals/:mealId/favorite`: mark or unmark a meal as favorite.
- `PATCH /meals/:mealId/safe`: mark or unmark a meal as Safe Meal.
- `GET /pantry` and `PUT /pantry`: read and update foods the user has at home.
- `POST /ai/meal-ideas`: generate AI meal ideas from pantry, profile, targets and user notes.
- `POST /ai/routine-analysis`: generate or reuse a structured routine analysis with consent, cache and deterministic fallback.
- `POST /feedback`: save meal feedback, analyze notes/ingredients and update profile learning signals.
- `POST /progress/water` and `GET /progress/water`: water logs and daily hydration summary.
- `POST /progress/weight` and `GET /progress/weight`: weight logs and trend.
- `GET /progress/meal-history`: meal feedback history with filters.
- `GET /progress/weekly-insights`: weekly report.
- `GET /profile`: user profile, targets and preferences.
- `PATCH /profile/water-target`: update daily water goal.
- `POST /profile/recalculate-targets`: recalculate targets.

## Troubleshooting

Docker command not found:

```bash
docker --version
```

If this fails, install or open Docker Desktop and restart the terminal before running `docker compose up -d`.

PostgreSQL port already in use:

```bash
lsof -i :5432
```

Stop the conflicting service or change the host port in `docker-compose.yml`.

Prisma cannot connect:

```bash
cp apps/api/.env.example apps/api/.env
npm run prisma:generate
npm run db:migrate
```

For Supabase, confirm both URLs are filled:

```bash
DATABASE_URL="Supabase Pooler URL"
DIRECT_URL="Supabase Direct connection URL"
```

On Railway, if Prisma shows `P1001` against `db.<project>.supabase.co:5432`, the service cannot reach that direct host. Keep `DATABASE_URL` as the Supabase pooler URL and run `npm run railway:migrate` only after `DIRECT_URL` points to a reachable Supabase direct or session-pooler connection.

Expo cannot reach the API from a physical device:

Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` to your computer LAN address, for example:

```bash
EXPO_PUBLIC_API_BASE_URL="http://192.168.1.20:4000"
```

Chart dependency conflict:

The project uses Expo SDK 54 with React 19. If Expo reports SDK 51 packages, remove old installs and reinstall:

```bash
rm -rf node_modules package-lock.json apps/mobile/node_modules
npm install
```

Prisma cache permission issue on macOS:

```bash
sudo chown -R $(id -u):$(id -g) ~/.cache/prisma ~/.npm
npm run prisma:generate
```

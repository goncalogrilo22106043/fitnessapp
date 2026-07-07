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
```

- `DATABASE_URL`: paste the Supabase Pooler connection string. This is the URL the app should use at runtime.
- `DIRECT_URL`: paste the Supabase Direct connection string. Prisma uses this for migrations.
- `JWT_SECRET`: set a long random local secret. Do not commit this file.

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

Build Expo web for Vercel:

```bash
npm run build:web -w @rotina/mobile
```

Deploy existing migrations, useful for shared/staging/prod databases:

```bash
npm run db:deploy
```

## Current Product Surface

- Onboarding saves basic data, body goal, training routine, texture/volume tolerance, food preferences, budget, eating mode and meal slots.
- The API calculates BMR, TDEE and macros through the domain package.
- The daily dashboard shows calories, protein, hydration, Appetite Score, Food Variety Index, Consistency Score and today's meals.
- The "Hoje nao consigo" mode adapts remaining meals toward lower volume and Safe Meals, persists a daily adjustment and avoids duplicate activation in the same day.
- Meal substitutions explain why each alternative was suggested.
- Daily plans are versioned. Swaps, rollbacks and hard-day mode create adjustment logs without losing the original plan.
- Hydration logs support water timeline and daily progress.
- Weight logs support a simple trend view.
- Meal history and weekly insights expose tolerance, variety, consistency, hydration and weight context.
- The mobile UI uses reusable cards, buttons, feedback buttons, progress bars and chart cards.
- Profile screen shows targets, water goal, eating mode, volume/texture preferences, budget and recalculation actions.
- Charts use `react-native-chart-kit@6.12.0` with `react-native-svg` for Expo/React 18 compatibility.

## GitHub and Vercel

Recommended first deployment:

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. For the mobile web app, set the Vercel root directory to `apps/mobile`.
4. Use build command `npm run build:web`.
5. Use output directory `dist`.

API deployment can be configured as a separate Vercel project with root directory `apps/api`. Add these environment variables in Vercel, never in Git:

```bash
DATABASE_URL="Supabase Pooler URL"
DIRECT_URL="Supabase Direct connection URL"
JWT_SECRET="long random secret"
NODE_ENV=production
```

The API includes a serverless entrypoint at `apps/api/api/index.ts`, while local development still uses the Express server in `apps/api/src/server.ts`.

## Technical Decisions

- The Adaptive Nutrition Engine lives in `packages/domain` and has no dependency on React Native, Express, Prisma or storage.
- The API persists and validates data, but delegates scoring, nutrition calculations and adaptation decisions to the domain.
- The mobile app keeps UI state only; meal selection, hard-day adaptation and substitution explanations come from the API/domain.
- PostgreSQL is provided by `docker-compose.yml` for local development.
- Tests use Node's built-in test runner with `tsx` loading TypeScript.
- Plans store `engineVersion` and `scoringWeightsVersion` so future scoring changes do not invalidate historical plans.
- Daily versioning uses immutable `DailyPlanVersion` rows plus `DailyPlanAdjustment` audit logs.
- Profile water target starts from `35ml * body weight` and can be adjusted later.

## Current Limitations

- Authentication is still a simple JWT email/password flow with a demo session in the mobile app.
- Supabase Storage is scaffolded but not wired to real credentials yet.
- Profile editing is intentionally minimal; it should become a richer form before beta.
- Charts are simple first-pass visualizations, not a full analytics experience yet.
- Weekly insights are first-pass aggregate rules; they are not yet personalized by training phase.
- The algorithm is versioned, but there is not yet an experiment assignment system for A/B tests.
- I could not run Docker/PostgreSQL inside this Codex environment because the `docker` command is unavailable here; schema, migrations, typecheck and tests were validated.

## API Areas

- `PUT /onboarding`: save profile, training, tolerance, budget, eating mode and meal slots.
- `POST /plans/weekly`: generate a weekly plan with algorithm versions.
- `GET /plans/daily`: fetch the latest daily version.
- `POST /plans/daily/hard-day`: persist a hard-day adjustment.
- `GET /plans/daily/adjustments`: list adjustment history.
- `POST /plans/daily/rollback`: create a new version from a previous version.
- `GET /plans/substitutions`: list explained alternatives.
- `POST /plans/swap`: persist a meal swap as a new daily version.
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

If migrations fail through the pooler, check that `DIRECT_URL` is the direct connection string and not the pooler string.

Expo cannot reach the API from a physical device:

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your computer LAN address, for example:

```bash
EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"
```

Chart dependency conflict:

The project pins `react-native-chart-kit@6.12.0` because newer releases require React 19. Keep this version while the app uses Expo SDK 51 / React 18.

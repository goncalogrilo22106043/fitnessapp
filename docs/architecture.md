# Rotina Architecture

## Product Rule

Rotina optimizes meal adherence and tolerance. It must never use punitive copy such as "falhaste" or "nao cumpriste".

## Domain Boundary

`packages/domain` owns the Adaptive Nutrition Engine:

- weekly plan generation
- meal scoring
- meal substitution ranking
- safe meal preference
- learning from feedback

It does not know about HTTP, Prisma, Expo, Supabase or notifications.

## Current Score Weights

- Meal Tolerance Score: 35%
- Variety Score: 20%
- Volume Compatibility: 15%
- Texture Compatibility: 10%
- Recent Feedback: 10%
- Budget Compatibility: 5%
- Cooking Time: 5%

## Next Product Improvements

1. Add a proper onboarding flow for disliked textures, safe meals, budget and cooking time.
2. Add a plan review screen that explains substitutions without guilt.
3. Replace the first weighted algorithm with an experiment-friendly strategy interface and versioned scoring.
4. Add scheduled meal reminders after the user picks preferred meal times.
5. Add Supabase signed upload URLs for meal photos and optional progress context.

## Review Notes

- Monorepo structure is appropriate for the stack: apps own delivery concerns, `packages/domain` owns product decisions.
- `packages/domain` remains isolated from Prisma, Express, Expo, Supabase and React Native.
- Business rules added in this stage live in the domain: onboarding nutrition calculations, hard-day adaptation, pause rules, nausea risk, substitutions and dashboard scoring.
- API routes validate input with Zod and map persistence models to domain types.
- Mobile screens request decisions from API endpoints instead of recomputing meal ranking locally.
- Daily plan changes are append-only: original plan remains in the weekly plan, and day-specific edits are stored as `DailyPlanVersion` and `DailyPlanAdjustment`.
- Hydration and weight calculations use small domain utilities so API/mobile do not drift in interpretation.

## Corrected Risks

- Root scripts now support the requested local flow: `npm install`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`.
- PostgreSQL development setup is explicit in `docker-compose.yml`.
- Prisma schema now models nutrition targets, training routine, budget profile and meal slots.
- Adaptive Nutrition Engine has unit tests for the critical rules requested.
- Plans now store `engineVersion` and `scoringWeightsVersion`.
- Hard-day activation is persisted and duplicate activation for the same date is prevented.
- Rollback is possible because the original daily version is stored before the first adjustment.

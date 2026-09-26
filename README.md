# FSU Recruiting HQ — Football MVP

A Next.js recruiting intelligence dashboard for Florida State Football.
Currently running on **mock data** (`data/recruiting_data.json`) so you can
click through the real UI before wiring up live sources.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's here

```
app/
  page.tsx                Command Center (stats, needs, risers, unoffered fits, re-evaluate)
  players/page.tsx        Full searchable/filterable player database
  players/[id]/page.tsx   Player detail — fit breakdown, rating & rank history charts, offer history
  offers/page.tsx         Active FSU offers
  risers/page.tsx         Positive-momentum board
  fallers/page.tsx        Negative-momentum / re-evaluate board
  position-needs/page.tsx Full position-need meters

components/               PlayerCard, TrendChart, RankingChart, PositionBoard, RecruitingTable
lib/
  types.ts                Shared TypeScript types (mirrors database/schema.sql)
  data.ts                 Single point of data access — swap this for a Supabase query later
  scoring.ts              FSU Fit Score + momentum logic (TS port of database/scoring_engine.py)

data/recruiting_data.json Mock dataset shaped like the real schema
database/schema.sql       Full Postgres schema (players, offers, event log, roster, evaluations)
database/scoring_engine.py Python scoring engine — same math as lib/scoring.ts, for backend jobs
```

## Wiring up real data (next milestone)

Everything reads through `lib/data.ts:getRecruitingData()`. To go live:

1. Stand up Postgres on Supabase and run `database/schema.sql`.
2. Replace `getRecruitingData()` with a Supabase query (or a Next.js API route
   that runs `database/scoring_engine.py`-equivalent logic server-side).
3. Add a scheduled job (Supabase Edge Function on a cron trigger, or a small
   worker) that scrapes/ingests sources hourly, writes to `player_events`,
   and recomputes `fsu_evaluation` rows.
4. Everything else — every page and component — stays the same, since they
   only ever touch `getRecruitingData()`.

## Not yet built

- Basketball / Baseball tabs (nav links are there as placeholders)
- Auth (currently public — add Supabase Auth before deploying for real)
- The actual ingestion pipeline (scrapers, source-tier tracking, cron jobs)

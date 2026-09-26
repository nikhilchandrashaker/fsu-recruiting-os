-- FSU Recruiting Intelligence System — Core Schema (Phase 1: Football)
-- Postgres / Supabase. Designed so basketball and baseball can reuse
-- players/offers/events/evaluations and add sport-specific detail tables later.

create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE PLAYER RECORD
-- ============================================================
create table players (
  player_id           uuid primary key default uuid_generate_v4(),
  sport               text not null check (sport in ('football','basketball','baseball')),
  full_name           text not null,
  grad_class          int not null,               -- e.g. 2027
  position            text not null,               -- e.g. 'OT', 'CB'
  height_in           int,
  weight_lb           int,
  high_school          text,
  hometown_city       text,
  hometown_state      text,
  current_school      text,                        -- transfer portal: current college
  transfer_status     text default 'none' check (transfer_status in ('none','entered_portal','committed_transfer')),
  status              text not null default 'uncommitted'
                        check (status in ('uncommitted','fsu_commit','committed_elsewhere','signed','withdrawn')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_players_sport_position on players(sport, position);
create index idx_players_class on players(grad_class);

-- ============================================================
-- RATINGS SNAPSHOTS (append-only — never overwrite, so trend graphs work)
-- ============================================================
create table rating_snapshots (
  snapshot_id         uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references players(player_id) on delete cascade,
  source              text not null,               -- '247Sports','On3','Rivals','PerfectGame',...
  source_tier         int not null,                -- 1 = official, 2 = major db, 3 = specialized, 4 = social
  composite_rating    numeric(5,2),
  stars               int,
  national_rank       int,
  position_rank       int,
  state_rank          int,
  observed_at         timestamptz not null default now(),
  source_url          text,
  confidence          text default 'high' check (confidence in ('high','medium','low'))
);
create index idx_ratings_player_time on rating_snapshots(player_id, observed_at);

-- ============================================================
-- OFFERS (append-only history, per school — never delete)
-- ============================================================
create table offers (
  offer_id            uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references players(player_id) on delete cascade,
  school              text not null,
  offer_date          date not null,
  offer_status        text not null default 'active'
                        check (offer_status in ('active','withdrawn','declined','accepted')),
  fsu_interest_level  text check (fsu_interest_level in ('low','medium','high','top_choice')),
  closed_at           date,                          -- when the relationship ended (commit elsewhere, etc.)
  closed_reason       text,
  source              text,
  source_url          text,
  created_at          timestamptz not null default now()
);
create index idx_offers_player on offers(player_id);
create index idx_offers_school on offers(school) where school = 'Florida State';

-- ============================================================
-- EVENT LOG — every change is an event; this IS the history
-- ============================================================
create table player_events (
  event_id            uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references players(player_id) on delete cascade,
  event_type          text not null check (event_type in (
                        'RANK_CHANGE','RATING_CHANGE','OFFER','OFFER_WITHDRAWN',
                        'VISIT_SCHEDULED','VISIT_COMPLETED','COMMITMENT','DECOMMITMENT',
                        'TOP_SCHOOLS_CHANGE','PORTAL_ENTRY','PORTAL_EXIT',
                        'FSU_INTEREST_CHANGE','NEWS_MENTION')),
  event_date          timestamptz not null default now(),
  old_value           jsonb,
  new_value           jsonb,
  source              text,
  source_url          text,
  confidence          text default 'high'
);
create index idx_events_player_time on player_events(player_id, event_date desc);
create index idx_events_type_time on player_events(event_type, event_date desc);

-- ============================================================
-- FSU ROSTER + PROJECTED NEED (drives the whole scoring engine)
-- ============================================================
create table fsu_roster (
  roster_id           uuid primary key default uuid_generate_v4(),
  sport               text not null,
  position            text not null,
  player_name         text not null,
  class_year          text check (class_year in ('Freshman','Sophomore','Junior','Senior','5th-Year')),
  eligibility_years_left int not null default 0,
  depth_chart_position int not null default 2,       -- 1 = starter, 2 = backup, 3+ = deep bench
  status              text default 'active' check (status in ('active','portal_watch','injured','graduating')),
  projected_departure_year int,                       -- recruiting cycle this player is expected gone by
  departure_reason    text check (departure_reason in ('graduation','nfl_draft','eligibility_exhausted','transfer_out',null)),
  departure_probability numeric(3,2),                 -- 0.00–1.00, for players not yet certain to leave
  updated_at          timestamptz not null default now()
);
create index idx_roster_sport_position on fsu_roster(sport, position);

-- Dynamically calculated positional needs for a target recruiting class (e.g. 2028).
-- need_score is produced by the Roster Need Matrix formula (see scoring engines):
--   100 - (healthy_starters*20 + quality_backups*15 - projected_departures*25), clamped 0-100
create table fsu_positional_need (
  need_id             uuid primary key default uuid_generate_v4(),
  sport               text not null,
  position            text not null,
  target_class        int not null,                -- recruiting cycle this applies to
  need_score          int not null check (need_score between 0 and 100),
  healthy_starters     int,
  quality_backups      int,
  projected_departures int,
  scholarship_target_count int,                     -- how many FSU wants to sign at this position/class
  rationale           text,
  computed_at         timestamptz not null default now(),
  unique (sport, position, target_class, computed_at)
);

-- ============================================================
-- FSU FIT EVALUATION — the score the whole board is built on
-- ============================================================
create table fsu_evaluation (
  eval_id             uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references players(player_id) on delete cascade,
  talent_score         int check (talent_score between 0 and 100),
  position_need_score  int check (position_need_score between 0 and 100),
  roster_opportunity_score int check (roster_opportunity_score between 0 and 100),
  scheme_fit_score     int check (scheme_fit_score between 0 and 100),
  geographic_fit_score int check (geographic_fit_score between 0 and 100),
  accessibility_score  int check (accessibility_score between 0 and 100),
  momentum_score       numeric(5,2),                 -- can be negative
  overall_score        numeric(5,2) not null,
  recommendation       text check (recommendation in (
                          'priority_target','offer_candidate','monitor','re_evaluate','closed')),
  explanation          jsonb,                         -- {factor: delta} breakdown for "explain this"
  computed_at          timestamptz not null default now()
);
create index idx_eval_player_time on fsu_evaluation(player_id, computed_at desc);
create index idx_eval_recommendation on fsu_evaluation(recommendation, computed_at desc);

-- ============================================================
-- CONVENIENCE VIEW: latest evaluation per player, joined to core info
-- ============================================================
create view v_current_board as
select distinct on (p.player_id)
  p.player_id, p.full_name, p.sport, p.position, p.grad_class, p.status,
  e.overall_score, e.momentum_score, e.recommendation, e.explanation, e.computed_at,
  exists(select 1 from offers o where o.player_id = p.player_id
         and o.school = 'Florida State' and o.offer_status = 'active') as fsu_offered
from players p
join fsu_evaluation e on e.player_id = p.player_id
order by p.player_id, e.computed_at desc;

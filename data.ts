import raw from "@/data/recruiting_data.json";
import rosterRaw from "@/data/fsu_roster.json";
import type { RecruitingData } from "@/lib/types";
import type { RosterPlayer } from "@/lib/scoring";

// Swap this for a Supabase/Postgres query later — every page below only
// touches this function, never the JSON file directly.
export function getRecruitingData(): RecruitingData {
  return raw as RecruitingData;
}

// Same idea for the roster: swap for a `select * from fsu_roster` later.
export function getRoster(): RosterPlayer[] {
  return rosterRaw as RosterPlayer[];
}

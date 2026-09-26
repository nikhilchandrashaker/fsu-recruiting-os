export type Offer = {
  school: string;
  date: string;
  status: "active" | "withdrawn" | "declined" | "accepted";
};

export type RatingPoint = {
  date: string;
  rating: number;
  nationalRank: number;
};

export type FitBreakdown = {
  talent: number;
  positionNeed: number;
  rosterOpportunity: number;
  schemeFit: number;
  geographicFit: number;
  accessibility: number;
};

export type Player = {
  id: string;
  name: string;
  position: string;
  gradClass: number;
  highSchool: string;
  state: string;
  heightIn: number;
  weightLb: number;
  compositeRating: number;
  stars: number;
  nationalRank: number;
  positionRank: number;
  fsuOffered: boolean;
  status: "uncommitted" | "fsu_commit" | "committed_elsewhere" | "signed" | "withdrawn";
  offers: Offer[];
  fit: FitBreakdown;
  overallFit: number;
  momentum: number;
  ratingHistory: RatingPoint[];
  why: string;
};

export type PositionNeed = {
  position: string;
  score: number;
  targetClass: number;
  rationale: string;
};

export type RecruitingData = {
  positionNeeds: PositionNeed[];
  players: Player[];
};

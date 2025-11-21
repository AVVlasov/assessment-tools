// Event types
export interface Event {
  _id: string;
  name: string;
  description: string;
  eventDate: string;
  location: string;
  status: 'draft' | 'ready' | 'active' | 'completed';
  votingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
  status?: 'draft' | 'ready' | 'active' | 'completed';
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  status?: 'draft' | 'ready' | 'active' | 'completed';
}

// Team types
export type TeamType = 'team' | 'participant';

export interface Team {
  _id: string;
  eventId: string;
  type: TeamType;
  name: string;
  projectName: string;
  caseDescription: string;
  isActive: boolean;
  votingStatus: 'not_evaluated' | 'evaluating' | 'evaluated';
  isActiveForVoting: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  eventId: string;
  type: TeamType;
  name: string;
  projectName?: string;
  caseDescription?: string;
}

export interface UpdateTeamRequest {
  type?: TeamType;
  name?: string;
  projectName?: string;
  caseDescription?: string;
}

// Expert types
export interface Expert {
  _id: string;
  eventId: string;
  fullName: string;
  token: string;
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpertRequest {
  eventId: string;
  fullName: string;
}

export interface UpdateExpertRequest {
  fullName?: string;
}

// Criteria types
export interface CriterionItem {
  name: string;
  maxScore: number;
}

export interface Criteria {
  _id: string;
  eventId: string;
  blockName: string;
  criteria: CriterionItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCriteriaRequest {
  eventId: string;
  blockName: string;
  criteria: CriterionItem[];
  order?: number;
}

export interface UpdateCriteriaRequest {
  blockName?: string;
  criteria?: CriterionItem[];
  order?: number;
}

// Rating types
export interface RatingItem {
  criteriaId: string;
  criterionName: string;
  score: number;
}

export interface Rating {
  _id: string;
  eventId: string;
  expertId: string | Expert;
  teamId: string | Team;
  ratings: RatingItem[];
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingRequest {
  eventId: string;
  expertId: string;
  teamId: string;
  ratings: RatingItem[];
}

// Statistics types
export interface CriteriaStats {
  name: string;
  scores: number[];
  average: number;
}

export interface TeamRating {
  expert: string;
  criteria: RatingItem[];
  totalScore: number;
}

export interface TeamStatistics {
  team: {
    _id: string;
    name: string;
    type: TeamType;
    projectName: string;
  };
  ratings: TeamRating[];
  criteriaStats: CriteriaStats[];
  totalScore: number;
  ratingsCount: number;
}

export interface Top3Item {
  team: {
    _id: string;
    name: string;
    type: TeamType;
    projectName: string;
  };
  totalScore: number;
  ratingsCount: number;
}


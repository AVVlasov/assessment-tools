// Event types
export type EventType = 'hackathon' | 'queen_of_code' | 'conference';

export interface Event {
  _id: string;
  name: string;
  eventType?: EventType;
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
  eventType: EventType;
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

// Team types (universal contestant entity)
export type TeamType = 'team' | 'participant' | 'speaker' | 'event';
export type SpeakerFormat = 'talk' | 'panel' | 'workshop';

export interface SpeakerReadiness {
  rehearsal: {
    date: string;
    time: string;
    place: string;
    status: 'none' | 'scheduled' | 'passed';
  };
  calendarSet: boolean;
  deckStatus: 'none' | 'uploaded';
  approval: 'pending' | 'approved';
}

export interface Team {
  _id: string;
  eventId: string;
  type: TeamType;
  name: string;
  projectName: string;
  caseDescription: string;
  hallId?: string | null;
  scheduledTime?: string;
  org?: string;
  format?: SpeakerFormat;
  coSpeakers?: string[];
  readiness?: SpeakerReadiness;
  order?: number;
  isActive: boolean;
  votingStatus: 'not_evaluated' | 'evaluating' | 'evaluated';
  isActiveForVoting: boolean;
  programDone?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  eventId: string;
  type: TeamType;
  name: string;
  projectName?: string;
  caseDescription?: string;
  hallId?: string | null;
  scheduledTime?: string;
  org?: string;
  format?: SpeakerFormat;
  coSpeakers?: string[];
  readiness?: SpeakerReadiness;
  order?: number;
}

export interface UpdateTeamRequest {
  type?: TeamType;
  name?: string;
  projectName?: string;
  caseDescription?: string;
  hallId?: string | null;
  scheduledTime?: string;
  org?: string;
  format?: SpeakerFormat;
  coSpeakers?: string[];
  readiness?: SpeakerReadiness;
  order?: number;
  programDone?: boolean;
}

// Hall types
export type HallStatus = 'live' | 'break';

export interface Hall {
  _id: string;
  eventId: string;
  name: string;
  num: number;
  token: string;
  status: HallStatus;
  currentSpeakerIndex: number;
  qrNote?: string;
  order?: number;
  color?: string;
  speakers?: Team[];
  currentSpeaker?: Team | null;
  ratingsCount?: number;
  averageScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHallRequest {
  eventId: string;
  name: string;
  num?: number;
  qrNote?: string;
  order?: number;
  color?: string;
}

export interface UpdateHallRequest {
  name?: string;
  num?: number;
  qrNote?: string;
  status?: HallStatus;
  order?: number;
  currentSpeakerIndex?: number;
  color?: string;
}

// Readiness checklist types
export type ReadinessChecklistType = SpeakerFormat;

export interface ReadinessChecklistItem {
  _id: string;
  text: string;
  done: boolean;
}

export interface ReadinessChecklist {
  _id: string;
  eventId: string;
  name: string;
  type: ReadinessChecklistType;
  items: ReadinessChecklistItem[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReadinessChecklistRequest {
  eventId: string;
  name?: string;
  type?: ReadinessChecklistType;
  items?: Array<{ text?: string; done?: boolean }>;
}

export interface UpdateReadinessChecklistRequest {
  name?: string;
  type?: ReadinessChecklistType;
  items?: Array<{ _id?: string; text?: string; done?: boolean }>;
  order?: number;
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
export type CriteriaType = 'team' | 'participant' | 'speaker' | 'panel' | 'workshop' | 'event' | 'all' | string;

export interface CriterionOption {
  title: string;
  subtitle?: string;
}

export interface CriterionItem {
  name: string;
  tag?: string;
  hint?: string;
  maxScore: number;
  options?: CriterionOption[];
}

export interface Criteria {
  _id: string;
  eventId: string;
  blockName: string;
  criteriaType: CriteriaType;
  criteria: CriterionItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCriteriaRequest {
  eventId: string;
  blockName: string;
  criteriaType: CriteriaType;
  criteria: CriterionItem[];
  order?: number;
}

export interface UpdateCriteriaRequest {
  blockName?: string;
  criteriaType?: CriteriaType;
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

// Listener rating
export type ListenerTargetType = 'speaker' | 'panel' | 'workshop' | 'event';

export interface ListenerScoreItem {
  criterionName: string;
  tag?: string;
  score: number;
  optionTitle?: string;
}

export interface ListenerRating {
  _id: string;
  eventId: string;
  hallId?: string | null;
  teamId?: string | null;
  targetType: ListenerTargetType;
  sessionId: string;
  scores: ListenerScoreItem[];
  reactions: string[];
  elapsedSeconds: number;
  averageScore: number;
}

export interface CreateListenerRatingRequest {
  eventId: string;
  hallId?: string | null;
  teamId?: string | null;
  targetType: ListenerTargetType;
  sessionId: string;
  scores: ListenerScoreItem[];
  reactions?: string[];
  elapsedSeconds?: number;
}

export interface UpdateListenerReactionsRequest {
  eventId: string;
  teamId?: string | null;
  targetType: ListenerTargetType;
  sessionId: string;
  reactions: string[];
}

export interface ListenerCriterion {
  name: string;
  tag: string;
  hint: string;
  maxScore: number;
  options: CriterionOption[];
}

export interface ListenerPreviousRating {
  averageScore: number;
  elapsedSeconds: number;
  reactions: string[];
  createdAt?: string;
}

export interface ListenerHallPayload {
  hall: Hall;
  event: Event;
  eventEnded: boolean;
  currentSpeaker: Team | null;
  nextSpeaker: Team | null;
  speakers: Team[];
  isPanel: boolean;
  isWorkshop: boolean;
  alreadyRatedSpeaker: boolean;
  alreadyRatedEvent: boolean;
  previousSpeakerRating: ListenerPreviousRating | null;
  previousEventRating: ListenerPreviousRating | null;
  criteria: {
    speaker: ListenerCriterion[];
    panel: ListenerCriterion[];
    workshop: ListenerCriterion[];
    event: ListenerCriterion[];
  };
  ratingsCount: number;
  reactions: {
    speaker: string[];
    workshop: string[];
    event: string[];
  };
}

export interface ListenerStatsBar {
  name: string;
  val: number;
  w: number;
  dist?: Array<{ star: number; n: number; w: number }>;
}

export interface ListenerEventStats {
  n: number;
  total: number | null;
  bars: ListenerStatsBar[];
  topReactions: Array<{ label: string; count: number }>;
  nps?: string;
  conversion?: string;
}

export interface ListenerStatsResponse {
  totalRatings: number;
  leaderboard: Array<{
    teamId: string;
    name: string;
    talk: string;
    hall: string;
    hallId?: string;
    n: number;
    scores: number[];
    bars: ListenerStatsBar[];
    total: number;
    topReaction: string;
  }>;
  topReactions: Array<{ label: string; count: number }>;
  eventStats?: ListenerEventStats;
  speakerRows: Array<{
    _id: string;
    time: string;
    name: string;
    talk: string;
    hall: string;
    hallId?: string;
    hallColor?: string;
    status: 'live' | 'done' | 'waiting';
    programDone?: boolean;
    avg: number | null;
    n: number;
    format?: SpeakerFormat;
    org?: string;
    coSpeakers?: string[];
  }>;
  halls: Hall[];
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

export interface Top3Response {
  teams?: Top3Item[];
  participants?: Top3Item[];
  speakers?: Top3Item[];
}

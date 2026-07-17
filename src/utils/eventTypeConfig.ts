import type { CriteriaType, EventType, TeamType } from '../types';

export interface EventTypeConfig {
  eventType: EventType;
  labelKey: string;
  contestantsTabKey: string;
  contestantsTitleKey: string;
  addButtonKey: string;
  nameFieldKey: string;
  allowedTeamTypes: TeamType[];
  defaultTeamType: TeamType;
  showTypeSelector: boolean;
  showProjectFields: boolean;
  allowedCriteriaTypes: CriteriaType[];
  defaultCriteriaType: CriteriaType;
  statisticsFilters: Array<'all' | TeamType>;
  top3Groups: Array<'teams' | 'participants' | 'speakers'>;
  showEventRatingCard: boolean;
  creatableTeamTypes: TeamType[];
}

const CONFIGS: Record<EventType, EventTypeConfig> = {
  hackathon: {
    eventType: 'hackathon',
    labelKey: 'events.types.hackathon',
    contestantsTabKey: 'tabs.teams',
    contestantsTitleKey: 'teams.title',
    addButtonKey: 'teams.addButton',
    nameFieldKey: 'teams.name',
    allowedTeamTypes: ['team'],
    defaultTeamType: 'team',
    showTypeSelector: false,
    showProjectFields: true,
    allowedCriteriaTypes: ['team', 'all'],
    defaultCriteriaType: 'team',
    statisticsFilters: ['all', 'team'],
    top3Groups: ['teams'],
    showEventRatingCard: false,
    creatableTeamTypes: ['team']
  },
  queen_of_code: {
    eventType: 'queen_of_code',
    labelKey: 'events.types.queen_of_code',
    contestantsTabKey: 'tabs.participants',
    contestantsTitleKey: 'teams.participantsTitle',
    addButtonKey: 'teams.addParticipant',
    nameFieldKey: 'teams.fullName',
    allowedTeamTypes: ['participant'],
    defaultTeamType: 'participant',
    showTypeSelector: false,
    showProjectFields: false,
    allowedCriteriaTypes: ['participant', 'all'],
    defaultCriteriaType: 'participant',
    statisticsFilters: ['all', 'participant'],
    top3Groups: ['participants'],
    showEventRatingCard: false,
    creatableTeamTypes: ['participant']
  },
  conference: {
    eventType: 'conference',
    labelKey: 'events.types.conference',
    contestantsTabKey: 'tabs.speakers',
    contestantsTitleKey: 'teams.speakersTitle',
    addButtonKey: 'teams.addSpeaker',
    nameFieldKey: 'teams.speakerName',
    allowedTeamTypes: ['speaker', 'event'],
    defaultTeamType: 'speaker',
    showTypeSelector: false,
    showProjectFields: false,
    allowedCriteriaTypes: ['speaker', 'panel', 'workshop', 'event', 'all'],
    defaultCriteriaType: 'speaker',
    statisticsFilters: ['all', 'speaker', 'event'],
    top3Groups: ['speakers'],
    showEventRatingCard: true,
    creatableTeamTypes: ['speaker']
  }
};

export const EVENT_TYPES: EventType[] = ['hackathon', 'queen_of_code', 'conference'];

export const getEventTypeConfig = (eventType?: EventType | string | null): EventTypeConfig => {
  if (eventType && eventType in CONFIGS) {
    return CONFIGS[eventType as EventType];
  }
  return CONFIGS.hackathon;
};

export const getContestantTypeLabelKey = (type: TeamType): string => {
  switch (type) {
    case 'team':
      return 'teams.type.team';
    case 'participant':
      return 'teams.type.participant';
    case 'speaker':
      return 'teams.type.speaker';
    case 'event':
      return 'teams.type.event';
    default:
      return 'teams.type.team';
  }
};

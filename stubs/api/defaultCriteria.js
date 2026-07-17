// Критерии по умолчанию — лежат в stubs/api, чтобы hot-reload brojs их подхватывал.

const HACKATHON_DEFAULT_CRITERIA = [
  {
    blockName: 'Оценка проекта команды',
    criteriaType: 'team',
    criteria: [
      { name: 'Соответствие решения поставленной задаче', maxScore: 5 },
      { name: 'Оригинальность - использование нестандартных технических и проектных подходов', maxScore: 5 },
      { name: 'Работоспособность решения', maxScore: 1 },
      { name: 'Технологическая сложность решения', maxScore: 2 },
      { name: 'Объем функциональных возможностей решения', maxScore: 2 },
      { name: 'Аргументация способа выбранного решения', maxScore: 5 },
      { name: 'Качество предоставления информации', maxScore: 5 },
      { name: 'Наличие удобного UX/UI', maxScore: 5 },
      { name: 'Наличие не менее 5 AI-агентов', maxScore: 5 }
    ],
    order: 0
  },
  {
    blockName: 'Оценка выступления участника',
    criteriaType: 'participant',
    criteria: [
      { name: 'Качество презентации и донесения идеи', maxScore: 5 },
      { name: 'Понимание технологии и решения', maxScore: 5 },
      { name: 'Аргументация выбранного подхода', maxScore: 5 },
      { name: 'Ответы на вопросы жюри', maxScore: 5 },
      { name: 'Коммуникативные навыки', maxScore: 5 }
    ],
    order: 1
  }
];

// Критерии для жюри: то, что реально видно на защите
const QUEEN_OF_CODE_DEFAULT_CRITERIA = [
  {
    blockName: 'Оценка выступления участницы',
    criteriaType: 'participant',
    criteria: [
      { name: 'Насколько ясно донесена идея', maxScore: 5 },
      { name: 'Насколько видно понимание решения', maxScore: 5 },
      { name: 'Насколько убедительны ответы на вопросы', maxScore: 5 },
      { name: 'Общее впечатление от выступления', maxScore: 5 }
    ],
    order: 0
  }
];

// Критерии для слушателя из зала: только личное восприятие, без мета-метрик зала
const CONFERENCE_DEFAULT_CRITERIA = [
  {
    blockName: 'Оценка выступления',
    criteriaType: 'speaker',
    criteria: [
      { name: 'Насколько понятно изложен материал', maxScore: 5 },
      { name: 'Насколько полезно это было для меня', maxScore: 5 },
      { name: 'Насколько логично построено выступление', maxScore: 5 }
    ],
    order: 0
  },
  {
    blockName: 'Общая оценка мероприятия',
    criteriaType: 'event',
    criteria: [
      { name: 'Насколько удобно было участвовать (тайминг, организация)', maxScore: 5 },
      { name: 'Насколько интересной оказалась программа в целом', maxScore: 5 },
      { name: 'Общее впечатление от мероприятия', maxScore: 5 }
    ],
    order: 1
  }
];

const getDefaultCriteriaByEventType = (eventType) => {
  switch (eventType) {
    case 'queen_of_code':
      return QUEEN_OF_CODE_DEFAULT_CRITERIA;
    case 'conference':
      return CONFERENCE_DEFAULT_CRITERIA;
    case 'hackathon':
    default:
      return HACKATHON_DEFAULT_CRITERIA;
  }
};

module.exports = {
  getDefaultCriteriaByEventType
};

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Stack, Text, HStack } from '@chakra-ui/react';
import { StarRating } from '../../components/assessment';
import {
  useGetExpertByTokenQuery,
  useGetActiveTeamForVotingQuery,
  useGetCriteriaQuery,
  useCreateRatingMutation,
  useGetExpertRatingsQuery,
  useGetEventQuery
} from '../../__data__/api';
import type { EventType, RatingItem, TeamType } from '../../types';
import { getEventTypeConfig } from '../../utils/eventTypeConfig';

const TYPE_LABELS: Record<TeamType, string> = {
  team: 'Команда',
  participant: 'Участница',
  speaker: 'Спикер',
  event: 'Мероприятие'
};

const PAGE_TITLES: Record<EventType, string> = {
  hackathon: 'Оценка',
  queen_of_code: 'Оценка',
  conference: 'Ваша оценка'
};

const WAITING_COPY: Record<EventType, { title: string; body: string; hint: string }> = {
  hackathon: {
    title: 'Ожидание',
    body: 'Сейчас нет активной оценки.',
    hint: 'Когда админ запустит оценку команды или участницы — форма появится здесь.'
  },
  queen_of_code: {
    title: 'Ожидание',
    body: 'Сейчас нет активной оценки.',
    hint: 'Когда начнётся выступление участницы, админ откроет оценку.'
  },
  conference: {
    title: 'Подождите, пожалуйста',
    body: 'Оценка ещё не открыта.',
    hint: 'Как только начнётся доклад или этап общей оценки мероприятия — форма появится сама. Обновлять страницу не нужно.'
  }
};

const CONTEXT_HINTS: Record<TeamType, string> = {
  team: 'Оцените проект по критериям ниже. Оценка сохраняется автоматически.',
  participant: 'Оцените выступление по критериям ниже. Оценка сохраняется автоматически.',
  speaker: 'Оцените доклад так, как вы его восприняли. Достаточно личного впечатления — без анализа всего зала.',
  event: 'Оцените мероприятие в целом по своему опыту участия.'
};

export const AssessmentExpertPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data: expert, isLoading: expertLoading } = useGetExpertByTokenQuery(token || '', {
    skip: !token
  });

  const { data: event } = useGetEventQuery(expert?.eventId || '', {
    skip: !expert?.eventId
  });

  const { data: activeTeam, isLoading: teamLoading } = useGetActiveTeamForVotingQuery(
    { eventId: expert?.eventId },
    {
      skip: !expert?.eventId,
      pollingInterval: 3000
    }
  );

  const { data: criteriaBlocks = [], isLoading: criteriaLoading } = useGetCriteriaQuery(
    activeTeam
      ? { eventId: activeTeam.eventId, criteriaType: activeTeam.type }
      : undefined,
    { skip: !activeTeam }
  );

  const [createRating] = useCreateRatingMutation();
  const { data: expertRatings = [] } = useGetExpertRatingsQuery(expert?._id || '', {
    skip: !expert,
    pollingInterval: 10000
  });

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const eventType: EventType = event?.eventType || 'hackathon';
  const config = getEventTypeConfig(eventType);
  const pageTitle = PAGE_TITLES[eventType];
  const waiting = WAITING_COPY[eventType];

  useEffect(() => {
    if (activeTeam && expert) {
      const existingRating = expertRatings.find(r =>
        typeof r.teamId === 'object' && r.teamId._id === activeTeam._id
      );

      if (existingRating) {
        const ratingsMap: Record<string, number> = {};
        existingRating.ratings.forEach(r => {
          ratingsMap[r.criterionName] = r.score;
        });
        setRatings(ratingsMap);
      } else {
        setRatings({});
      }
    } else {
      setRatings({});
    }
  }, [activeTeam, expert, expertRatings]);

  useEffect(() => {
    if (!activeTeam || !expert) return;

    const allCriteria = criteriaBlocks.flatMap(block => block.criteria);
    if (allCriteria.length === 0) return;

    const hasAnyRating = Object.values(ratings).some(r => r > 0);
    if (!hasAnyRating) return;

    const saveRatings = async () => {
      const ratingsArray: RatingItem[] = allCriteria.map(criterion => ({
        criteriaId: criteriaBlocks.find(b => b.criteria.includes(criterion))?._id || '',
        criterionName: criterion.name,
        score: ratings[criterion.name] || 0
      }));

      try {
        setSaveStatus('saving');
        await createRating({
          eventId: activeTeam.eventId,
          expertId: expert._id,
          teamId: activeTeam._id,
          ratings: ratingsArray
        }).unwrap();

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error auto-saving rating:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    const timeoutId = setTimeout(() => {
      saveRatings();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ratings, activeTeam, expert, criteriaBlocks, createRating]);

  const handleRatingChange = (criterionName: string, score: number) => {
    setRatings(prev => ({ ...prev, [criterionName]: score }));
  };

  const allCriteria = criteriaBlocks.flatMap(block => block.criteria);
  const ratedCount = allCriteria.filter(c => ratings[c.name] > 0).length;
  const totalCount = allCriteria.length;
  const progress = totalCount === 0 ? 0 : Math.round((ratedCount / totalCount) * 100);
  const isComplete = totalCount > 0 && ratedCount === totalCount;

  if (expertLoading || (teamLoading && !activeTeam) || (criteriaLoading && activeTeam)) {
    return (
      <Box minH="100vh" bg="#0A0A0A" display="flex" alignItems="center" justifyContent="center">
        <Text color="#B0B0B0" fontSize="xl">Загрузка...</Text>
      </Box>
    );
  }

  if (!expert) {
    return (
      <Box minH="100vh" bg="#0A0A0A" display="flex" alignItems="center" justifyContent="center">
        <Text color="#FF0080" fontSize="xl">Ссылка недействительна</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#0A0A0A">
      <Box
        bg="#1A1A1A"
        borderBottom="1px solid #333333"
        p={{ base: 4, md: 6 }}
      >
        <Box textAlign="center">
          <Text
            fontSize={{ base: 'xl', md: '3xl' }}
            fontWeight="900"
            textTransform="uppercase"
            letterSpacing="-1px"
            color="#D4FF00"
          >
            {pageTitle}
          </Text>
          {event?.name && (
            <Text fontSize="md" color="#E0E0E0" fontWeight="600" mt={2}>
              {event.name}
            </Text>
          )}
          <Text fontSize="sm" color="#B0B0B0" mt={1}>
            {expert.fullName}
          </Text>
        </Box>
      </Box>

      <Box maxW="640px" mx="auto" p={{ base: 4, md: 6 }}>
        <Stack gap={5}>
          {activeTeam && (
            <>
              <Box
                bg="#1F1F1F"
                p={5}
                border="3px solid #D4FF00"
                borderRadius="8px"
                textAlign="center"
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="#0A0A0A"
                  bg="#D4FF00"
                  display="inline-block"
                  px={3}
                  py={1}
                  borderRadius="20px"
                  mb={3}
                  textTransform="uppercase"
                >
                  {TYPE_LABELS[activeTeam.type] || activeTeam.type}
                </Text>
                <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="900" color="#FFFFFF" mb={2}>
                  {activeTeam.name}
                </Text>
                <Text color="#B0B0B0" fontSize="sm" maxW="480px" mx="auto">
                  {CONTEXT_HINTS[activeTeam.type]}
                </Text>
                {config.showProjectFields && activeTeam.projectName && (
                  <Text color="#B0B0B0" fontSize="md" mt={3}>
                    <Text as="span" color="#D4FF00" fontWeight="700">Проект:</Text> {activeTeam.projectName}
                  </Text>
                )}
              </Box>

              <Text fontSize="sm" color="#B0B0B0" textAlign="center">
                Шкала: 1 — слабо · 5 — отлично. Достаточно вашего личного впечатления.
              </Text>

              {criteriaBlocks.map((block) => (
                <Box
                  key={block._id}
                  bg="#1F1F1F"
                  p={{ base: 4, md: 5 }}
                  border="2px solid #333333"
                  borderRadius="8px"
                >
                  {criteriaBlocks.length > 1 && (
                    <Text fontSize="md" fontWeight="800" mb={4} color="#D4FF00">
                      {block.blockName}
                    </Text>
                  )}

                  <Stack gap={3}>
                    {block.criteria.map((criterion) => (
                      <Box
                        key={criterion.name}
                        p={4}
                        bg="#1A1A1A"
                        borderRadius="8px"
                      >
                        <Text fontSize="md" color="#FFFFFF" mb={3} fontWeight="600" lineHeight="1.4">
                          {criterion.name}
                        </Text>

                        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                          <StarRating
                            value={ratings[criterion.name] || 0}
                            maxScore={criterion.maxScore}
                            onChange={(score) => handleRatingChange(criterion.name, score)}
                            size="lg"
                          />
                          <Text fontSize="md" color="#D4FF00" fontWeight="900" minW="48px" textAlign="right">
                            {ratings[criterion.name] || 0}/{criterion.maxScore}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}

              <Box
                bg="#1F1F1F"
                p={4}
                border="2px solid #333333"
                borderRadius="8px"
                textAlign="center"
              >
                <Text fontSize="sm" color="#B0B0B0" mb={2}>
                  Заполнено {ratedCount} из {totalCount}
                </Text>

                <Box position="relative" height="28px" bg="#1A1A1A" borderRadius="20px" overflow="hidden" mb={2}>
                  <Box
                    position="absolute"
                    height="100%"
                    width={`${progress}%`}
                    bg={isComplete ? '#4CAF50' : '#D4FF00'}
                    transition="all 0.3s ease"
                    borderRadius="20px"
                  />
                </Box>

                {saveStatus === 'saving' && (
                  <Text color="#FF6B00" fontSize="sm" fontWeight="700">
                    Сохранение...
                  </Text>
                )}

                {saveStatus === 'saved' && (
                  <Text color="#4CAF50" fontSize="sm" fontWeight="700">
                    Сохранено
                  </Text>
                )}

                {saveStatus === 'error' && (
                  <Text color="#FF4444" fontSize="sm" fontWeight="700">
                    Не удалось сохранить. Попробуйте ещё раз.
                  </Text>
                )}

                {isComplete && (
                  <Text color="#4CAF50" fontSize="md" fontWeight="800" mt={2}>
                    Готово. Спасибо за оценку!
                  </Text>
                )}
              </Box>
            </>
          )}

          {!activeTeam && (
            <Box
              textAlign="center"
              py={{ base: 12, md: 16 }}
              px={4}
              bg="#1F1F1F"
              border="2px solid #333333"
              borderRadius="8px"
            >
              <Text color="#D4FF00" fontSize="2xl" fontWeight="900" mb={3}>
                {waiting.title}
              </Text>
              <Text color="#FFFFFF" fontSize="lg" mb={2}>
                {waiting.body}
              </Text>
              <Text color="#B0B0B0" fontSize="md" maxW="420px" mx="auto">
                {waiting.hint}
              </Text>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default AssessmentExpertPage;

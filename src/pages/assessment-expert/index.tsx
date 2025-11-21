import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Text, HStack, IconButton } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { StarRating } from '../../components/assessment';
import { useGetExpertByTokenQuery, useGetActiveTeamForVotingQuery, useGetCriteriaQuery, useCreateRatingMutation, useGetExpertRatingsQuery } from '../../__data__/api';
import type { RatingItem } from '../../types';

export const AssessmentExpertPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const { data: expert, isLoading: expertLoading } = useGetExpertByTokenQuery(token || '', {
    skip: !token
  });
  
  const { data: activeTeam, isLoading: teamLoading } = useGetActiveTeamForVotingQuery();
  const { data: criteriaBlocks = [], isLoading: criteriaLoading } = useGetCriteriaQuery();
  const [createRating, { isLoading: isSaving }] = useCreateRatingMutation();
  const { data: expertRatings = [] } = useGetExpertRatingsQuery(expert?._id || '', {
    skip: !expert
  });

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Загружаем существующие оценки для активной команды
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
    }
  }, [activeTeam, expert, expertRatings]);

  // Автосохранение при изменении рейтинга
  useEffect(() => {
    if (!activeTeam || !expert) return;
    
    const allCriteria = criteriaBlocks.flatMap(block => block.criteria);
    if (allCriteria.length === 0) return;
    
    // Проверяем есть ли хотя бы одна оценка
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

    // Debounce автосохранения
    const timeoutId = setTimeout(() => {
      saveRatings();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [ratings, activeTeam, expert, criteriaBlocks, createRating]);

  const handleRatingChange = (criterionName: string, score: number) => {
    setRatings(prev => ({ ...prev, [criterionName]: score }));
  };

  // Расчет прогресса оценивания
  const calculateProgress = () => {
    const allCriteria = criteriaBlocks.flatMap(block => block.criteria);
    if (allCriteria.length === 0) return 0;
    
    const ratedCriteria = allCriteria.filter(c => ratings[c.name] > 0).length;
    return Math.round((ratedCriteria / allCriteria.length) * 100);
  };

  const progress = calculateProgress();


  if (expertLoading || teamLoading || criteriaLoading) {
    return (
      <Box minH="100vh" bg="#0A0A0A" display="flex" alignItems="center" justifyContent="center">
        <Text color="#B0B0B0" fontSize="xl">Загрузка...</Text>
      </Box>
    );
  }

  if (!expert) {
    return (
      <Box minH="100vh" bg="#0A0A0A" display="flex" alignItems="center" justifyContent="center">
        <Text color="#FF0080" fontSize="xl">Эксперт не найден</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#0A0A0A">
      <Box
        bg="#1A1A1A"
        borderBottom="1px solid #333333"
        p={6}
        position="relative"
      >
        <IconButton
          aria-label="Вернуться к дашборду"
          onClick={() => navigate('/assessment-tools')}
          size="md"
          bg="#2A2A2A"
          color="#D4FF00"
          position="absolute"
          left={6}
          top="50%"
          transform="translateY(-50%)"
          _hover={{ bg: '#3A3A3A', color: '#FFFFFF' }}
        >
          <FiArrowLeft size={20} />
        </IconButton>
        <Box textAlign="center">
          <Text fontSize="3xl" fontWeight="900" textTransform="uppercase" letterSpacing="-1px" color="#D4FF00">
            Оценка команд
          </Text>
          <Text fontSize="lg" color="#FF0080" fontWeight="700" mt={2}>
            Эксперт: {expert.fullName}
          </Text>
        </Box>
      </Box>

      <Box maxW="800px" mx="auto" p={6}>
        <Stack gap={6}>
          {activeTeam && (
            <>
              <Box
                bg="#1F1F1F"
                p={6}
                border="3px solid #D4FF00"
                borderRadius="8px"
                textAlign="center"
              >
                <Text fontSize="2xl" fontWeight="900" color="#FFFFFF" textTransform="uppercase" mb={2}>
                  {activeTeam.name}
                </Text>
                {activeTeam.projectName && (
                  <Text color="#B0B0B0" fontSize="md">
                    <Text as="span" color="#D4FF00" fontWeight="700">Проект:</Text> {activeTeam.projectName}
                  </Text>
                )}
                {activeTeam.caseDescription && (
                  <Text color="#B0B0B0" fontSize="sm" mt={2}>
                    {activeTeam.caseDescription}
                  </Text>
                )}
              </Box>

              {criteriaBlocks.map((block) => (
                <Box
                  key={block._id}
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #333333"
                  borderRadius="8px"
                >
                  <Text fontSize="xl" fontWeight="900" mb={4} color="#D4FF00" textTransform="uppercase">
                    {block.blockName}
                  </Text>

                  <Stack gap={4}>
                    {block.criteria.map((criterion) => (
                      <Box
                        key={criterion.name}
                        p={4}
                        bg="#1A1A1A"
                        borderRadius="8px"
                      >
                        <Text fontSize="md" color="#FFFFFF" mb={3} fontWeight="600">
                          {criterion.name}
                        </Text>

                        <HStack justify="space-between" align="center">
                          <StarRating
                            value={ratings[criterion.name] || 0}
                            maxScore={criterion.maxScore}
                            onChange={(score) => handleRatingChange(criterion.name, score)}
                            size="lg"
                          />
                          <Text fontSize="lg" color="#D4FF00" fontWeight="900">
                            {ratings[criterion.name] || 0} / {criterion.maxScore}
                          </Text>
                        </HStack>
                      </Box>
              ))}
            </Stack>
          </Box>
        ))}

        <Box
          bg="#1F1F1F"
          p={6}
          border="3px solid #333333"
          borderRadius="8px"
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="700" mb={3} color="#D4FF00">
            Прогресс оценивания
          </Text>
          
          <Box position="relative" height="40px" bg="#1A1A1A" borderRadius="20px" overflow="hidden" mb={3}>
            <Box
              position="absolute"
              height="100%"
              width={`${progress}%`}
              bg={progress === 100 ? '#00FF00' : '#D4FF00'}
              transition="all 0.3s ease"
              borderRadius="20px"
            />
            <Text
              position="absolute"
              width="100%"
              lineHeight="40px"
              fontWeight="900"
              fontSize="xl"
              color={progress > 50 ? '#000000' : '#FFFFFF'}
            >
              {progress}%
            </Text>
          </Box>

          {saveStatus === 'saving' && (
            <Text color="#FF6B00" fontSize="sm" fontWeight="700">
              💾 Сохранение...
            </Text>
          )}
          
          {saveStatus === 'saved' && (
            <Text color="#00FF00" fontSize="sm" fontWeight="700">
              ✓ Автоматически сохранено
            </Text>
          )}
          
          {saveStatus === 'error' && (
            <Text color="#FF0080" fontSize="sm" fontWeight="700">
              ⚠️ Ошибка сохранения
            </Text>
          )}

          {progress === 100 && saveStatus === 'saved' && (
            <Text color="#00FF00" fontSize="lg" fontWeight="900" mt={2}>
              🎉 Оценивание завершено!
            </Text>
          )}
        </Box>
      </>
    )}

          {!activeTeam && (
            <Box 
              textAlign="center" 
              py={20}
              bg="#1F1F1F"
              border="3px solid #333333"
              borderRadius="8px"
            >
              <Text color="#D4FF00" fontSize="2xl" fontWeight="900" mb={4}>
                ⏳ Ожидание
              </Text>
              <Text color="#B0B0B0" fontSize="lg">
                В данный момент нет команды для оценки.
              </Text>
              <Text color="#B0B0B0" fontSize="md" mt={2}>
                Администратор активирует команду, когда начнется выступление.
              </Text>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default AssessmentExpertPage;


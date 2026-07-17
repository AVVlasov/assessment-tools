import React, { useEffect, useState } from 'react';
import { Box, Grid, HStack, Stack, Text, Badge } from '@chakra-ui/react';
import { RadioGroup, Radio } from '../../../components/ui/radio';
import { useGetStatisticsQuery } from '../../../__data__/api';
import type { EventType, TeamType } from '../../../types';
import { getEventTypeConfig } from '../../../utils/eventTypeConfig';

interface StatisticsTabProps {
  eventId: string;
  eventType: EventType;
}

const FILTER_LABELS: Record<string, string> = {
  all: 'Все',
  team: 'Только команды',
  participant: 'Только участницы',
  speaker: 'Только спикеры',
  event: 'Общая оценка мероприятия'
};

const TYPE_LABELS: Record<TeamType, string> = {
  team: 'Команда',
  participant: 'Участница',
  speaker: 'Спикер',
  event: 'Мероприятие'
};

const TYPE_COLORS: Record<TeamType, string> = {
  team: '#D4FF00',
  participant: '#FF0080',
  speaker: '#4CAF50',
  event: '#FF6B00'
};

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ eventId, eventType }) => {
  const config = getEventTypeConfig(eventType);
  const [filterType, setFilterType] = useState<string>('');
  const { data: statistics = [], isLoading } = useGetStatisticsQuery({ eventId, type: filterType });

  useEffect(() => {
    setFilterType('');
  }, [eventType]);

  const evaluatedStatistics = statistics.filter((stat) => stat.ratingsCount > 0);

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  const showFilters = config.statisticsFilters.length > 1;

  return (
    <Stack gap={6}>
      {showFilters && (
        <HStack>
          <Text fontSize="md" fontWeight="700" color="#B0B0B0">
            Фильтр:
          </Text>
          <RadioGroup value={filterType} onValueChange={(e) => setFilterType(e.value)}>
            <HStack gap={4} flexWrap="wrap">
              {config.statisticsFilters.map((filter) => {
                const value = filter === 'all' ? '' : filter;
                return (
                  <Radio key={filter} value={value}>
                    {FILTER_LABELS[filter]}
                  </Radio>
                );
              })}
            </HStack>
          </RadioGroup>
        </HStack>
      )}

      <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
        {evaluatedStatistics.map((stat) => (
          <Box
            key={stat.team._id}
            bg="#1F1F1F"
            p={5}
            border="3px solid #333333"
            borderRadius="8px"
            transition="all 0.3s"
            _hover={{ borderColor: '#FF0080', transform: 'translateY(-5px)' }}
          >
            <HStack justify="space-between" mb={3}>
              <Badge
                bg={TYPE_COLORS[stat.team.type] || '#D4FF00'}
                color="#000000"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
              >
                {TYPE_LABELS[stat.team.type] || stat.team.type}
              </Badge>

              <Text fontSize="sm" color="#B0B0B0">
                Оценок: {stat.ratingsCount}
              </Text>
            </HStack>

            <Text fontSize="xl" fontWeight="900" mb={2} color="#FFFFFF" textTransform="uppercase">
              {stat.team.name}
            </Text>

            {stat.team.projectName && (
              <Text fontSize="sm" color="#B0B0B0" mb={3}>
                <Text as="span" color="#D4FF00" fontWeight="700">Проект:</Text> {stat.team.projectName}
              </Text>
            )}

            <Box
              bg="#D4FF00"
              color="#000000"
              p={3}
              borderRadius="8px"
              mb={4}
              textAlign="center"
            >
              <Text fontSize="2xl" fontWeight="900">
                {stat.totalScore.toFixed(2)}
              </Text>
              <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                Средний балл
              </Text>
            </Box>

            {stat.criteriaStats.length > 0 && (
              <Stack gap={2} mt={4}>
                <Text fontSize="sm" fontWeight="700" color="#B0B0B0" textTransform="uppercase">
                  По критериям:
                </Text>
                {stat.criteriaStats.map((criteria, index) => (
                  <HStack
                    key={index}
                    justify="space-between"
                    px={3}
                    py={2}
                    bg="#1A1A1A"
                    borderRadius="4px"
                  >
                    <Text color="#B0B0B0" fontSize="sm" lineClamp={1} flex={1}>
                      {criteria.name}
                    </Text>
                    <Text color="#D4FF00" fontSize="sm" fontWeight="700">
                      {criteria.average.toFixed(1)}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            )}

            {stat.ratings.length > 0 && (
              <Stack gap={2} mt={4}>
                <Text fontSize="sm" fontWeight="700" color="#B0B0B0" textTransform="uppercase">
                  Оценки экспертов:
                </Text>
                {stat.ratings.map((rating, index) => (
                  <Box key={index} px={3} py={2} bg="#1A1A1A" borderRadius="4px">
                    <HStack justify="space-between" mb={1}>
                      <Text color="#FF0080" fontSize="sm" fontWeight="700">
                        {rating.expert}
                      </Text>
                      <Text color="#D4FF00" fontSize="sm" fontWeight="700">
                        {rating.totalScore} баллов
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        ))}
      </Grid>

      {evaluatedStatistics.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Нет данных для отображения
          </Text>
        </Box>
      )}
    </Stack>
  );
};

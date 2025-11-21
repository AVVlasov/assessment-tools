import React, { useState } from 'react';
import { Box, Grid, HStack, Stack, Text, Badge } from '@chakra-ui/react';
import { RadioGroup, Radio } from '../../../components/ui/radio';
import { useGetStatisticsQuery } from '../../../__data__/api';

interface StatisticsTabProps {
  eventId: string;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ eventId }) => {
  const [filterType, setFilterType] = useState<string>('');
  const { data: statistics = [], isLoading } = useGetStatisticsQuery({ eventId, type: filterType });

  // В статистике отображаем только тех, у кого есть хотя бы одна оценка
  const evaluatedStatistics = statistics.filter((stat) => stat.ratingsCount > 0);

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  return (
    <Stack gap={6}>
      <HStack>
        <Text fontSize="md" fontWeight="700" color="#B0B0B0">
          Фильтр:
        </Text>
        <RadioGroup value={filterType} onValueChange={(e) => setFilterType(e.value)}>
          <HStack gap={4}>
            <Radio value="">Все</Radio>
            <Radio value="team">Только команды</Radio>
            <Radio value="participant">Только участники</Radio>
          </HStack>
        </RadioGroup>
      </HStack>

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
                bg={stat.team.type === 'team' ? '#D4FF00' : '#FF0080'}
                color="#000000"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
              >
                {stat.team.type === 'team' ? 'Команда' : 'Участник'}
              </Badge>
              
              <Text fontSize="sm" color="#B0B0B0">
                Оценок: {stat.ratingsCount}
              </Text>
            </HStack>

            <Text fontSize="xl" fontWeight="900" mb={2} color="#FFFFFF" textTransform="uppercase">
              {'{ '}{stat.team.name}{' }'}
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
                    <Text color="#B0B0B0" fontSize="sm" noOfLines={1} flex={1}>
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


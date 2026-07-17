import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, HStack, Stack, Text } from '@chakra-ui/react';
import { RadioGroup, Radio } from '../../../components/ui/radio';
import { useGetTop3Query } from '../../../__data__/api';
import type { EventType, Top3Item, Top3Response } from '../../../types';
import { getEventTypeConfig } from '../../../utils/eventTypeConfig';

interface Top3TabProps {
  eventId: string;
  eventType: EventType;
}

type Top3Group = 'teams' | 'participants' | 'speakers';

const GROUP_TO_TYPE: Record<Top3Group, 'team' | 'participant' | 'speaker'> = {
  teams: 'team',
  participants: 'participant',
  speakers: 'speaker'
};

const GROUP_LABELS: Record<Top3Group, string> = {
  teams: 'Команды',
  participants: 'Участницы',
  speakers: 'Спикеры'
};

const GROUP_TITLES: Record<Top3Group, string> = {
  teams: 'Топ-3 команд',
  participants: 'Топ-3 участниц',
  speakers: 'Топ-3 спикеров'
};

const placeColors = ['#D4FF00', '#AFAFAF', '#FF6B00'];
const placeLabels = ['1 место', '2 место', '3 место'];

const PodiumCard: React.FC<{ item: Top3Item; place: number }> = ({ item, place }) => {
  const color = placeColors[place];
  const isFirst = place === 0;

  return (
    <Box
      bg="#1F1F1F"
      p={6}
      border={`3px solid ${color}`}
      borderRadius="8px"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-10px)' }}
      position="relative"
      minH={isFirst ? '300px' : '250px'}
    >
      <Box
        position="absolute"
        top="-15px"
        left="50%"
        transform="translateX(-50%)"
        bg={color}
        color="#000000"
        px={4}
        py={1}
        borderRadius="50px"
        fontSize="sm"
        fontWeight="900"
        textTransform="uppercase"
      >
        {placeLabels[place]}
      </Box>

      <Stack gap={3} textAlign="center" mt={4}>
        <Text
          fontSize={isFirst ? '8xl' : '6xl'}
          fontWeight="900"
          color={color}
          lineHeight="1"
        >
          {place + 1}
        </Text>

        <Text fontSize={isFirst ? 'xl' : 'lg'} fontWeight="900" color="#FFFFFF" textTransform="uppercase">
          {item.team.name}
        </Text>

        {item.team.projectName && (
          <Text fontSize="sm" color="#B0B0B0">
            {item.team.projectName}
          </Text>
        )}

        <Box
          bg={color}
          color="#000000"
          p={isFirst ? 4 : 3}
          borderRadius="8px"
          mt={2}
        >
          <Text fontSize={isFirst ? '3xl' : '2xl'} fontWeight="900">
            {item.totalScore.toFixed(2)}
          </Text>
          <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
            Баллов
          </Text>
        </Box>

        <Text fontSize="xs" color="#B0B0B0">
          Оценок: {item.ratingsCount}
        </Text>
      </Stack>
    </Box>
  );
};

export const Top3Tab: React.FC<Top3TabProps> = ({ eventId, eventType }) => {
  const config = getEventTypeConfig(eventType);
  const groups = config.top3Groups;
  const [activeGroup, setActiveGroup] = useState<Top3Group>(groups[0]);

  useEffect(() => {
    setActiveGroup(groups[0]);
  }, [eventType, groups]);

  const queryType = GROUP_TO_TYPE[activeGroup];
  const { data, isLoading } = useGetTop3Query({ eventId, type: queryType });

  const items = useMemo(() => {
    const raw = data as Top3Response | Top3Item[] | undefined;
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    if (activeGroup === 'teams') return raw.teams ?? [];
    if (activeGroup === 'participants') return raw.participants ?? [];
    return raw.speakers ?? [];
  }, [activeGroup, data]);

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  return (
    <Stack gap={6}>
      {groups.length > 1 && (
        <HStack>
          <Text fontSize="md" fontWeight="700" color="#B0B0B0">
            Вкладка:
          </Text>
          <RadioGroup
            value={activeGroup}
            onValueChange={(e) => setActiveGroup(e.value as Top3Group)}
          >
            <HStack gap={4}>
              {groups.map((group) => (
                <Radio key={group} value={group}>
                  {GROUP_LABELS[group]}
                </Radio>
              ))}
            </HStack>
          </RadioGroup>
        </HStack>
      )}

      {items.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Недостаточно данных для отображения топ-3
          </Text>
        </Box>
      )}

      {items.length > 0 && (
        <Stack gap={4}>
          <Text fontSize="xl" fontWeight="900" color="#D4FF00" textTransform="uppercase">
            {GROUP_TITLES[activeGroup]}
          </Text>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(3, 1fr)'
            }}
            gap={4}
            alignItems="end"
          >
            {items[1] && <PodiumCard item={items[1]} place={1} />}
            {items[0] && <PodiumCard item={items[0]} place={0} />}
            {items[2] && <PodiumCard item={items[2]} place={2} />}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
};

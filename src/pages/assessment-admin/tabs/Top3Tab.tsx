import React, { useState } from 'react';
import { Box, Grid, HStack, Stack, Text } from '@chakra-ui/react';
import { RadioGroup, Radio } from '../../../components/ui/radio';
import { useGetTop3Query } from '../../../__data__/api';
import type { Top3Item, Top3Response } from '../../../types';

interface Top3TabProps {
  eventId: string;
}

export const Top3Tab: React.FC<Top3TabProps> = ({ eventId }) => {
  // Разделяем расчёт и отображение топ-3 команд и топ-3 участников
  const [activeTab, setActiveTab] = useState<'team' | 'participant'>('team');

  const {
    data: teamsData,
    isLoading: isTeamsLoading
  } = useGetTop3Query({ eventId, type: 'team' });

  const {
    data: participantsData,
    isLoading: isParticipantsLoading
  } = useGetTop3Query({ eventId, type: 'participant' });

  const normalizeTop3 = (data: unknown, mode: 'team' | 'participant'): Top3Item[] => {
    const raw = data as Top3Response | Top3Item[] | undefined;

    if (Array.isArray(raw)) {
      return raw as Top3Item[];
    }

    if (!raw) {
      return [];
    }

    return mode === 'team' ? raw.teams ?? [] : raw.participants ?? [];
  };

  const topTeams: Top3Item[] = normalizeTop3(teamsData, 'team');
  const topParticipants: Top3Item[] = normalizeTop3(participantsData, 'participant');

  const placeColors = ['#D4FF00', '#AFAFAF', '#FF6B00'];
  const placeLabels = ['1 МЕСТО', '2 МЕСТО', '3 МЕСТО'];

  const isLoading = activeTab === 'team' ? isTeamsLoading : isParticipantsLoading;

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  return (
    <Stack gap={6}>
      <HStack>
        <Text fontSize="md" fontWeight="700" color="#B0B0B0">
          Вкладка:
        </Text>
        <RadioGroup
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value as 'team' | 'participant')}
        >
          <HStack gap={4}>
            <Radio value="team">Команды</Radio>
            <Radio value="participant">Участники</Radio>
          </HStack>
        </RadioGroup>
      </HStack>

      {activeTab === 'team' && topTeams.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Недостаточно данных для отображения топ-3
          </Text>
        </Box>
      )}

      {activeTab === 'participant' && topParticipants.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Недостаточно данных для отображения топ-3
          </Text>
        </Box>
      )}

      {activeTab === 'team' && topTeams.length > 0 && (
        <Stack gap={10}>
          <Stack gap={4}>
            <Text fontSize="xl" fontWeight="900" color="#D4FF00" textTransform="uppercase">
              Топ-3 команд
            </Text>
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(3, 1fr)'
              }}
              gap={4}
              alignItems="end"
            >
              {/* 2 место */}
              {topTeams[1] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #AFAFAF"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(175, 175, 175, 0.3)' }}
                  position="relative"
                  minH="250px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#AFAFAF"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                  >
                    2 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="6xl"
                      fontWeight="900"
                      color="#AFAFAF"
                      lineHeight="1"
                    >
                      2
                    </Text>

                    <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topTeams[1].team.name}
                    </Text>

                    {topTeams[1].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topTeams[1].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#AFAFAF"
                      color="#000000"
                      p={3}
                      borderRadius="8px"
                      mt={2}
                    >
                      <Text fontSize="2xl" fontWeight="900">
                        {topTeams[1].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topTeams[1].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}

              {/* 1 место */}
              {topTeams[0] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #D4FF00"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
                  position="relative"
                  minH="300px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#D4FF00"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                    boxShadow="0 0 20px rgba(212, 255, 0, 0.5)"
                  >
                    1 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="8xl"
                      fontWeight="900"
                      color="#D4FF00"
                      lineHeight="1"
                      style={{ textShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
                    >
                      1
                    </Text>

                    <Text fontSize="xl" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topTeams[0].team.name}
                    </Text>

                    {topTeams[0].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topTeams[0].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#D4FF00"
                      color="#000000"
                      p={4}
                      borderRadius="8px"
                      mt={2}
                      boxShadow="0 0 30px rgba(212, 255, 0, 0.3)"
                    >
                      <Text fontSize="3xl" fontWeight="900">
                        {topTeams[0].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topTeams[0].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}

              {/* 3 место */}
              {topTeams[2] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #FF6B00"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(255, 107, 0, 0.3)' }}
                  position="relative"
                  minH="250px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#FF6B00"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                  >
                    3 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="6xl"
                      fontWeight="900"
                      color="#FF6B00"
                      lineHeight="1"
                    >
                      3
                    </Text>

                    <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topTeams[2].team.name}
                    </Text>

                    {topTeams[2].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topTeams[2].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#FF6B00"
                      color="#000000"
                      p={3}
                      borderRadius="8px"
                      mt={2}
                    >
                      <Text fontSize="2xl" fontWeight="900">
                        {topTeams[2].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topTeams[2].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}
            </Grid>
          </Stack>
        </Stack>
      )}

      {activeTab === 'participant' && topParticipants.length > 0 && (
        <Stack gap={10}>
          <Stack gap={4}>
            <Text fontSize="xl" fontWeight="900" color="#D4FF00" textTransform="uppercase">
              Топ-3 участников
            </Text>
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(3, 1fr)'
              }}
              gap={4}
              alignItems="end"
            >
              {/* 2 место */}
              {topParticipants[1] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #AFAFAF"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(175, 175, 175, 0.3)' }}
                  position="relative"
                  minH="250px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#AFAFAF"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                  >
                    2 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="6xl"
                      fontWeight="900"
                      color="#AFAFAF"
                      lineHeight="1"
                    >
                      2
                    </Text>

                    <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topParticipants[1].team.name}
                    </Text>

                    {topParticipants[1].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topParticipants[1].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#AFAFAF"
                      color="#000000"
                      p={3}
                      borderRadius="8px"
                      mt={2}
                    >
                      <Text fontSize="2xl" fontWeight="900">
                        {topParticipants[1].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topParticipants[1].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}

              {/* 1 место */}
              {topParticipants[0] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #D4FF00"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
                  position="relative"
                  minH="300px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#D4FF00"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                    boxShadow="0 0 20px rgba(212, 255, 0, 0.5)"
                  >
                    1 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="8xl"
                      fontWeight="900"
                      color="#D4FF00"
                      lineHeight="1"
                      style={{ textShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
                    >
                      1
                    </Text>

                    <Text fontSize="xl" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topParticipants[0].team.name}
                    </Text>

                    {topParticipants[0].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topParticipants[0].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#D4FF00"
                      color="#000000"
                      p={4}
                      borderRadius="8px"
                      mt={2}
                      boxShadow="0 0 30px rgba(212, 255, 0, 0.3)"
                    >
                      <Text fontSize="3xl" fontWeight="900">
                        {topParticipants[0].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topParticipants[0].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}

              {/* 3 место */}
              {topParticipants[2] && (
                <Box
                  bg="#1F1F1F"
                  p={6}
                  border="3px solid #FF6B00"
                  borderRadius="8px"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(255, 107, 0, 0.3)' }}
                  position="relative"
                  minH="250px"
                >
                  <Box
                    position="absolute"
                    top="-15px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="#FF6B00"
                    color="#000000"
                    px={4}
                    py={1}
                    borderRadius="50px"
                    fontSize="sm"
                    fontWeight="900"
                    textTransform="uppercase"
                  >
                    3 место
                  </Box>

                  <Stack gap={3} textAlign="center" mt={4}>
                    <Text
                      fontSize="6xl"
                      fontWeight="900"
                      color="#FF6B00"
                      lineHeight="1"
                    >
                      3
                    </Text>

                    <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                      {topParticipants[2].team.name}
                    </Text>

                    {topParticipants[2].team.projectName && (
                      <Text fontSize="sm" color="#B0B0B0">
                        {topParticipants[2].team.projectName}
                      </Text>
                    )}

                    <Box
                      bg="#FF6B00"
                      color="#000000"
                      p={3}
                      borderRadius="8px"
                      mt={2}
                    >
                      <Text fontSize="2xl" fontWeight="900">
                        {topParticipants[2].totalScore.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                        Баллов
                      </Text>
                    </Box>

                    <Text fontSize="xs" color="#B0B0B0">
                      Оценок: {topParticipants[2].ratingsCount}
                    </Text>
                  </Stack>
                </Box>
              )}
            </Grid>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};


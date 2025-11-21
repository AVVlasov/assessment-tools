import React from 'react';
import { Box, Stack } from '@chakra-ui/react';
import { Tabs } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { EventHeader } from '../../components/assessment';
import { TeamsTab } from './tabs/TeamsTab';
import { ExpertsTab } from './tabs/ExpertsTab';
import { CriteriaTab } from './tabs/CriteriaTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { Top3Tab } from './tabs/Top3Tab';

export const AssessmentAdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || '';

  return (
    <Box minH="100vh" bg="#0A0A0A">
      <EventHeader />

      <Box maxW="1200px" mx="auto" p={6}>
        <Tabs.Root defaultValue="teams" variant="enclosed">
          <Box
            overflowX={{ base: 'auto', md: 'visible' }}
            overflowY="hidden"
            css={{
              '&::-webkit-scrollbar': {
                height: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: '#0A0A0A'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#D4FF00',
                borderRadius: '4px'
              }
            }}
          >
            <Tabs.List
              bg="#1A1A1A"
              borderBottom="2px solid #333333"
              mb={6}
              whiteSpace="nowrap"
              display="inline-flex"
              minWidth="100%"
            >
            <Tabs.Trigger
              value="teams"
              color="#B0B0B0"
              fontWeight="700"
              textTransform="uppercase"
              fontSize="sm"
              px={6}
              py={3}
              _selected={{
                color: '#0A0A0A',
                bg: '#D4FF00',
                borderBottom: '3px solid #D4FF00'
              }}
            >
              Команды
            </Tabs.Trigger>

            <Tabs.Trigger
              value="experts"
              color="#B0B0B0"
              fontWeight="700"
              textTransform="uppercase"
              fontSize="sm"
              px={6}
              py={3}
              _selected={{
                color: '#0A0A0A',
                bg: '#D4FF00',
                borderBottom: '3px solid #D4FF00'
              }}
            >
              Эксперты
            </Tabs.Trigger>

            <Tabs.Trigger
              value="criteria"
              color="#B0B0B0"
              fontWeight="700"
              textTransform="uppercase"
              fontSize="sm"
              px={6}
              py={3}
              _selected={{
                color: '#0A0A0A',
                bg: '#D4FF00',
                borderBottom: '3px solid #D4FF00'
              }}
            >
              Критерии
            </Tabs.Trigger>

            <Tabs.Trigger
              value="statistics"
              color="#B0B0B0"
              fontWeight="700"
              textTransform="uppercase"
              fontSize="sm"
              px={6}
              py={3}
              _selected={{
                color: '#0A0A0A',
                bg: '#D4FF00',
                borderBottom: '3px solid #D4FF00'
              }}
            >
              Статистика
            </Tabs.Trigger>

            <Tabs.Trigger
              value="top3"
              color="#B0B0B0"
              fontWeight="700"
              textTransform="uppercase"
              fontSize="sm"
              px={6}
              py={3}
              _selected={{
                color: '#0A0A0A',
                bg: '#D4FF00',
                borderBottom: '3px solid #D4FF00'
              }}
            >
              Топ 3
            </Tabs.Trigger>
          </Tabs.List>
          </Box>

          <Stack gap={6}>
            <Tabs.Content value="teams">
              <TeamsTab eventId={eventId} />
            </Tabs.Content>

            <Tabs.Content value="experts">
              <ExpertsTab eventId={eventId} />
            </Tabs.Content>

            <Tabs.Content value="criteria">
              <CriteriaTab eventId={eventId} />
            </Tabs.Content>

            <Tabs.Content value="statistics">
              <StatisticsTab eventId={eventId} />
            </Tabs.Content>

            <Tabs.Content value="top3">
              <Top3Tab eventId={eventId} />
            </Tabs.Content>
          </Stack>
        </Tabs.Root>
      </Box>
    </Box>
  );
};

export default AssessmentAdminPage;


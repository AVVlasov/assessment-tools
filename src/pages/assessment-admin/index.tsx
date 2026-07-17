import React, { useState } from 'react'
import { Box, Flex, Text, Spinner } from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BrandMark, GradientButton, Pill } from '../../components/tehnohub'
import { thColors } from '../../theme'
import { useGetEventQuery, useToggleVotingMutation } from '../../__data__/api'
import { useGetListenerStatsQuery } from '../../__data__/api/listenerApi'
import { getEventTypeConfig } from '../../utils/eventTypeConfig'
import { t } from '../../utils/locale'
import { TeamsTab } from './tabs/TeamsTab'
import { ExpertsTab } from './tabs/ExpertsTab'
import { CriteriaTab } from './tabs/CriteriaTab'
import { StatisticsTab } from './tabs/StatisticsTab'
import { Top3Tab } from './tabs/Top3Tab'
import { HallsTab } from './tabs/HallsTab'
import { ConferenceSpeakersTab } from './tabs/ConferenceSpeakersTab'
import { ListenerStatsTab } from './tabs/ListenerStatsTab'
import { Switch } from '../../components/ui/switch'

const TAB_LABELS: Record<string, string> = {
  'tabs.teams': 'Команды',
  'tabs.participants': 'Участницы',
  'tabs.speakers': 'Спикеры',
}

export const AssessmentAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') || ''
  const { data: event, isLoading } = useGetEventQuery(eventId, { skip: !eventId })
  const config = getEventTypeConfig(event?.eventType)
  const isConference = event?.eventType === 'conference'
  const [tab, setTab] = useState(isConference ? 'halls' : 'teams')
  const [toggleVoting] = useToggleVotingMutation()
  const { data: listenerStats } = useGetListenerStatsQuery(
    { eventId },
    { skip: !eventId || !isConference, pollingInterval: 8000 }
  )

  React.useEffect(() => {
    setTab(isConference ? 'halls' : 'teams')
  }, [isConference, eventId])

  if (!eventId) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Text color="#FF6B6B">Мероприятие не выбрано</Text>
      </Flex>
    )
  }

  if (isLoading || !event) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Spinner color={thColors.green} size="xl" />
      </Flex>
    )
  }

  const conferenceTabs = [
    { id: 'halls', label: t('tabs.halls') },
    { id: 'speakers', label: t('tabs.speakersSchedule') },
    { id: 'stats', label: t('tabs.listenerStats') },
    { id: 'criteria', label: t('tabs.criteria') },
  ]

  const classicTabs = [
    { id: 'teams', label: TAB_LABELS[config.contestantsTabKey] || 'Команды' },
    { id: 'experts', label: t('tabs.experts') },
    { id: 'criteria', label: 'Критерии' },
    { id: 'statistics', label: 'Статистика' },
    { id: 'top3', label: t('tabs.top3') },
  ]

  const tabs = isConference ? conferenceTabs : classicTabs

  return (
    <Box minH="100vh" bg={thColors.bg} color="white">
      <Box
        maxW="1280px"
        mx="auto"
        bgImage={thColors.gradientAdmin}
        px={{ base: '16px', md: '30px' }}
        pt="20px"
        pb="20px"
        borderRadius="0 0 26px 26px"
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap="12px" mb="14px">
          <Flex align="center" gap="12px" flexWrap="wrap">
            <GradientButton
              variant="ghost"
              h="34px"
              fontSize="12px"
              onClick={() => navigate('/assessment-tools')}
            >
              ← Назад
            </GradientButton>
            <BrandMark />
            <Text fontFamily="heading" fontSize="19px" fontWeight="700" letterSpacing="-0.5px">
              {isConference ? t('admin.consoleTitle') : event.name}
            </Text>
          </Flex>
          <Flex gap="8px" align="center" flexWrap="wrap">
            {isConference ? (
              <Pill variant="outline" dot>
                {listenerStats?.totalRatings ?? 0} {t('admin.ratingsToday')}
              </Pill>
            ) : (
              <Flex align="center" gap="10px">
                <Text fontSize="12px" color={thColors.textDim}>
                  {t('header.voting')}
                </Text>
                <Switch
                  checked={event.votingEnabled}
                  onCheckedChange={() => toggleVoting(eventId)}
                />
              </Flex>
            )}
          </Flex>
        </Flex>

        {!isConference && (
          <Text fontSize="14px" color={thColors.textDim} mb="12px">
            {event.name}
          </Text>
        )}

        <Flex gap="6px" flexWrap="wrap">
          {tabs.map((tb) => (
            <GradientButton
              key={tb.id}
              h="34px"
              px="17px"
              fontSize="12.5px"
              variant={tab === tb.id ? 'primary' : 'ghost'}
              bg={tab === tb.id ? 'white' : undefined}
              color={tab === tb.id ? thColors.surface : 'rgba(255,255,255,0.8)'}
              boxShadow="none"
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </GradientButton>
          ))}
        </Flex>
      </Box>

      <Box maxW="1280px" mx="auto" px={{ base: '16px', md: '30px' }} py="22px">
        {isConference && tab === 'halls' && <HallsTab eventId={eventId} />}
        {isConference && tab === 'speakers' && <ConferenceSpeakersTab eventId={eventId} />}
        {isConference && tab === 'stats' && <ListenerStatsTab eventId={eventId} />}
        {isConference && tab === 'criteria' && (
          <CriteriaTab eventId={eventId} eventType={event.eventType || 'conference'} />
        )}

        {!isConference && tab === 'teams' && (
          <TeamsTab eventId={eventId} eventType={event.eventType || 'hackathon'} />
        )}
        {!isConference && tab === 'experts' && <ExpertsTab eventId={eventId} />}
        {!isConference && tab === 'criteria' && (
          <CriteriaTab eventId={eventId} eventType={event.eventType || 'hackathon'} />
        )}
        {!isConference && tab === 'statistics' && (
          <StatisticsTab eventId={eventId} eventType={event.eventType || 'hackathon'} />
        )}
        {!isConference && tab === 'top3' && (
          <Top3Tab eventId={eventId} eventType={event.eventType || 'hackathon'} />
        )}
      </Box>
    </Box>
  )
}

export default AssessmentAdminPage

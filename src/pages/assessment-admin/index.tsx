import React from 'react'
import { Box, Flex, Text, Spinner } from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GradientButton, Pill } from '../../components/tehnohub'
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
import { ConferenceCriteriaTab } from './tabs/ConferenceCriteriaTab'
import { ListenerStatsTab } from './tabs/ListenerStatsTab'
import { ReadyTab } from './tabs/ReadyTab'
import { Switch } from '../../components/ui/switch'

const TAB_LABELS: Record<string, string> = {
  'tabs.teams': 'Команды',
  'tabs.participants': 'Участницы',
  'tabs.speakers': 'Спикеры',
}

const CONFERENCE_TAB_IDS = ['halls', 'speakers', 'criteria', 'stats', 'ready']
const CLASSIC_TAB_IDS = ['teams', 'experts', 'criteria', 'statistics', 'top3']

export const AssessmentAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') || ''
  const tabFromUrl = searchParams.get('tab') || ''
  const { data: event, isLoading } = useGetEventQuery(eventId, { skip: !eventId })
  const config = getEventTypeConfig(event?.eventType)
  const isConference = event?.eventType === 'conference'
  const [toggleVoting] = useToggleVotingMutation()
  const { data: listenerStats } = useGetListenerStatsQuery(
    { eventId },
    { skip: !eventId || !isConference, pollingInterval: 15000 }
  )

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
    { id: 'criteria', label: t('tabs.criteriaShort') },
    { id: 'stats', label: t('tabs.listenerStats') },
    { id: 'ready', label: t('tabs.ready') },
  ]

  const classicTabs = [
    { id: 'teams', label: TAB_LABELS[config.contestantsTabKey] || 'Команды' },
    { id: 'experts', label: t('tabs.experts') },
    { id: 'criteria', label: t('tabs.criteriaShort') },
    { id: 'statistics', label: t('tabs.listenerStats') },
    { id: 'top3', label: t('tabs.top3') },
  ]

  const tabs = isConference ? conferenceTabs : classicTabs
  const validTabIds = isConference ? CONFERENCE_TAB_IDS : CLASSIC_TAB_IDS
  const defaultTab = isConference ? 'halls' : 'teams'
  const tab = validTabIds.includes(tabFromUrl) ? tabFromUrl : defaultTab

  const selectTab = (id: string): void => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  return (
    <Box minH="100vh" bg={thColors.bg} color="white">
      <Box
        maxW="1280px"
        mx="auto"
        bgImage={thColors.gradientAdmin}
        px={{ base: '16px', md: '30px' }}
        pt="20px"
        pb="20px"
        borderRadius="0 0 18px 18px"
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap="12px">
          <Flex align="center" gap="12px" flexWrap="wrap">
            {!isConference && (
              <GradientButton
                variant="ghost"
                h="34px"
                fontSize="12px"
                onClick={() => navigate('/assessment-tools')}
              >
                {t('common.back')}
              </GradientButton>
            )}
            <Text fontFamily="heading" fontSize="19px" fontWeight="700" letterSpacing="-0.5px">
              {isConference ? t('admin.consoleTitle') : event.name}
            </Text>
            <Flex gap="6px" flexWrap="wrap">
              {tabs.map((tb) => (
                <GradientButton
                  key={tb.id}
                  h="34px"
                  px="17px"
                  fontSize="12.5px"
                  fontWeight="600"
                  variant={tab === tb.id ? 'primary' : 'ghost'}
                  boxShadow={tab === tb.id ? 'none' : undefined}
                  onClick={() => selectTab(tb.id)}
                >
                  {tb.label}
                </GradientButton>
              ))}
            </Flex>
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
          <Text fontSize="14px" color={thColors.textDim} mt="12px">
            {event.name}
          </Text>
        )}
      </Box>

      <Box maxW="1280px" mx="auto" px={{ base: '16px', md: '30px' }} py="22px">
        {isConference && tab === 'halls' && <HallsTab eventId={eventId} />}
        {isConference && tab === 'speakers' && <ConferenceSpeakersTab eventId={eventId} />}
        {isConference && tab === 'stats' && <ListenerStatsTab eventId={eventId} />}
        {isConference && tab === 'criteria' && <ConferenceCriteriaTab eventId={eventId} />}
        {isConference && tab === 'ready' && <ReadyTab eventId={eventId} />}

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

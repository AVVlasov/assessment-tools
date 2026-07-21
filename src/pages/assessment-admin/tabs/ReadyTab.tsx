import React, { useMemo, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { AvatarInitials, GradientButton, Pill } from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import { useGetHallsQuery, useGetTeamsQuery, useUpdateTeamMutation } from '../../../__data__/api'
import type { SpeakerFormat, SpeakerReadiness, Team } from '../../../types'
import { t } from '../../../utils/locale'
import { ReadyChecklistsPanel } from './ReadyChecklistsPanel'

interface Props {
  eventId: string
}

type ReadySub = 'board' | 'checklists'

interface RehModalState {
  teamId: string
  name: string
  talk: string
  hall: string
  format: SpeakerFormat
  date: string
  time: string | null
}

const emptyReadiness = (): SpeakerReadiness => ({
  rehearsal: { date: '', time: '', place: '', status: 'none' },
  calendarSet: false,
  deckStatus: 'none',
  approval: 'pending',
})

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

const CAL_TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const formatDayLabel = (d: Date): string => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`

const buildCalDays = (): string[] => {
  const base = new Date()
  return [-1, 0, 1].map((offset) => {
    const d = new Date(base)
    d.setDate(base.getDate() + offset)
    return formatDayLabel(d)
  })
}

const formatLabel = (fmt?: string): string => {
  if (fmt === 'panel') return t('admin.formatPanel')
  if (fmt === 'workshop') return t('admin.formatWorkshop')
  return t('admin.formatTalk')
}

const formatColor = (fmt?: string): string => {
  if (fmt === 'panel') return '#B18CFF'
  if (fmt === 'workshop') return '#FFB020'
  return '#4FC9F0'
}

const speakerNames = (sp: Team): string[] =>
  [sp.name, ...(Array.isArray(sp.coSpeakers) ? sp.coSpeakers : [])].filter(Boolean)

const readinessOf = (sp: Team): SpeakerReadiness => {
  const r = sp.readiness
  if (!r) return emptyReadiness()
  return {
    rehearsal: {
      date: r.rehearsal?.date || '',
      time: r.rehearsal?.time || '',
      place: r.rehearsal?.place || '',
      status: r.rehearsal?.status === 'passed' || r.rehearsal?.status === 'scheduled'
        ? r.rehearsal.status
        : 'none',
    },
    calendarSet: !!r.calendarSet,
    deckStatus: r.deckStatus === 'uploaded' ? 'uploaded' : 'none',
    approval: r.approval === 'approved' ? 'approved' : 'pending',
  }
}

const countReady = (sp: Team): { done: boolean; cnt: number; panel: boolean } => {
  if (sp.format === 'panel') return { done: true, cnt: 4, panel: true }
  const d = readinessOf(sp)
  const cnt =
    (d.rehearsal.status === 'passed' ? 1 : 0) +
    (d.calendarSet ? 1 : 0) +
    (d.deckStatus === 'uploaded' ? 1 : 0) +
    (d.approval === 'approved' ? 1 : 0)
  return { done: cnt === 4, cnt, panel: false }
}

export const ReadyTab: React.FC<Props> = ({ eventId }) => {
  const { data: halls = [], refetch: refetchHalls } = useGetHallsQuery(eventId)
  const { data: teams = [], refetch: refetchTeams } = useGetTeamsQuery({ eventId, type: 'speaker' })
  const [updateTeam] = useUpdateTeamMutation()
  const [readySub, setReadySub] = useState<ReadySub>('board')
  const [rehModal, setRehModal] = useState<RehModalState | null>(null)
  const calDays = useMemo(() => buildCalDays(), [])

  const refresh = (): void => {
    void refetchHalls()
    void refetchTeams()
  }

  const patchReadiness = async (teamId: string, patch: Partial<SpeakerReadiness>): Promise<void> => {
    const sp = teams.find((tm) => tm._id === teamId)
    if (!sp) return
    const next = { ...readinessOf(sp), ...patch }
    if (patch.rehearsal) {
      next.rehearsal = { ...readinessOf(sp).rehearsal, ...patch.rehearsal }
    }
    await updateTeam({ id: teamId, data: { readiness: next } })
    refresh()
  }

  const speakersByHall = useMemo(() => {
    const map: Record<string, Team[]> = {}
    halls.forEach((h) => {
      map[h._id] = []
    })
    teams.forEach((sp) => {
      const key = sp.hallId || ''
      if (!map[key]) map[key] = []
      map[key].push(sp)
    })
    Object.values(map).forEach((list) => {
      list.sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0) ||
          String(a.scheduledTime || '').localeCompare(String(b.scheduledTime || ''))
      )
    })
    return map
  }, [halls, teams])

  const { readyDone, readyTotal } = useMemo(() => {
    let done = 0
    let total = 0
    teams.forEach((sp) => {
      total += 1
      if (countReady(sp).done) done += 1
    })
    return { readyDone: done, readyTotal: total }
  }, [teams])

  const readyPct = readyTotal ? Math.round((readyDone / readyTotal) * 100) : 0

  const occupiedSlots = useMemo(() => {
    const occ: Record<string, string> = {}
    if (!rehModal) return occ
    const hall = halls.find((h) => h.name === rehModal.hall)
    const list = hall ? speakersByHall[hall._id] || [] : []
    list.forEach((sp) => {
      if (sp._id === rehModal.teamId) return
      const d = readinessOf(sp)
      if (d.rehearsal.date && d.rehearsal.time) {
        occ[`${d.rehearsal.date}|${d.rehearsal.time}`] = sp.name
      }
    })
    return occ
  }, [rehModal, halls, speakersByHall])

  const openSchedule = (sp: Team, hallName: string): void => {
    const d = readinessOf(sp)
    setRehModal({
      teamId: sp._id,
      name: speakerNames(sp).join(' + '),
      talk: sp.projectName || '',
      hall: hallName,
      format: sp.format === 'panel' || sp.format === 'workshop' ? sp.format : 'talk',
      date: d.rehearsal.date || calDays[1] || calDays[0],
      time: d.rehearsal.time || null,
    })
  }

  const saveRehearsal = async (): Promise<void> => {
    if (!rehModal?.time) return
    const sp = teams.find((tm) => tm._id === rehModal.teamId)
    if (!sp) return
    await patchReadiness(rehModal.teamId, {
      rehearsal: {
        date: rehModal.date,
        time: rehModal.time,
        place: rehModal.hall,
        status: 'scheduled',
      },
    })
    setRehModal(null)
  }

  return (
    <Box>
      <Flex gap="8px" mb="18px" flexWrap="wrap">
        <GradientButton
          h="36px"
          px="18px"
          fontSize="13px"
          fontWeight="600"
          variant={readySub === 'board' ? 'primary' : 'ghost'}
          boxShadow="none"
          onClick={() => setReadySub('board')}
        >
          {t('admin.readySubBoard')}
        </GradientButton>
        <GradientButton
          h="36px"
          px="18px"
          fontSize="13px"
          fontWeight="600"
          variant={readySub === 'checklists' ? 'primary' : 'ghost'}
          boxShadow="none"
          onClick={() => setReadySub('checklists')}
        >
          {t('admin.readySubChecklists')}
        </GradientButton>
      </Flex>

      {readySub === 'checklists' && <ReadyChecklistsPanel eventId={eventId} />}

      {readySub === 'board' && (
      <>
      <Flex
        align="center"
        gap="16px"
        bg={thColors.card}
        border={`1px solid ${thColors.border}`}
        borderRadius="12px"
        px="18px"
        py="14px"
        mb="18px"
        flexWrap="wrap"
      >
        <Box flex="1" minW="160px">
          <Text fontSize="13px" fontWeight="700">
            {t('admin.readyTitle')}
          </Text>
          <Text fontSize="11.5px" color={thColors.textFaint} mt="2px">
            {`${readyDone} ${t('admin.readyOf')} ${readyTotal} ${t('admin.readySummaryTail')}`}
          </Text>
        </Box>
        <Box
          w={{ base: '100%', md: '220px' }}
          h="6px"
          bg="rgba(255,255,255,0.1)"
          borderRadius="3px"
          overflow="hidden"
        >
          <Box w={`${readyPct}%`} h="100%" bg={thColors.gradientGreen} />
        </Box>
        <Text fontSize="15px" fontWeight="800" color={thColors.greenLight}>
          {readyDone} / {readyTotal}
        </Text>
      </Flex>

      <Flex direction="column" gap="18px">
        {halls.map((h) => {
          const talks = speakersByHall[h._id] || []
          if (!talks.length) return null
          return (
            <Box key={h._id}>
              <Flex align="center" gap="9px" px="2px" mb="10px">
                <Box w="10px" h="10px" borderRadius="50%" bg={h.color || '#4FC9F0'} />
                <Text fontSize="14px" fontWeight="800">
                  {h.name}
                </Text>
              </Flex>
              <Flex direction="column" gap="10px">
                {talks.map((sp) => {
                  const names = speakerNames(sp)
                  const d = readinessOf(sp)
                  const { done, cnt, panel } = countReady(sp)
                  const isWs = sp.format === 'workshop'
                  const rehPassed = d.rehearsal.status === 'passed'
                  const rehScheduled = d.rehearsal.status === 'scheduled'
                  const deckUp = d.deckStatus === 'uploaded'
                  const fmt = sp.format || 'talk'
                  const fc = formatColor(fmt)

                  return (
                    <Box
                      key={sp._id}
                      bg={thColors.card}
                      border={
                        panel
                          ? '1px solid rgba(177,140,255,0.3)'
                          : done
                            ? '1px solid rgba(61,220,80,0.4)'
                            : `1px solid ${thColors.border}`
                      }
                      borderRadius="14px"
                      p="16px 18px"
                    >
                      <Flex align="center" gap="13px" flexWrap="wrap">
                        <Flex flexShrink={0} pl="8px">
                          {names.map((nm, i) => (
                            <AvatarInitials
                              key={`${nm}-${i}`}
                              name={nm}
                              size={38}
                              live={false}
                              ml={i ? '-8px' : 0}
                              border="2px solid #141C24"
                            />
                          ))}
                        </Flex>
                        <Box minW={0} flex="1">
                          <Text fontSize="14px" fontWeight="700" truncate>
                            {sp.projectName || '—'}
                          </Text>
                          <Text fontSize="11.5px" color={thColors.textFaint} mt="2px">
                            {names.join(' + ')} · {sp.scheduledTime || '—'}
                          </Text>
                        </Box>
                        <Pill
                          fontSize="11px"
                          fontWeight="600"
                          border={`1px solid ${fc}`}
                          color={fc}
                          bg="transparent"
                          flexShrink={0}
                        >
                          {formatLabel(fmt)}
                        </Pill>
                        <Flex
                          minW="44px"
                          h="28px"
                          px="11px"
                          borderRadius="30px"
                          align="center"
                          justify="center"
                          fontSize="11.5px"
                          fontWeight="800"
                          flexShrink={0}
                          bg={
                            panel
                              ? 'rgba(177,140,255,0.14)'
                              : done
                                ? 'linear-gradient(180deg,#4BE96A,#1FA53E)'
                                : 'rgba(255,255,255,0.06)'
                          }
                          border={
                            panel
                              ? '1px solid rgba(177,140,255,0.4)'
                              : done
                                ? 'none'
                                : '1px solid rgba(255,255,255,0.15)'
                          }
                          color={panel ? '#B18CFF' : done ? '#04220C' : 'rgba(255,255,255,0.5)'}
                        >
                          {panel ? t('admin.readyNotNeeded') : done ? '✓' : `${cnt}/4`}
                        </Flex>
                      </Flex>

                      {panel ? (
                        <Text
                          fontSize="11.5px"
                          color="rgba(255,255,255,0.4)"
                          bg={thColors.surface}
                          borderRadius="10px"
                          px="13px"
                          py="11px"
                          mt="14px"
                          lineHeight="1.45"
                        >
                          {t('admin.readyPanelNote')}
                        </Text>
                      ) : (
                        <Flex gap="10px" flexWrap="wrap" mt="14px">
                          <Box
                            flex="1"
                            minW="210px"
                            bg={thColors.surface}
                            borderRadius="10px"
                            p="11px 13px"
                          >
                            <Text
                              fontSize="10px"
                              color="rgba(255,255,255,0.4)"
                              fontWeight="700"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                              mb="8px"
                            >
                              {isWs ? t('admin.readyTechReh') : t('admin.readyGenReh')}
                            </Text>
                            <Flex align="center" gap="7px" flexWrap="wrap">
                              {!d.rehearsal.date && (
                                <GradientButton
                                  h="30px"
                                  px="13px"
                                  fontSize="11px"
                                  fontWeight="600"
                                  variant="ghost"
                                  color={thColors.cyanLight}
                                  border="1.5px dashed rgba(0,174,239,0.5)"
                                  onClick={() => openSchedule(sp, h.name)}
                                >
                                  {t('admin.readyPickSlot')}
                                </GradientButton>
                              )}
                              {rehScheduled && (
                                <>
                                  <Pill
                                    as="button"
                                    type="button"
                                    fontSize="11px"
                                    fontWeight="600"
                                    border="1px solid rgba(0,174,239,0.6)"
                                    color={thColors.cyanLight}
                                    bg="transparent"
                                    cursor="pointer"
                                    title={t('admin.readyReschedule')}
                                    onClick={() => openSchedule(sp, h.name)}
                                  >
                                    {d.rehearsal.date} · {d.rehearsal.time}
                                  </Pill>
                                  <GradientButton
                                    h="28px"
                                    px="11px"
                                    fontSize="10.5px"
                                    fontWeight="600"
                                    variant="ghost"
                                    color={thColors.greenLight}
                                    borderColor="rgba(61,220,80,0.5)"
                                    onClick={() =>
                                      void patchReadiness(sp._id, {
                                        rehearsal: { ...d.rehearsal, status: 'passed' },
                                      })
                                    }
                                  >
                                    {t('admin.readyPassed')}
                                  </GradientButton>
                                </>
                              )}
                              {rehPassed && (
                                <Pill
                                  fontSize="11px"
                                  fontWeight="600"
                                  border="1px solid rgba(61,220,80,0.5)"
                                  bg="rgba(61,220,80,0.1)"
                                  color={thColors.greenLight}
                                  display="inline-flex"
                                  alignItems="center"
                                  gap="6px"
                                >
                                  <Box as="span" w="6px" h="6px" borderRadius="50%" bg={thColors.green} />
                                  {t('admin.readyPassed')} · {d.rehearsal.date} · {d.rehearsal.time}
                                </Pill>
                              )}
                            </Flex>
                            {isWs && (
                              <Text fontSize="10px" color="rgba(255,176,32,0.85)" lineHeight="1.4" mt="8px">
                                {t('admin.readyWsNote')}
                              </Text>
                            )}
                          </Box>

                          <Box
                            flex="1"
                            minW="190px"
                            bg={thColors.surface}
                            borderRadius="10px"
                            p="11px 13px"
                          >
                            <Text
                              fontSize="10px"
                              color="rgba(255,255,255,0.4)"
                              fontWeight="700"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                              mb="8px"
                            >
                              {t('admin.readyCalendar')}
                            </Text>
                            <Flex align="center" gap="7px" flexWrap="wrap">
                              {!d.rehearsal.date || d.rehearsal.status === 'none' ? (
                                <Text fontSize="11px" color="rgba(255,255,255,0.35)">
                                  {t('admin.readyCalLocked')}
                                </Text>
                              ) : d.calendarSet ? (
                                <>
                                  <Pill
                                    fontSize="11px"
                                    fontWeight="600"
                                    border="1px solid rgba(61,220,80,0.5)"
                                    bg="rgba(61,220,80,0.1)"
                                    color={thColors.greenLight}
                                    display="inline-flex"
                                    alignItems="center"
                                    gap="6px"
                                  >
                                    <Box as="span" w="6px" h="6px" borderRadius="50%" bg={thColors.green} />
                                    {t('admin.readyCalSet')}
                                  </Pill>
                                  <GradientButton
                                    h="26px"
                                    px="8px"
                                    fontSize="10.5px"
                                    fontWeight="600"
                                    variant="ghost"
                                    border="none"
                                    color="rgba(255,255,255,0.4)"
                                    onClick={() => void patchReadiness(sp._id, { calendarSet: false })}
                                  >
                                    {t('admin.readyRemove')}
                                  </GradientButton>
                                </>
                              ) : (
                                <GradientButton
                                  h="30px"
                                  px="13px"
                                  fontSize="11px"
                                  fontWeight="600"
                                  variant="ghost"
                                  onClick={() => void patchReadiness(sp._id, { calendarSet: true })}
                                >
                                  {t('admin.readyCalMark')}
                                </GradientButton>
                              )}
                            </Flex>
                          </Box>

                          <Box
                            flex="1"
                            minW="170px"
                            bg={thColors.surface}
                            borderRadius="10px"
                            p="11px 13px"
                          >
                            <Text
                              fontSize="10px"
                              color="rgba(255,255,255,0.4)"
                              fontWeight="700"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                              mb="8px"
                            >
                              {t('admin.readyDeck')}
                            </Text>
                            <Flex align="center" gap="7px" flexWrap="wrap">
                              {deckUp ? (
                                <>
                                  <Pill
                                    fontSize="11px"
                                    fontWeight="600"
                                    border="1px solid rgba(61,220,80,0.5)"
                                    bg="rgba(61,220,80,0.1)"
                                    color={thColors.greenLight}
                                    display="inline-flex"
                                    alignItems="center"
                                    gap="6px"
                                  >
                                    <Box as="span" w="6px" h="6px" borderRadius="50%" bg={thColors.green} />
                                    {t('admin.readyDeckUp')}
                                  </Pill>
                                  <GradientButton
                                    h="26px"
                                    px="8px"
                                    fontSize="10.5px"
                                    fontWeight="600"
                                    variant="ghost"
                                    border="none"
                                    color="rgba(255,255,255,0.4)"
                                    onClick={() =>
                                      void patchReadiness(sp._id, {
                                        deckStatus: 'none',
                                        approval: 'pending',
                                      })
                                    }
                                  >
                                    {t('admin.readyRemove')}
                                  </GradientButton>
                                </>
                              ) : (
                                <GradientButton
                                  h="30px"
                                  px="13px"
                                  fontSize="11px"
                                  fontWeight="600"
                                  variant="ghost"
                                  border="1.5px dashed rgba(255,255,255,0.28)"
                                  color="rgba(255,255,255,0.6)"
                                  onClick={() => void patchReadiness(sp._id, { deckStatus: 'uploaded' })}
                                >
                                  {t('admin.readyDeckWait')}
                                </GradientButton>
                              )}
                            </Flex>
                          </Box>

                          <Box
                            flex="1"
                            minW="190px"
                            bg={thColors.surface}
                            borderRadius="10px"
                            p="11px 13px"
                          >
                            <Text
                              fontSize="10px"
                              color="rgba(255,255,255,0.4)"
                              fontWeight="700"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                              mb="8px"
                            >
                              {t('admin.readyApproval')}
                            </Text>
                            <Flex align="center" gap="7px" flexWrap="wrap">
                              {!deckUp ? (
                                <Text fontSize="11px" color="rgba(255,255,255,0.35)">
                                  {t('admin.readyApprLocked')}
                                </Text>
                              ) : d.approval === 'approved' ? (
                                <>
                                  <Pill
                                    fontSize="11px"
                                    fontWeight="600"
                                    border="1px solid rgba(61,220,80,0.5)"
                                    bg="rgba(61,220,80,0.1)"
                                    color={thColors.greenLight}
                                    display="inline-flex"
                                    alignItems="center"
                                    gap="6px"
                                  >
                                    <Box as="span" w="6px" h="6px" borderRadius="50%" bg={thColors.green} />
                                    {t('admin.readyApprOk')}
                                  </Pill>
                                  <GradientButton
                                    h="26px"
                                    px="8px"
                                    fontSize="10.5px"
                                    fontWeight="600"
                                    variant="ghost"
                                    border="none"
                                    color="rgba(255,255,255,0.4)"
                                    onClick={() => void patchReadiness(sp._id, { approval: 'pending' })}
                                  >
                                    {t('admin.readyRevoke')}
                                  </GradientButton>
                                </>
                              ) : (
                                <GradientButton
                                  h="30px"
                                  px="14px"
                                  fontSize="11px"
                                  fontWeight="600"
                                  variant="ghost"
                                  onClick={() => void patchReadiness(sp._id, { approval: 'approved' })}
                                >
                                  {t('admin.readyApprove')}
                                </GradientButton>
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                      )}
                    </Box>
                  )
                })}
              </Flex>
            </Box>
          )
        })}
        {!teams.length && (
          <Text color={thColors.textFaint}>{t('admin.readyEmpty')}</Text>
        )}
      </Flex>
      </>
      )}

      {rehModal && (
        <Flex
          position="fixed"
          inset={0}
          bg="rgba(2,6,10,0.85)"
          zIndex={100}
          align="center"
          justify="center"
          p="30px"
          backdropFilter="blur(6px)"
          onClick={() => setRehModal(null)}
        >
          <Box
            w="560px"
            maxW="100%"
            bg={thColors.card}
            border={`1px solid ${thColors.border}`}
            borderRadius="18px"
            p="24px"
            boxShadow="0 40px 100px rgba(0,0,0,0.7)"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="flex-start" gap="12px" mb="16px">
              <Box minW={0}>
                <Text fontFamily="heading" fontSize="16px" fontWeight="700" letterSpacing="-0.3px">
                  {rehModal.format === 'workshop' ? t('admin.readyTechReh') : t('admin.readyGenReh')}
                </Text>
                <Text fontSize="12.5px" color="rgba(255,255,255,0.55)" mt="4px">
                  {rehModal.talk} · {rehModal.name}
                </Text>
              </Box>
              <Pill fontSize="11.5px" fontWeight="600" flexShrink={0} whiteSpace="nowrap">
                {t('admin.readyHallByProgram')} · {rehModal.hall}
              </Pill>
            </Flex>

            {rehModal.format === 'workshop' && (
              <Box
                bg="rgba(255,176,32,0.1)"
                border="1px solid rgba(255,176,32,0.4)"
                borderRadius="10px"
                px="13px"
                py="10px"
                fontSize="11.5px"
                color="#FFC24B"
                fontWeight="600"
                lineHeight="1.45"
                mb="16px"
              >
                {t('admin.readyWsModalNote')}
              </Box>
            )}

            <Flex gap="7px" flexWrap="wrap" mb="16px">
              {calDays.map((day) => (
                <GradientButton
                  key={day}
                  h="34px"
                  px="16px"
                  fontSize="12.5px"
                  fontWeight="600"
                  variant={rehModal.date === day ? 'primary' : 'ghost'}
                  boxShadow="none"
                  onClick={() => setRehModal((m) => (m ? { ...m, date: day, time: null } : m))}
                >
                  {day}
                </GradientButton>
              ))}
            </Flex>

            <Text
              fontSize="10.5px"
              color="rgba(255,255,255,0.45)"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.5px"
              mb="8px"
            >
              {t('admin.readySlots')}
            </Text>
            <Box display="grid" gridTemplateColumns="repeat(3,1fr)" gap="8px" mb="16px">
              {CAL_TIMES.map((time) => {
                const takenBy = occupiedSlots[`${rehModal.date}|${time}`]
                const selected = rehModal.time === time
                return (
                  <Box
                    key={time}
                    as="button"
                    type="button"
                    disabled={!!takenBy}
                    onClick={() =>
                      !takenBy && setRehModal((m) => (m ? { ...m, time } : m))
                    }
                    bg={
                      takenBy
                        ? 'rgba(255,255,255,0.03)'
                        : selected
                          ? thColors.gradientGreen
                          : thColors.surface
                    }
                    border={
                      takenBy
                        ? '1px solid rgba(255,255,255,0.06)'
                        : selected
                          ? '1px solid transparent'
                          : '1px solid rgba(255,255,255,0.14)'
                    }
                    color={
                      takenBy
                        ? 'rgba(255,255,255,0.3)'
                        : selected
                          ? '#fff'
                          : 'rgba(255,255,255,0.85)'
                    }
                    borderRadius="10px"
                    px="8px"
                    py="9px"
                    textAlign="center"
                    cursor={takenBy ? 'not-allowed' : 'pointer'}
                    opacity={takenBy ? 0.7 : 1}
                  >
                    <Text fontSize="13px" fontWeight="700">
                      {time}
                    </Text>
                    <Text
                      fontSize="9.5px"
                      mt="2px"
                      color={
                        takenBy
                          ? 'rgba(255,255,255,0.28)'
                          : selected
                            ? 'rgba(255,255,255,0.85)'
                            : 'rgba(255,255,255,0.4)'
                      }
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {takenBy
                        ? `${t('admin.readyBusy')} · ${takenBy.split(' ')[0]}`
                        : selected
                          ? t('admin.readySelected')
                          : t('admin.readyFree')}
                    </Text>
                  </Box>
                )
              })}
            </Box>

            <Flex align="center" gap="10px">
              <Text flex="1" fontSize="12px" color="rgba(255,255,255,0.6)">
                {t('admin.readyPicked')}:{' '}
                <Text as="span" color={thColors.greenLight} fontWeight="700">
                  {rehModal.time
                    ? `${rehModal.date} · ${rehModal.time}`
                    : t('admin.readyNotPicked')}
                </Text>
              </Text>
              <GradientButton h="44px" px="20px" variant="ghost" onClick={() => setRehModal(null)}>
                {t('common.cancel')}
              </GradientButton>
              <GradientButton
                h="44px"
                px="22px"
                disabled={!rehModal.time}
                opacity={rehModal.time ? 1 : 0.45}
                onClick={() => void saveRehearsal()}
              >
                {t('admin.readyAssign')}
              </GradientButton>
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  )
}

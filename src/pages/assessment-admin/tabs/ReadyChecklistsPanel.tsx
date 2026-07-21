import React, { useEffect, useMemo } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { thColors } from '../../../theme'
import {
  useCreateChecklistMutation,
  useGetChecklistsQuery,
  useGetTeamsQuery,
  useUpdateChecklistMutation,
} from '../../../__data__/api'
import type {
  ReadinessChecklist,
  ReadinessChecklistType,
  ReadinessWidgetKey,
  SpeakerFormat,
  Team,
} from '../../../types'
import { READINESS_WIDGETS } from '../../../types'
import { t } from '../../../utils/locale'

interface Props {
  eventId: string
}

const TYPE_CARDS: Array<{ type: ReadinessChecklistType; titleKey: string; hintKey: string }> = [
  { type: 'talk', titleKey: 'admin.formatTalk', hintKey: 'admin.ckTalkHint' },
  { type: 'workshop', titleKey: 'admin.formatWorkshop', hintKey: 'admin.ckWorkshopHint' },
]

const WIDGET_LABELS: Record<ReadinessWidgetKey, { talk: string; workshop: string }> = {
  rehearsal: { talk: 'admin.readyGenReh', workshop: 'admin.readyTechReh' },
  calendar: { talk: 'admin.readyCalendar', workshop: 'admin.readyCalendar' },
  deck: { talk: 'admin.readyDeck', workshop: 'admin.readyDeck' },
  approval: { talk: 'admin.readyApproval', workshop: 'admin.readyApproval' },
}

const DEFAULT_WIDGETS: ReadinessWidgetKey[] = [...READINESS_WIDGETS]

const speakerFormat = (sp: Team): SpeakerFormat =>
  sp.format === 'panel' || sp.format === 'workshop' ? sp.format : 'talk'

const widgetsOf = (ck?: ReadinessChecklist | null): ReadinessWidgetKey[] => {
  if (!ck?.widgets?.length) return DEFAULT_WIDGETS
  return ck.widgets.filter((w): w is ReadinessWidgetKey =>
    (READINESS_WIDGETS as string[]).includes(w)
  )
}

const widgetDone = (sp: Team, key: ReadinessWidgetKey): boolean => {
  const r = sp.readiness
  if (!r) return false
  if (key === 'rehearsal') return r.rehearsal?.status === 'passed'
  if (key === 'calendar') return !!r.calendarSet
  if (key === 'deck') return r.deckStatus === 'uploaded'
  return r.approval === 'approved'
}

const talkReady = (sp: Team, widgets: ReadinessWidgetKey[]): boolean => {
  if (!widgets.length) return true
  return widgets.every((w) => widgetDone(sp, w))
}

export const ReadyChecklistsPanel: React.FC<Props> = ({ eventId }) => {
  const { data: checklists = [], isLoading } = useGetChecklistsQuery(eventId)
  const { data: teams = [] } = useGetTeamsQuery({ eventId, type: 'speaker' })
  const [createChecklist] = useCreateChecklistMutation()
  const [updateChecklist] = useUpdateChecklistMutation()

  const byType = useMemo(() => {
    const map: Partial<Record<ReadinessChecklistType, ReadinessChecklist>> = {}
    checklists.forEach((ck) => {
      if (ck.type === 'talk' || ck.type === 'workshop') {
        if (!map[ck.type]) map[ck.type] = ck
      }
    })
    return map
  }, [checklists])

  const talksByType = useMemo(() => {
    const map: Record<ReadinessChecklistType, Team[]> = { talk: [], workshop: [] }
    teams.forEach((sp) => {
      const fmt = speakerFormat(sp)
      if (fmt === 'talk' || fmt === 'workshop') map[fmt].push(sp)
    })
    return map
  }, [teams])

  useEffect(() => {
    TYPE_CARDS.forEach(({ type, titleKey }) => {
      if (byType[type]) return
      void createChecklist({
        eventId,
        type,
        name: t(titleKey),
        widgets: DEFAULT_WIDGETS,
        items: [],
      })
    })
  }, [byType, createChecklist, eventId])

  const toggleWidget = async (
    ck: ReadinessChecklist,
    key: ReadinessWidgetKey
  ): Promise<void> => {
    const cur = widgetsOf(ck)
    const next = cur.includes(key) ? cur.filter((w) => w !== key) : [...cur, key]
    await updateChecklist({
      id: ck._id,
      eventId,
      data: { widgets: next.length ? next : DEFAULT_WIDGETS },
    })
  }

  if (isLoading) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  return (
    <Box
      bg={thColors.surface}
      border={`1px solid ${thColors.border}`}
      borderRadius="14px"
      p="18px 20px"
      display="flex"
      flexDirection="column"
      gap="14px"
    >
      <Box>
        <Text fontFamily="heading" fontSize="15px" fontWeight="700" letterSpacing="-0.3px">
          {t('admin.ckTitle')}
        </Text>
        <Text fontSize="11.5px" color={thColors.textFaint} mt="3px">
          {t('admin.ckSub')}
        </Text>
      </Box>

      <Grid templateColumns="repeat(auto-fill, minmax(330px, 1fr))" gap="14px">
        {TYPE_CARDS.map(({ type, titleKey, hintKey }) => {
          const ck = byType[type]
          const widgets = widgetsOf(ck)
          const talks = talksByType[type]
          const readyN = talks.filter((sp) => talkReady(sp, widgets)).length
          const pct = talks.length ? Math.round((readyN / talks.length) * 100) : 0

          return (
            <Box
              key={type}
              bg={thColors.card}
              border={`1px solid ${thColors.border}`}
              borderRadius="12px"
              p="14px 16px 15px"
              display="flex"
              flexDirection="column"
              gap="12px"
            >
              <Flex align="center" justify="space-between" gap="10px">
                <Box minW={0}>
                  <Text fontSize="14px" fontWeight="800">
                    {t(titleKey)}
                  </Text>
                  <Text fontSize="11px" color={thColors.textFaint} mt="2px">
                    {t(hintKey)}
                  </Text>
                </Box>
                <Text fontSize="11.5px" fontWeight="800" color={thColors.greenLight} flexShrink={0}>
                  {talks.length ? `${readyN} / ${talks.length}` : '—'}
                </Text>
              </Flex>

              <Box h="5px" bg="rgba(255,255,255,0.1)" borderRadius="3px" overflow="hidden">
                <Box w={`${pct}%`} h="100%" bg={thColors.gradientGreen} />
              </Box>

              <Text
                fontSize="10px"
                color="rgba(255,255,255,0.4)"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                {t('admin.ckWidgets')}
              </Text>

              <Flex direction="column" gap="8px">
                {READINESS_WIDGETS.map((key) => {
                  const on = widgets.includes(key)
                  const labelKey = WIDGET_LABELS[key][type]
                  return (
                    <Flex
                      key={key}
                      as="button"
                      type="button"
                      align="center"
                      gap="10px"
                      bg="#0C1218"
                      borderRadius="10px"
                      px="12px"
                      py="10px"
                      cursor={ck ? 'pointer' : 'default'}
                      border={on ? `1px solid ${thColors.green}` : '1px solid transparent'}
                      opacity={ck ? 1 : 0.55}
                      fontFamily="inherit"
                      color="inherit"
                      textAlign="left"
                      onClick={() => {
                        if (ck) void toggleWidget(ck, key)
                      }}
                    >
                      <Box
                        w="18px"
                        h="18px"
                        borderRadius="5px"
                        border={
                          on
                            ? `1.5px solid ${thColors.green}`
                            : '1.5px solid rgba(255,255,255,0.25)'
                        }
                        bg={on ? thColors.green : 'transparent'}
                        color={thColors.cyanDeep}
                        fontSize="11px"
                        fontWeight="900"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        {on ? '✓' : ''}
                      </Box>
                      <Text fontSize="13px" fontWeight="600" color={on ? '#fff' : 'rgba(255,255,255,0.55)'}>
                        {t(labelKey)}
                      </Text>
                    </Flex>
                  )
                })}
              </Flex>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

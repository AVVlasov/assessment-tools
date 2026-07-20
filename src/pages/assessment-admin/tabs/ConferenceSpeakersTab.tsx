import React, { useMemo, useState } from 'react'
import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { toaster } from '../../../components/ui/toaster'
import {
  AvatarInitials,
  GradientButton,
  Pill,
} from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import {
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useGetHallsQuery,
  useGetTeamsQuery,
  useUpdateTeamMutation,
} from '../../../__data__/api'
import { useGetListenerStatsQuery } from '../../../__data__/api/listenerApi'
import type { SpeakerFormat, Team } from '../../../types'
import { t } from '../../../utils/locale'

interface Props {
  eventId: string
}

interface SpDraft {
  name: string
  talk: string
  time: string
  hallId: string
  format: SpeakerFormat
}

const emptyDraft = (hallId = ''): SpDraft => ({
  name: '',
  talk: '',
  time: '12:00',
  hallId,
  format: 'talk',
})

const formatLabel = (fmt?: string): string => {
  if (fmt === 'panel') return t('admin.formatPanel')
  if (fmt === 'workshop') return t('admin.formatWorkshop')
  return t('admin.formatTalk')
}

const statusLabel = (status: string): string => {
  if (status === 'live') return t('admin.statusLive')
  if (status === 'done') return t('admin.statusDone')
  return t('admin.statusWaiting')
}

export const ConferenceSpeakersTab: React.FC<Props> = ({ eventId }) => {
  const { data: halls = [], refetch: refetchHalls } = useGetHallsQuery(eventId)
  const { data: teams = [], refetch: refetchTeams } = useGetTeamsQuery({ eventId, type: 'speaker' })
  const { data: stats, refetch: refetchStats } = useGetListenerStatsQuery({ eventId }, { pollingInterval: 8000 })
  const [createTeam] = useCreateTeamMutation()
  const [updateTeam] = useUpdateTeamMutation()
  const [deleteTeam] = useDeleteTeamMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SpDraft>(emptyDraft())
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const rows = stats?.speakerRows || []
  const teamById = useMemo(
    () => Object.fromEntries(teams.map((tm) => [tm._id, tm])) as Record<string, Team>,
    [teams]
  )
  const hallById = useMemo(
    () => Object.fromEntries(halls.map((h) => [h._id, h])),
    [halls]
  )

  const toggleStatus = async (sp: (typeof rows)[0]): Promise<void> => {
    if (sp.status === 'live') return
    await updateTeam({ id: sp._id, data: { programDone: sp.status !== 'done' } })
    refresh()
  }

  const doneTotal = rows.filter((r) => r.status === 'done').length
  const liveTotal = rows.filter((r) => r.status === 'live').length
  const progPct = rows.length ? Math.round((doneTotal / rows.length) * 100) : 0

  const refresh = (): void => {
    void refetchHalls()
    void refetchTeams()
    void refetchStats()
  }

  const openCreate = (): void => {
    setEditingId(null)
    setDraft(emptyDraft(halls[0]?._id || ''))
    setModalOpen(true)
  }

  const openEdit = (teamId: string): void => {
    const tm = teamById[teamId]
    if (!tm) return
    setEditingId(teamId)
    setDraft({
      name: tm.name,
      talk: tm.projectName || '',
      time: tm.scheduledTime || '12:00',
      hallId: tm.hallId || halls[0]?._id || '',
      format: tm.format === 'panel' || tm.format === 'workshop' ? tm.format : 'talk',
    })
    setModalOpen(true)
  }

  const closeModal = (): void => {
    setModalOpen(false)
    setEditingId(null)
    setDraft(emptyDraft())
  }

  const handleSave = async (): Promise<void> => {
    if (!draft.name.trim()) {
      toaster.create({ title: t('admin.speakerNameRequired'), type: 'error' })
      return
    }
    if (!draft.hallId) {
      toaster.create({ title: t('admin.hallRequired'), type: 'error' })
      return
    }
    try {
      if (editingId) {
        await updateTeam({
          id: editingId,
          data: {
            name: draft.name.trim(),
            projectName: draft.talk.trim(),
            hallId: draft.hallId,
            scheduledTime: draft.time.trim(),
            format: draft.format,
          },
        }).unwrap()
      } else {
        await createTeam({
          eventId,
          type: 'speaker',
          name: draft.name.trim(),
          projectName: draft.talk.trim(),
          hallId: draft.hallId,
          scheduledTime: draft.time.trim(),
          format: draft.format,
        }).unwrap()
        toaster.create({ title: t('admin.speakerAdded'), type: 'success' })
      }
      closeModal()
      refresh()
    } catch {
      toaster.create({ title: t('admin.speakerAddFailed'), type: 'error' })
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (confirmDel === id) {
      setConfirmDel(null)
      await deleteTeam(id)
      refresh()
      return
    }
    setConfirmDel(id)
    setTimeout(() => setConfirmDel((c) => (c === id ? null : c)), 3000)
  }

  return (
    <Box>
      <Flex
        align="center"
        gap="16px"
        bg={thColors.card}
        border={`1px solid ${thColors.border}`}
        borderRadius="12px"
        px="18px"
        py="14px"
        mb="16px"
        flexWrap="wrap"
      >
        <Box flex="1" minW="160px">
          <Text fontSize="13px" fontWeight="700">
            {t('admin.progTitle')}
          </Text>
          <Text fontSize="11.5px" color={thColors.textFaint} mt="2px">
            {halls.length} {t('admin.hallsCount')} · {liveTotal} {t('admin.liveNow')}
          </Text>
        </Box>
        <Box
          w={{ base: '100%', md: '240px' }}
          h="6px"
          bg="rgba(255,255,255,0.1)"
          borderRadius="3px"
          overflow="hidden"
        >
          <Box w={`${progPct}%`} h="100%" bg={thColors.gradientGreen} />
        </Box>
        <Text fontSize="15px" fontWeight="800" color={thColors.greenLight}>
          {doneTotal} / {rows.length || 0}
        </Text>
        <GradientButton h="36px" px="18px" fontSize="12.5px" onClick={openCreate} disabled={!halls.length}>
          {t('admin.addSpeaker')}
        </GradientButton>
      </Flex>

      {!halls.length && (
        <Text fontSize="12px" color={thColors.cyanLight} mb="12px">
          {t('admin.createHallFirst')}
        </Text>
      )}

      <Box
        display={{ base: 'none', md: 'grid' }}
        gridTemplateColumns="26px 52px 1.5fr 1.2fr 110px 90px 140px"
        gap="12px"
        alignItems="center"
        px="18px"
        pb="8px"
        fontSize="10.5px"
        color="rgba(255,255,255,0.4)"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.6px"
      >
        <span />
        <span>{t('admin.colTime')}</span>
        <span>{t('admin.colSpeaker')}</span>
        <span>{t('admin.colHallType')}</span>
        <span>{t('admin.colStatus')}</span>
        <span style={{ textAlign: 'right' }}>{t('admin.colRatings')}</span>
        <span />
      </Box>

      <Flex direction="column" gap="8px">
        {rows.map((sp) => {
          const isLive = sp.status === 'live'
          const isDone = sp.status === 'done'
          const delConfirm = confirmDel === sp._id
          return (
            <Box
              key={sp._id}
              display="grid"
              gridTemplateColumns={{ base: '1fr', md: '26px 52px 1.5fr 1.2fr 110px 90px 140px' }}
              gap="12px"
              alignItems="center"
              bg={thColors.card}
              border={isLive ? `1.5px solid ${thColors.green}` : `1px solid ${thColors.border}`}
              borderRadius="12px"
              px="18px"
              py="12px"
              opacity={isDone ? 0.6 : 1}
            >
              <Flex
                as="button"
                type="button"
                w="24px"
                h="24px"
                borderRadius="50%"
                align="center"
                justify="center"
                fontSize="12px"
                fontWeight="800"
                color={thColors.green}
                bg={isLive ? thColors.gradientGreen : isDone ? 'rgba(61,220,80,0.12)' : 'transparent'}
                border={
                  isLive
                    ? 'none'
                    : isDone
                      ? '1px solid rgba(61,220,80,0.55)'
                      : '1px solid rgba(255,255,255,0.2)'
                }
                animation={isLive ? 'livePulse 1.6s ease infinite' : undefined}
                cursor={isLive ? 'default' : 'pointer'}
                title={
                  isLive
                    ? t('admin.statusLive')
                    : isDone
                      ? t('admin.statusMarkWaiting')
                      : t('admin.statusMarkDone')
                }
                onClick={() => void toggleStatus(sp)}
                _hover={isLive ? undefined : { borderColor: thColors.green }}
              >
                {isDone ? '✓' : ''}
              </Flex>
              <Text fontSize="12.5px" fontWeight="700" color="rgba(255,255,255,0.6)">
                {sp.time}
              </Text>
              <Flex align="center" gap="11px" minW={0}>
                <AvatarInitials name={sp.name} size={36} live={isLive} />
                <Box minW={0}>
                  <Text fontSize="13.5px" fontWeight="700">
                    {sp.name}
                  </Text>
                  <Text
                    fontSize="11px"
                    color={thColors.textFaint}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {sp.talk}
                  </Text>
                </Box>
              </Flex>
              <Flex gap="6px" flexWrap="wrap" align="center">
                <Pill
                  fontSize="11.5px"
                  fontWeight="500"
                  border="1px solid rgba(255,255,255,0.2)"
                  color="rgba(255,255,255,0.78)"
                  display="inline-flex"
                  alignItems="center"
                  gap="6px"
                >
                  <Box
                    as="span"
                    w="8px"
                    h="8px"
                    borderRadius="50%"
                    bg={sp.hallColor || hallById[sp.hallId || '']?.color || '#4FC9F0'}
                    flexShrink={0}
                  />
                  {sp.hall}
                </Pill>
                <Pill
                  fontSize="10.5px"
                  fontWeight="600"
                  border="1px solid rgba(0,174,239,0.5)"
                  color={thColors.cyanLight}
                  bg="transparent"
                >
                  {formatLabel(sp.format)}
                </Pill>
              </Flex>
              <Pill
                as="button"
                type="button"
                w="fit-content"
                fontSize="11px"
                fontWeight="600"
                variant={isLive ? 'green' : 'outline'}
                border={
                  isLive
                    ? undefined
                    : isDone
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(0,174,239,0.6)'
                }
                color={isLive ? undefined : isDone ? '#8FA6B8' : thColors.cyanLight}
                bg={isLive ? undefined : 'transparent'}
                cursor={isLive ? 'default' : 'pointer'}
                onClick={() => void toggleStatus(sp)}
                title={
                  isLive
                    ? t('admin.statusLive')
                    : isDone
                      ? t('admin.statusMarkWaiting')
                      : t('admin.statusMarkDone')
                }
              >
                {statusLabel(sp.status)}
              </Pill>
              <Box textAlign={{ base: 'left', md: 'right' }}>
                <Text
                  as="span"
                  fontSize="16px"
                  fontWeight="800"
                  color={sp.avg != null ? thColors.greenLight : 'rgba(255,255,255,0.35)'}
                >
                  {sp.avg != null ? sp.avg : '—'}
                </Text>
                <Text as="span" fontSize="11px" color="rgba(255,255,255,0.4)">
                  {' '}
                  · {sp.n ? `${sp.n} ${t('admin.ratingsShort')}` : '—'}
                </Text>
              </Box>
              <Flex gap="6px" justify={{ base: 'flex-start', md: 'flex-end' }}>
                <GradientButton
                  h="30px"
                  px="12px"
                  fontSize="11px"
                  fontWeight="600"
                  variant="ghost"
                  color="rgba(255,255,255,0.7)"
                  borderColor="rgba(255,255,255,0.25)"
                  onClick={() => openEdit(sp._id)}
                >
                  {t('admin.editShort')}
                </GradientButton>
                <GradientButton
                  h="30px"
                  px="12px"
                  fontSize="11px"
                  fontWeight="600"
                  variant="ghost"
                  color={delConfirm ? '#fff' : '#FF8A8A'}
                  borderColor="rgba(255,120,120,0.4)"
                  bg={delConfirm ? 'linear-gradient(90deg,#E5484D,#C63A66)' : 'transparent'}
                  onClick={() => void handleDelete(sp._id)}
                >
                  {delConfirm ? t('admin.confirmDeleteShort') : t('admin.deleteShort')}
                </GradientButton>
              </Flex>
            </Box>
          )
        })}
        {!rows.length && (
          <Text color={thColors.textFaint} px="4px">
            {t('common.noData')}
          </Text>
        )}
      </Flex>

      {modalOpen && (
        <Flex
          position="fixed"
          inset={0}
          bg="rgba(2,6,10,0.85)"
          zIndex={100}
          align="center"
          justify="center"
          p="30px"
          backdropFilter="blur(6px)"
          onClick={closeModal}
        >
          <Box
            w="460px"
            maxW="100%"
            bg={thColors.card}
            border={`1px solid ${thColors.border}`}
            borderRadius="18px"
            p="24px"
            boxShadow="0 40px 100px rgba(0,0,0,0.7)"
            onClick={(e) => e.stopPropagation()}
          >
            <Text fontFamily="heading" fontSize="16px" fontWeight="700" letterSpacing="-0.3px" mb="14px">
              {editingId ? t('admin.editSpeakerModal') : t('admin.newSpeakerModal')}
            </Text>
            <Box mb="14px">
              <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" mb="6px">
                {t('admin.speakerNameLabel')}
              </Text>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                bg={thColors.surface}
                borderColor={thColors.border}
                color="white"
                borderRadius="10px"
                h="42px"
                fontSize="13px"
                _focus={{ borderColor: thColors.green }}
              />
            </Box>
            <Box mb="14px">
              <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" mb="6px">
                {t('admin.talkTitle')}
              </Text>
              <Input
                value={draft.talk}
                onChange={(e) => setDraft((d) => ({ ...d, talk: e.target.value }))}
                bg={thColors.surface}
                borderColor={thColors.border}
                color="white"
                borderRadius="10px"
                h="42px"
                fontSize="13px"
                _focus={{ borderColor: thColors.green }}
              />
            </Box>
            <Flex gap="10px" mb="14px" flexWrap="wrap">
              <Box w="110px">
                <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" mb="6px">
                  {t('admin.scheduledTime')}
                </Text>
                <Input
                  value={draft.time}
                  onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                  bg={thColors.surface}
                  borderColor={thColors.border}
                  color="white"
                  borderRadius="10px"
                  h="42px"
                  fontSize="13px"
                  _focus={{ borderColor: thColors.green }}
                />
              </Box>
              <Box flex="1" minW="180px">
                <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" mb="6px">
                  {t('admin.selectHall')}
                </Text>
                <Flex gap="6px" flexWrap="wrap">
                  {halls.map((h) => (
                    <GradientButton
                      key={h._id}
                      h="32px"
                      px="13px"
                      fontSize="11.5px"
                      fontWeight="600"
                      variant={draft.hallId === h._id ? 'primary' : 'ghost'}
                      boxShadow="none"
                      gap="6px"
                      onClick={() => setDraft((d) => ({ ...d, hallId: h._id }))}
                    >
                      <Box
                        as="span"
                        w="8px"
                        h="8px"
                        borderRadius="50%"
                        bg={h.color || '#4FC9F0'}
                        flexShrink={0}
                      />
                      {h.name}
                    </GradientButton>
                  ))}
                </Flex>
              </Box>
            </Flex>
            <Box mb="14px">
              <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px" mb="6px">
                {t('admin.formatHint')}
              </Text>
              <Flex gap="6px" flexWrap="wrap">
                {([
                  ['talk', t('admin.formatTalk')],
                  ['panel', t('admin.formatPanel')],
                  ['workshop', t('admin.formatWorkshop')],
                ] as const).map(([v, label]) => (
                  <GradientButton
                    key={v}
                    h="32px"
                    px="13px"
                    fontSize="11.5px"
                    fontWeight="600"
                    variant={draft.format === v ? 'primary' : 'ghost'}
                    boxShadow="none"
                    onClick={() => setDraft((d) => ({ ...d, format: v }))}
                  >
                    {label}
                  </GradientButton>
                ))}
              </Flex>
            </Box>
            <Text fontSize="11px" color={thColors.textFaint} lineHeight="1.5" mb="14px">
              {t('admin.formatHelp')}
            </Text>
            <Flex gap="8px">
              <GradientButton flex="1" h="44px" onClick={() => void handleSave()}>
                {t('admin.saveSpeaker')}
              </GradientButton>
              <GradientButton h="44px" px="20px" variant="ghost" onClick={closeModal}>
                {t('common.cancel')}
              </GradientButton>
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  )
}

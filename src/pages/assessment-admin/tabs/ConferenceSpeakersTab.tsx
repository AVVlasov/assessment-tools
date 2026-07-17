import React, { useState } from 'react'
import { Box, Flex, Input, Text, NativeSelect } from '@chakra-ui/react'
import {
  AvatarInitials,
  GradientButton,
  Pill,
  StatusBadge,
  SurfaceCard,
} from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import {
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useGetHallsQuery,
  useGetTeamsQuery,
  useSetHallSpeakerMutation,
  useUpdateTeamMutation,
} from '../../../__data__/api'
import {
  useGetListenerStatsQuery,
  useResetSpeakerRatingsMutation,
} from '../../../__data__/api/listenerApi'
import type { SpeakerFormat, Team } from '../../../types'
import { t } from '../../../utils/locale'

interface Props {
  eventId: string
}

interface EditState {
  name: string
  talk: string
  time: string
  hallId: string
  org: string
  format: SpeakerFormat
}

const emptyForm = (): EditState => ({
  name: '',
  talk: '',
  time: '',
  hallId: '',
  org: '',
  format: 'talk',
})

export const ConferenceSpeakersTab: React.FC<Props> = ({ eventId }) => {
  const { data: halls = [], refetch: refetchHalls } = useGetHallsQuery(eventId)
  const { data: teams = [], refetch: refetchTeams } = useGetTeamsQuery({ eventId, type: 'speaker' })
  const { data: stats, refetch: refetchStats } = useGetListenerStatsQuery({ eventId })
  const [createTeam] = useCreateTeamMutation()
  const [updateTeam] = useUpdateTeamMutation()
  const [deleteTeam] = useDeleteTeamMutation()
  const [setHallSpeaker] = useSetHallSpeakerMutation()
  const [resetSpeakerRatings] = useResetSpeakerRatingsMutation()

  const [form, setForm] = useState<EditState>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)

  const rows = stats?.speakerRows || []
  const teamById = Object.fromEntries(teams.map((tm) => [tm._id, tm])) as Record<string, Team>

  const refresh = (): void => {
    void refetchHalls()
    void refetchTeams()
    void refetchStats()
  }

  const handleAdd = async (): Promise<void> => {
    if (!form.name.trim() || !form.hallId) return
    await createTeam({
      eventId,
      type: 'speaker',
      name: form.name.trim(),
      projectName: form.talk.trim(),
      hallId: form.hallId,
      scheduledTime: form.time.trim(),
      org: form.org.trim(),
      format: form.format,
    }).unwrap()
    setForm(emptyForm())
    refresh()
  }

  const startEdit = (teamId: string): void => {
    const tm = teamById[teamId]
    if (!tm) return
    setEditingId(teamId)
    setForm({
      name: tm.name,
      talk: tm.projectName || '',
      time: tm.scheduledTime || '',
      hallId: tm.hallId || '',
      org: tm.org || '',
      format: tm.format === 'panel' || tm.format === 'workshop' ? tm.format : 'talk',
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!editingId || !form.name.trim() || !form.hallId) return
    await updateTeam({
      id: editingId,
      data: {
        name: form.name.trim(),
        projectName: form.talk.trim(),
        hallId: form.hallId,
        scheduledTime: form.time.trim(),
        org: form.org.trim(),
        format: form.format,
      },
    }).unwrap()
    setEditingId(null)
    setForm(emptyForm())
    refresh()
  }

  const cancelEdit = (): void => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const formFields = (
    <>
      <Input
        placeholder={t('teams.speakerName')}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        bg={thColors.surface}
        borderColor={thColors.border}
        color="white"
        borderRadius="14px"
        h="42px"
        flex="1"
        minW="160px"
      />
      <Input
        placeholder={t('admin.talkTitle')}
        value={form.talk}
        onChange={(e) => setForm((f) => ({ ...f, talk: e.target.value }))}
        bg={thColors.surface}
        borderColor={thColors.border}
        color="white"
        borderRadius="14px"
        h="42px"
        flex="1.2"
        minW="180px"
      />
      <Input
        placeholder={t('admin.scheduledTime')}
        value={form.time}
        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
        bg={thColors.surface}
        borderColor={thColors.border}
        color="white"
        borderRadius="14px"
        h="42px"
        w="100px"
      />
      <Input
        placeholder={t('admin.org')}
        value={form.org}
        onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
        bg={thColors.surface}
        borderColor={thColors.border}
        color="white"
        borderRadius="14px"
        h="42px"
        w="140px"
      />
      <NativeSelect.Root size="sm" w="140px">
        <NativeSelect.Field
          value={form.hallId}
          onChange={(e) => setForm((f) => ({ ...f, hallId: e.target.value }))}
          bg={thColors.surface}
          borderColor={thColors.border}
          color="white"
          borderRadius="14px"
          h="42px"
        >
          <option value="">{t('admin.selectHall')}</option>
          {halls.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name}
            </option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
      <NativeSelect.Root size="sm" w="120px">
        <NativeSelect.Field
          value={form.format}
          onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as SpeakerFormat }))}
          bg={thColors.surface}
          borderColor={thColors.border}
          color="white"
          borderRadius="14px"
          h="42px"
        >
          <option value="talk">{t('admin.formatTalk')}</option>
          <option value="panel">{t('admin.formatPanel')}</option>
          <option value="workshop">{t('admin.formatWorkshop')}</option>
        </NativeSelect.Field>
      </NativeSelect.Root>
    </>
  )

  return (
    <Box>
      <SurfaceCard mb="18px">
        <Text fontFamily="heading" fontSize="15px" fontWeight="700" mb="14px">
          {editingId ? t('admin.editSpeaker') : t('admin.addSpeaker')}
        </Text>
        <Flex gap="10px" flexWrap="wrap">
          {formFields}
          {editingId ? (
            <>
              <GradientButton h="42px" onClick={() => void handleSave()}>
                {t('admin.saveSpeaker')}
              </GradientButton>
              <GradientButton h="42px" variant="ghost" onClick={cancelEdit}>
                {t('common.cancel')}
              </GradientButton>
            </>
          ) : (
            <GradientButton h="42px" onClick={() => void handleAdd()} disabled={!halls.length}>
              {t('common.add')}
            </GradientButton>
          )}
        </Flex>
        {!halls.length && (
          <Text mt="10px" fontSize="12px" color={thColors.cyanLight}>
            Сначала создайте зал во вкладке «Залы»
          </Text>
        )}
        {!!teams.length && (
          <Text mt="8px" fontSize="12px" color={thColors.textFaint}>
            {t('admin.scheduleTitle')}: {teams.length}
          </Text>
        )}
      </SurfaceCard>

      <Box
        display={{ base: 'none', md: 'grid' }}
        gridTemplateColumns="70px 1.4fr 1fr 120px 110px 1.2fr"
        gap="14px"
        px="18px"
        pb="8px"
        fontSize="10.5px"
        color="rgba(255,255,255,0.4)"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.6px"
      >
        <span>{t('admin.colTime')}</span>
        <span>{t('admin.colSpeaker')}</span>
        <span>{t('admin.colHall')}</span>
        <span>{t('admin.colStatus')}</span>
        <span style={{ textAlign: 'right' }}>{t('admin.colRatings')}</span>
        <span>{t('admin.actions')}</span>
      </Box>

      <Flex direction="column" gap="8px">
        {rows.map((sp) => (
          <Box
            key={sp._id}
            display="grid"
            gridTemplateColumns={{ base: '1fr', md: '70px 1.4fr 1fr 120px 110px 1.2fr' }}
            gap="14px"
            alignItems="center"
            bg={thColors.card}
            border={
              sp.status === 'live' ? `1.5px solid ${thColors.green}` : `1px solid ${thColors.border}`
            }
            borderRadius="16px"
            px="18px"
            py="12px"
          >
            <Flex
              w="52px"
              h="34px"
              borderRadius="10px"
              bg={thColors.keyUnsel}
              boxShadow="0 3px 0 #0B1118, inset 0 1px 0 rgba(255,255,255,0.12)"
              align="center"
              justify="center"
              fontWeight="800"
              fontSize="12px"
              color={thColors.muted}
            >
              {sp.time}
            </Flex>
            <Flex align="center" gap="11px" minW={0}>
              <AvatarInitials name={sp.name} size={36} live={sp.status === 'live'} />
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
            <Pill fontSize="11.5px" w="fit-content">
              {sp.hall}
            </Pill>
            <StatusBadge
              status={sp.status === 'live' ? 'live' : sp.status === 'done' ? 'done' : 'waiting'}
            />
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
                · {sp.n ? `${sp.n} оц.` : '—'}
              </Text>
            </Box>
            <Flex gap="6px" flexWrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }}>
              {sp.hallId && sp.status !== 'live' && (
                <GradientButton
                  h="30px"
                  px="10px"
                  fontSize="11px"
                  borderRadius="10px"
                  variant="key"
                  onClick={() => {
                    void setHallSpeaker({ id: sp.hallId as string, speakerId: sp._id }).then(refresh)
                  }}
                >
                  {t('admin.setLive')}
                </GradientButton>
              )}
              <GradientButton
                h="30px"
                px="10px"
                fontSize="11px"
                borderRadius="10px"
                variant="ghost"
                onClick={() => startEdit(sp._id)}
              >
                {t('admin.editSpeaker')}
              </GradientButton>
              <GradientButton
                h="30px"
                px="10px"
                fontSize="11px"
                borderRadius="10px"
                variant="ghost"
                color="#FFB4B4"
                borderColor="rgba(255,100,100,0.4)"
                onClick={() => {
                  if (window.confirm(t('admin.confirmResetSpeaker'))) {
                    void resetSpeakerRatings(sp._id).then(refresh)
                  }
                }}
              >
                {t('admin.resetSpeakerRatings')}
              </GradientButton>
              <GradientButton
                h="30px"
                px="10px"
                fontSize="11px"
                borderRadius="10px"
                variant="ghost"
                color="#FF6B6B"
                borderColor="rgba(255,80,80,0.5)"
                onClick={() => {
                  if (window.confirm(t('admin.confirmDeleteSpeaker'))) {
                    void deleteTeam(sp._id).then(refresh)
                  }
                }}
              >
                {t('admin.deleteSpeaker')}
              </GradientButton>
            </Flex>
          </Box>
        ))}
        {!rows.length && (
          <Text color={thColors.textFaint} px="4px">
            {t('common.noData')}
          </Text>
        )}
      </Flex>
    </Box>
  )
}

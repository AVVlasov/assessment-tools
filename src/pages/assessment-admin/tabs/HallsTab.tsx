import React, { useMemo, useState } from 'react'
import { Box, Flex, Input, Text, Grid } from '@chakra-ui/react'
import { QRCodeSVG } from 'qrcode.react'
import { LuChevronLeft, LuChevronRight, LuPencil, LuRotateCcw, LuTrash2 } from 'react-icons/lu'
import {
  AvatarInitials,
  GradientButton,
  IconBtn,
  QrModal,
  StatusBadge,
  SurfaceCard,
} from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import {
  useCreateHallMutation,
  useDeleteHallMutation,
  useGetHallsQuery,
  useNextHallSpeakerMutation,
  usePauseAllHallsMutation,
  usePauseHallMutation,
  useRestartHallMutation,
  useShiftHallOrderMutation,
  useShiftHallSpeakerMutation,
  useUpdateHallMutation,
} from '../../../__data__/api'
import { getHallRateUrl } from '../../../__data__/urls'
import type { Team } from '../../../types'
import { t } from '../../../utils/locale'

const HALL_PALETTE = ['#4FC9F0', '#B18CFF', '#FFB020', '#FF7DAE', '#3ED968', '#F2E14C']

const isSpeakerDone = (sp: Team, idx: number, currentIdx: number, live: boolean): boolean => {
  if (live && idx === currentIdx) return false
  if (sp.programDone === true) return true
  if (sp.programDone === false) return false
  return idx < currentIdx
}

interface HallsTabProps {
  eventId: string
}

export const HallsTab: React.FC<HallsTabProps> = ({ eventId }) => {
  // Single poll for live ratings/status; stats come from parent header query cache
  const { data: halls = [], isLoading } = useGetHallsQuery(eventId, { pollingInterval: 15000 })
  const [createHall] = useCreateHallMutation()
  const [deleteHall] = useDeleteHallMutation()
  const [nextSpeaker] = useNextHallSpeakerMutation()
  const [pauseHall] = usePauseHallMutation()
  const [pauseAllHalls] = usePauseAllHallsMutation()
  const [restartHall] = useRestartHallMutation()
  const [updateHall] = useUpdateHallMutation()
  const [shiftSpeakerMut] = useShiftHallSpeakerMutation()
  const [shiftHallOrder] = useShiftHallOrderMutation()
  const [qrHallId, setQrHallId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [confirmStop, setConfirmStop] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const qrHall = useMemo(() => halls.find((h) => h._id === qrHallId) || null, [halls, qrHallId])

  const saveName = async (id: string): Promise<void> => {
    const trimmed = nameDraft.trim()
    if (trimmed) await updateHall({ id, data: { name: trimmed } })
    setEditingId(null)
  }

  const shiftSpeaker = (hallId: string, delta: 1 | -1): void => {
    const hall = halls.find((h) => h._id === hallId)
    if (!hall?.speakers?.length) return
    const cur = hall.currentSpeakerIndex || 0
    const next = Math.min(Math.max(0, cur + delta), hall.speakers.length - 1)
    if (next === cur) return
    setConfirmStop(null)
    void shiftSpeakerMut({ id: hallId, delta, eventId })
  }

  const toggleVoting = async (hallId: string): Promise<void> => {
    const hall = halls.find((h) => h._id === hallId)
    if (!hall) return
    if (hall.status !== 'live') {
      setConfirmStop(null)
      // One live hall at a time across the event
      await pauseAllHalls({ eventId })
      await nextSpeaker(hallId)
      return
    }
    if (confirmStop === hallId) {
      setConfirmStop(null)
      await pauseHall(hallId)
      return
    }
    setConfirmStop(hallId)
    setTimeout(() => setConfirmStop((c) => (c === hallId ? null : c)), 3000)
  }

  const handleDelete = async (hallId: string): Promise<void> => {
    if (confirmDel === hallId) {
      setConfirmDel(null)
      await deleteHall(hallId)
      return
    }
    setConfirmDel(hallId)
    setTimeout(() => setConfirmDel((c) => (c === hallId ? null : c)), 3000)
  }

  if (isLoading) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  return (
    <Box>
      <Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap="15px">
        {halls.map((h, hallIdx) => {
          const live = h.status === 'live'
          const cur = h.currentSpeaker
          const speakers = h.speakers || []
          const url = getHallRateUrl(h.token)
          const warn = live && !(h.ratingsCount && h.ratingsCount > 0)
          const curIdx = h.currentSpeakerIndex || 0
          const hallColor = h.color || HALL_PALETTE[(h.num - 1) % HALL_PALETTE.length]
          const doneCount = speakers.filter((sp, idx) => isSpeakerDone(sp, idx, curIdx, live)).length
          const stopConfirm = confirmStop === h._id
          const delConfirm = confirmDel === h._id
          const hallRatings = h.ratingsCount || 0
          const maxHallRatings = Math.max(1, ...halls.map((hh) => hh.ratingsCount || 0))
          const conversion =
            live && hallRatings > 0
              ? `${Math.min(99, Math.round((hallRatings / maxHallRatings) * 100))}%`
              : '—'

          return (
            <SurfaceCard
              key={h._id}
              highlighted={live}
              opacity={live ? 1 : 0.88}
              borderRadius="16px"
              display="flex"
              flexDirection="column"
              gap="14px"
            >
              <Flex justify="space-between" align="center" gap="8px">
                {editingId === h._id ? (
                  <>
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void saveName(h._id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      flex="1"
                      minW={0}
                      h="34px"
                      bg={thColors.surface}
                      borderColor={thColors.green}
                      color="white"
                      borderRadius="10px"
                      fontSize="13px"
                      fontWeight="700"
                    />
                    <GradientButton
                      h="32px"
                      px="13px"
                      fontSize="11.5px"
                      flexShrink={0}
                      onClick={() => void saveName(h._id)}
                    >
                      {t('admin.saveName')}
                    </GradientButton>
                  </>
                ) : (
                  <>
                    <Flex align="center" gap="8px" minW={0} flex="1">
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="50%"
                        bg={hallColor}
                        flexShrink={0}
                      />
                      <Text fontSize="14.5px" fontWeight="800" truncate>
                        {h.name}
                      </Text>
                    </Flex>
                    <StatusBadge status={live ? 'live' : 'break'} />
                  </>
                )}
              </Flex>

              {editingId === h._id && (
                <Flex gap="8px" align="center" flexWrap="wrap">
                  <Text
                    fontSize="10.5px"
                    color="rgba(255,255,255,0.45)"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    {t('admin.hallColor')}
                  </Text>
                  {HALL_PALETTE.map((c) => (
                    <Box
                      key={c}
                      as="button"
                      type="button"
                      w="22px"
                      h="22px"
                      borderRadius="50%"
                      bg={c}
                      border={hallColor === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.15)'}
                      cursor="pointer"
                      onClick={() => void updateHall({ id: h._id, data: { color: c } })}
                    />
                  ))}
                </Flex>
              )}

              <Flex gap="12px" align="center">
                <AvatarInitials name={cur?.name || '—'} size={48} live={live} />
                <Box minW={0}>
                  <Text fontSize="14px" fontWeight="700">
                    {cur?.name || t('listener.noSpeaker')}
                  </Text>
                  <Text fontSize="11.5px" color={thColors.textFaint} lineHeight="1.35">
                    {cur
                      ? `${cur.projectName}${cur.scheduledTime ? ` · ${cur.scheduledTime}` : ''}`
                      : t('admin.addSpeakersHint')}
                  </Text>
                </Box>
              </Flex>

              <Box>
                <Flex justify="space-between" fontSize="10.5px" color="rgba(255,255,255,0.45)" mb="6px">
                  <Text textTransform="uppercase" letterSpacing="0.5px" fontWeight="600">
                    {t('admin.hallProgram')}
                  </Text>
                  <Text>
                    {doneCount} {t('admin.of')} {Math.max(speakers.length, 1)} {t('admin.spoke')}
                  </Text>
                </Flex>
                <Flex gap="4px">
                  {(speakers.length ? speakers : [{ _id: 'empty' } as Team]).map((sp, idx) => {
                    const done = speakers.length > 0 && isSpeakerDone(sp, idx, curIdx, live)
                    const current = live && speakers.length > 0 && idx === curIdx
                    return (
                      <Box
                        key={sp._id || idx}
                        flex="1"
                        h="5px"
                        borderRadius="3px"
                        bg={
                          done
                            ? thColors.green
                            : current
                              ? thColors.gradientGreen
                              : 'rgba(255,255,255,0.15)'
                        }
                        animation={current ? 'livePulse 1.6s ease infinite' : undefined}
                      />
                    )
                  })}
                </Flex>
              </Box>

              <Flex gap="8px">
                {[
                  {
                    v: h.ratingsCount != null && h.ratingsCount > 0 ? h.ratingsCount : '—',
                    l: t('admin.ratings'),
                    c: thColors.greenLight,
                  },
                  {
                    v: h.averageScore ? h.averageScore : '—',
                    l: t('admin.average'),
                    c: 'white' as const,
                  },
                  {
                    v: conversion,
                    l: t('admin.conversion'),
                    c: 'white' as const,
                  },
                ].map((m) => (
                  <Box
                    key={m.l}
                    flex="1"
                    bg={thColors.surface}
                    borderRadius="10px"
                    p="10px"
                    textAlign="center"
                  >
                    <Text fontSize="18px" fontWeight="800" color={m.c}>
                      {m.v}
                    </Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.45)">
                      {m.l}
                    </Text>
                  </Box>
                ))}
              </Flex>

              {warn && (
                <Box
                  bg="rgba(255,176,32,0.1)"
                  border="1px solid rgba(255,176,32,0.45)"
                  borderRadius="10px"
                  p="9px 12px"
                >
                  <Text fontSize="11px" color="#FFC24B" fontWeight="600" lineHeight="1.4">
                    {t('admin.warnNoRatings')}
                  </Text>
                </Box>
              )}

              <Flex
                gap="10px"
                align="center"
                bg={thColors.surface}
                borderRadius="12px"
                p="11px 12px"
                cursor="pointer"
                border="1px solid transparent"
                _hover={{ borderColor: 'rgba(79,201,240,0.5)' }}
                onClick={() => setQrHallId(h._id)}
              >
                <Box
                  w="54px"
                  h="54px"
                  borderRadius="9px"
                  bg="white"
                  p="4px"
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <QRCodeSVG id={`qr-hall-${h._id}`} value={url} size={46} />
                </Box>
                <Box flex="1" minW={0}>
                  <Text fontSize="11.5px" fontWeight="700">
                    {t('admin.qrPermanent')} №{h.num} · {t('admin.qrPermanentSuffix')}
                  </Text>
                  <Text fontSize="10.5px" color={thColors.textFaint} lineHeight="1.35">
                    {t('admin.qrClickHint')}
                  </Text>
                </Box>
              </Flex>

              <Flex gap="8px" align="center">
                <GradientButton
                  w="44px"
                  h="44px"
                  px="0"
                  variant="ghost"
                  flexShrink={0}
                  fontSize="15px"
                  boxShadow="none"
                  onClick={() => void shiftSpeaker(h._id, -1)}
                >
                  ←
                </GradientButton>
                <GradientButton
                  flex="1"
                  h="44px"
                  fontSize="13px"
                  fontWeight="600"
                  variant="ghost"
                  boxShadow="none"
                  border={
                    live && !stopConfirm
                      ? '1px solid rgba(255,120,120,0.55)'
                      : live && stopConfirm
                        ? '1px solid transparent'
                        : '1px solid transparent'
                  }
                  bg={
                    live
                      ? stopConfirm
                        ? 'linear-gradient(90deg,#E5484D,#C63A66)'
                        : 'transparent'
                      : thColors.gradientGreen
                  }
                  color={live ? (stopConfirm ? '#fff' : '#FF8A8A') : '#FFFFFF'}
                  _hover={
                    live && !stopConfirm
                      ? { borderColor: '#FF4444', color: '#FF4444', bg: 'transparent' }
                      : live && stopConfirm
                        ? { transform: 'translateY(-1px)' }
                        : { transform: 'translateY(-2px)', bg: thColors.gradientGreen }
                  }
                  onClick={() => void toggleVoting(h._id)}
                >
                  {live
                    ? stopConfirm
                      ? t('admin.confirmStop')
                      : t('admin.pauseHall')
                    : t('admin.startVoting')}
                </GradientButton>
                <GradientButton
                  w="44px"
                  h="44px"
                  px="0"
                  variant="ghost"
                  flexShrink={0}
                  fontSize="15px"
                  boxShadow="none"
                  onClick={() => void shiftSpeaker(h._id, 1)}
                >
                  →
                </GradientButton>
              </Flex>

              <Flex justify="space-between" align="center" gap="8px" mt="2px">
                <Flex align="center" gap="8px">
                  <IconBtn
                    label={t('admin.resetHall')}
                    size={34}
                    onClick={() => void restartHall({ id: h._id, clearRatings: false })}
                  >
                    <LuRotateCcw size={15} />
                  </IconBtn>
                  <IconBtn
                    label={t('admin.editHall')}
                    size={34}
                    onClick={() => {
                      setEditingId(h._id)
                      setNameDraft(h.name)
                    }}
                  >
                    <LuPencil size={15} />
                  </IconBtn>
                  <IconBtn
                    label={delConfirm ? t('admin.confirmDelete') : t('admin.deleteHall')}
                    danger
                    active={delConfirm}
                    size={34}
                    onClick={() => void handleDelete(h._id)}
                  >
                    <LuTrash2 size={15} />
                  </IconBtn>
                </Flex>
                <Flex align="center" gap="8px">
                  <IconBtn
                    label={t('admin.moveHallLeft')}
                    size={34}
                    disabled={hallIdx === 0}
                    onClick={() => void shiftHallOrder({ id: h._id, delta: -1, eventId })}
                  >
                    <LuChevronLeft size={16} />
                  </IconBtn>
                  <IconBtn
                    label={t('admin.moveHallRight')}
                    size={34}
                    disabled={hallIdx >= halls.length - 1}
                    onClick={() => void shiftHallOrder({ id: h._id, delta: 1, eventId })}
                  >
                    <LuChevronRight size={16} />
                  </IconBtn>
                </Flex>
              </Flex>
            </SurfaceCard>
          )
        })}

        <Box
          as="button"
          minH="220px"
          borderRadius="16px"
          border="1.5px dashed rgba(255,255,255,0.2)"
          bg="transparent"
          color="rgba(255,255,255,0.55)"
          fontSize="13.5px"
          fontWeight="600"
          cursor="pointer"
          fontFamily="inherit"
          transition="all 0.15s"
          _hover={{ borderColor: thColors.green, color: thColors.greenLight }}
          onClick={() => {
            void createHall({
              eventId,
              name: `${t('admin.newHall')} ${halls.length + 1}`,
            })
          }}
        >
          + {t('admin.createHall')}
        </Box>
      </Grid>

      {!halls.length && (
        <Text color={thColors.textFaint} mt="12px">
          {t('admin.noHalls')}
        </Text>
      )}

      <QrModal
        open={!!qrHall}
        title={`${t('qr.hallTitle')} №${qrHall?.num || ''}`}
        subtitle={`${qrHall?.name || ''} · сейчас: ${qrHall?.currentSpeaker?.name || '—'}`}
        url={qrHall ? getHallRateUrl(qrHall.token) : ''}
        downloadName={`qr-hall-${qrHall?.num || 'x'}.png`}
        onClose={() => setQrHallId(null)}
        copyLabel={t('qr.copy')}
        copiedLabel={t('qr.copied')}
        downloadLabel={t('qr.download')}
        closeLabel={t('qr.close')}
        hint={t('qr.hint')}
      />
    </Box>
  )
}

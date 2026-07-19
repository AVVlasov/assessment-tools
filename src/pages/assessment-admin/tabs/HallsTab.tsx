import React, { useMemo, useState } from 'react'
import { Box, Flex, Input, Text, Grid } from '@chakra-ui/react'
import { QRCodeSVG } from 'qrcode.react'
import {
  AvatarInitials,
  GradientButton,
  Pill,
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
} from '../../../__data__/api'
import {
  useGetListenerStatsQuery,
  useResetEventRatingsMutation,
  useResetHallRatingsMutation,
  useResetSpeakerRatingsMutation,
} from '../../../__data__/api/listenerApi'
import { getHallRateUrl } from '../../../__data__/urls'
import { t } from '../../../utils/locale'

interface HallsTabProps {
  eventId: string
}

export const HallsTab: React.FC<HallsTabProps> = ({ eventId }) => {
  const { data: halls = [], isLoading } = useGetHallsQuery(eventId)
  const { data: stats } = useGetListenerStatsQuery({ eventId })
  const [createHall] = useCreateHallMutation()
  const [deleteHall] = useDeleteHallMutation()
  const [nextSpeaker] = useNextHallSpeakerMutation()
  const [pauseHall] = usePauseHallMutation()
  const [pauseAllHalls] = usePauseAllHallsMutation()
  const [restartHall] = useRestartHallMutation()
  const [resetSpeakerRatings] = useResetSpeakerRatingsMutation()
  const [resetHallRatings] = useResetHallRatingsMutation()
  const [resetEventRatings] = useResetEventRatingsMutation()
  const [name, setName] = useState('')
  const [qrHallId, setQrHallId] = useState<string | null>(null)

  const qrHall = useMemo(() => halls.find((h) => h._id === qrHallId) || null, [halls, qrHallId])
  const hasLiveHall = halls.some((h) => h.status === 'live')

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) return
    await createHall({ eventId, name: name.trim() })
    setName('')
  }

  const downloadAll = (): void => {
    halls.forEach((h, i) => {
      setTimeout(() => {
        const svg = document.getElementById(`qr-hall-${h._id}`)
        if (!svg) return
        const serializer = new XMLSerializer()
        const source = serializer.serializeToString(svg)
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const canvas = document.createElement('canvas')
        canvas.width = 440
        canvas.height = 440
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const img = new Image()
        const url = URL.createObjectURL(blob)
        img.onload = () => {
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, 440, 440)
          ctx.drawImage(img, 20, 20, 400, 400)
          const a = document.createElement('a')
          a.href = canvas.toDataURL('image/png')
          a.download = `qr-hall-${h.num}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
        img.src = url
      }, i * 300)
    })
  }

  if (isLoading) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="18px" flexWrap="wrap" gap="10px">
        <Pill variant="outline" dot>
          {stats?.totalRatings ?? 0} {t('admin.ratingsToday')}
        </Pill>
        <Flex gap="8px" flexWrap="wrap">
          <GradientButton
            h="36px"
            fontSize="12px"
            variant="ghost"
            color="#FF6B6B"
            borderColor="rgba(255,100,100,0.45)"
            disabled={!hasLiveHall}
            onClick={() => {
              if (window.confirm(t('admin.confirmStopAllVoting'))) {
                void pauseAllHalls({ eventId })
              }
            }}
          >
            {t('admin.stopAllVoting')}
          </GradientButton>
          <GradientButton
            h="36px"
            fontSize="12px"
            variant="ghost"
            color="#FF6B6B"
            borderColor="rgba(255,100,100,0.45)"
            onClick={() => {
              if (window.confirm(t('admin.confirmResetEvent'))) {
                void resetEventRatings(eventId)
              }
            }}
          >
            {t('admin.resetAllRatings')}
          </GradientButton>
          <GradientButton h="36px" fontSize="12.5px" onClick={downloadAll} disabled={!halls.length}>
            {t('admin.downloadAllQr')}
          </GradientButton>
        </Flex>
      </Flex>

      <Flex gap="10px" mb="18px" flexWrap="wrap">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('admin.hallName')}
          bg={thColors.card}
          borderColor={thColors.border}
          color="white"
          borderRadius="30px"
          h="42px"
          maxW="320px"
          _placeholder={{ color: thColors.mutedDark }}
        />
        <GradientButton h="42px" onClick={handleAdd}>
          {t('admin.addHall')}
        </GradientButton>
      </Flex>

      {!halls.length ? (
        <Text color={thColors.textFaint}>{t('admin.noHalls')}</Text>
      ) : (
        <Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))" gap="15px">
          {halls.map((h) => {
            const live = h.status === 'live'
            const cur = h.currentSpeaker
            const url = getHallRateUrl(h.token)
            return (
              <SurfaceCard key={h._id} highlighted={live} opacity={live ? 1 : 0.88}>
                <Flex justify="space-between" align="center" gap="8px" mb="14px">
                  <Text fontSize="14.5px" fontWeight="800">
                    {h.name}
                  </Text>
                  <StatusBadge status={live ? 'live' : 'break'} />
                </Flex>

                <Flex gap="12px" align="center" mb="14px">
                  <AvatarInitials name={cur?.name || '—'} size={48} live={live} />
                  <Box minW={0}>
                    <Text fontSize="14px" fontWeight="700">
                      {cur?.name || '—'}
                    </Text>
                    <Text fontSize="11.5px" color={thColors.textFaint} lineHeight="1.35">
                      {cur ? `${cur.projectName} · ${cur.scheduledTime || ''}` : 'Нет спикера'}
                    </Text>
                  </Box>
                </Flex>

                <Flex gap="8px" mb="14px">
                  {[
                    {
                      v: h.ratingsCount != null && h.ratingsCount > 0 ? h.ratingsCount : '—',
                      l: t('admin.ratings'),
                      c: thColors.greenLight,
                    },
                    {
                      v: h.averageScore ? h.averageScore : '—',
                      l: t('admin.average'),
                      c: 'white',
                    },
                    { v: '—', l: t('admin.conversion'), c: 'white' },
                  ].map((m) => (
                    <Box
                      key={m.l}
                      flex="1"
                      bg={thColors.surface}
                      borderRadius="14px"
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

                <Flex
                  gap="10px"
                  align="center"
                  bg={thColors.surface}
                  borderRadius="16px"
                  p="11px 12px"
                  mb="14px"
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
                      {t('admin.qrPermanent')} №{h.num}
                    </Text>
                    <Text fontSize="10.5px" color={thColors.textFaint} lineHeight="1.35">
                      {h.qrNote}
                    </Text>
                  </Box>
                </Flex>

                <Flex gap="8px" mb="8px">
                  <GradientButton
                    flex="1"
                    h="42px"
                    borderRadius="14px"
                    variant={live ? 'key' : 'ghost'}
                    color={live ? undefined : thColors.greenLight}
                    borderColor={live ? undefined : thColors.green}
                    fontSize="12.5px"
                    onClick={() => nextSpeaker(h._id)}
                  >
                    {live ? t('admin.nextSpeaker') : t('admin.startSpeaker')}
                  </GradientButton>
                  <GradientButton
                    variant="secondary"
                    h="42px"
                    borderRadius="14px"
                    fontSize="12.5px"
                    onClick={() => setQrHallId(h._id)}
                  >
                    {t('admin.qrForSlide')}
                  </GradientButton>
                </Flex>

                <Flex gap="6px" flexWrap="wrap">
                  {live && (
                    <GradientButton
                      h="34px"
                      px="12px"
                      fontSize="11px"
                      variant="cyan"
                      borderRadius="12px"
                      onClick={() => pauseHall(h._id)}
                    >
                      {t('admin.pauseHall')}
                    </GradientButton>
                  )}
                  <GradientButton
                    h="34px"
                    px="12px"
                    fontSize="11px"
                    variant="ghost"
                    borderRadius="12px"
                    onClick={() => restartHall({ id: h._id, clearRatings: false })}
                  >
                    {t('admin.restartHall')}
                  </GradientButton>
                  <GradientButton
                    h="34px"
                    px="12px"
                    fontSize="11px"
                    variant="ghost"
                    borderRadius="12px"
                    color="#FFB4B4"
                    borderColor="rgba(255,100,100,0.4)"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmRestartClear'))) {
                        void restartHall({ id: h._id, clearRatings: true })
                      }
                    }}
                  >
                    {t('admin.restartHallClear')}
                  </GradientButton>
                  {cur && (
                    <GradientButton
                      h="34px"
                      px="12px"
                      fontSize="11px"
                      variant="ghost"
                      borderRadius="12px"
                      color="#FFB4B4"
                      borderColor="rgba(255,100,100,0.4)"
                      onClick={() => {
                        if (window.confirm(t('admin.confirmResetSpeaker'))) {
                          void resetSpeakerRatings(cur._id)
                        }
                      }}
                    >
                      {t('admin.resetCurrentRatings')}
                    </GradientButton>
                  )}
                  <GradientButton
                    h="34px"
                    px="12px"
                    fontSize="11px"
                    variant="ghost"
                    borderRadius="12px"
                    color="#FFB4B4"
                    borderColor="rgba(255,100,100,0.4)"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmResetHall'))) {
                        void resetHallRatings(h._id)
                      }
                    }}
                  >
                    {t('admin.resetHallRatings')}
                  </GradientButton>
                  <GradientButton
                    h="34px"
                    px="12px"
                    fontSize="11px"
                    variant="ghost"
                    borderRadius="12px"
                    color="#FF6B6B"
                    borderColor="rgba(255,80,80,0.5)"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmDeleteHall'))) {
                        void deleteHall(h._id)
                      }
                    }}
                  >
                    {t('admin.deleteHall')}
                  </GradientButton>
                </Flex>
              </SurfaceCard>
            )
          })}
        </Grid>
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

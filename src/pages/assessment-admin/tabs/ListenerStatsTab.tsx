import React, { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { AvatarInitials, GradientButton, Pill, SurfaceCard } from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import { useGetListenerStatsQuery } from '../../../__data__/api/listenerApi'
import { URLs } from '../../../__data__/urls'
import { t } from '../../../utils/locale'
import type { ListenerStatsBar } from '../../../types'

interface Props {
  eventId: string
}

type StatView = 'speakers' | 'conf'

const rankStyles = [
  { bg: 'linear-gradient(180deg,#4BE96A,#1FA53E)', c: '#04220C', sh: `0 3px 0 ${thColors.greenShadow}` },
  { bg: 'linear-gradient(180deg,#E8F2F7,#BFD4DE)', c: '#28404E', sh: '0 3px 0 #7E97A3' },
  { bg: 'linear-gradient(180deg,#3A70C2,#2A55A0)', c: '#fff', sh: '0 3px 0 #17325E' },
]

const CriterionBars: React.FC<{ bars: ListenerStatsBar[] }> = ({ bars }) => (
  <>
    {(bars.length ? bars : [1, 2, 3, 4].map(() => ({ name: '', val: 0, w: 0 })))
      .filter((b) => !b.name || !/\uFFFD|�/.test(b.name))
      .slice(0, 4)
      .map((b, bi) => (
        <Box key={bi}>
          <Text fontSize="11px" color={thColors.textFaint} mb="4px">
            {b.val ? b.val.toFixed(1) : '—'}
          </Text>
          <Box h="5px" bg="rgba(255,255,255,0.1)" borderRadius="3px" overflow="hidden">
            <Box w={`${b.w || 0}%`} h="100%" bg={thColors.gradientGreenShort} />
          </Box>
        </Box>
      ))}
  </>
)

const DistBars: React.FC<{ bar: ListenerStatsBar; highlight?: boolean }> = ({ bar, highlight }) => {
  const dist = bar.dist || [5, 4, 3, 2, 1].map((star) => ({ star, n: 0, w: 0 }))
  return (
    <Box bg={thColors.card} border={`1px solid ${thColors.border}`} borderRadius="14px" p="16px 18px">
      <Flex justify="space-between" align="baseline">
        <Text fontSize="13px" fontWeight="700">
          {bar.name}
        </Text>
        <Text fontSize="20px" fontWeight="800" color={highlight ? thColors.greenLight : 'white'}>
          {bar.val ? bar.val.toFixed(1) : '—'}
        </Text>
      </Flex>
      <Box h="6px" bg="rgba(255,255,255,0.1)" borderRadius="3px" overflow="hidden" mt="10px">
        <Box w={`${bar.w || 0}%`} h="100%" bg={thColors.gradientGreenShort} />
      </Box>
      <Flex direction="column" gap="5px" mt="12px">
        {dist.map((d) => (
          <Flex key={d.star} align="center" gap="8px">
            <Text w="10px" fontSize="10.5px" color="rgba(255,255,255,0.45)" textAlign="right">
              {d.star}
            </Text>
            <Box flex="1" h="5px" bg="rgba(255,255,255,0.07)" borderRadius="3px" overflow="hidden">
              <Box
                w={`${d.w || 0}%`}
                h="100%"
                bg={
                  d.star >= 4
                    ? thColors.gradientGreenShort
                    : d.star === 3
                      ? thColors.cyanLight
                      : 'rgba(255,255,255,0.25)'
                }
              />
            </Box>
            <Text w="30px" fontSize="10.5px" color="rgba(255,255,255,0.45)">
              {d.n}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}

export const ListenerStatsTab: React.FC<Props> = ({ eventId }) => {
  const [hallFilter, setHallFilter] = useState('all')
  const [statView, setStatView] = useState<StatView>('speakers')
  const { data, isLoading, isError } = useGetListenerStatsQuery({
    eventId,
    ...(hallFilter !== 'all' ? { hallId: hallFilter } : {}),
  })

  const exportCsv = (): void => {
    window.open(`${URLs.apiBase}/listener/stats/csv?eventId=${eventId}`, '_blank')
  }

  if (isLoading && !data) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  if (isError || !data) {
    return <Text color="#FF6B6B">{t('common.error', 'Не удалось загрузить статистику')}</Text>
  }

  const eventStats = data.eventStats

  return (
    <Box>
      <Flex gap="8px" mb="16px" flexWrap="wrap">
        <GradientButton
          h="36px"
          px="18px"
          fontSize="13px"
          fontWeight="600"
          variant={statView === 'speakers' ? 'primary' : 'ghost'}
          boxShadow="none"
          onClick={() => setStatView('speakers')}
        >
          {t('admin.statViewSpeakers')}
        </GradientButton>
        <GradientButton
          h="36px"
          px="18px"
          fontSize="13px"
          fontWeight="600"
          variant={statView === 'conf' ? 'primary' : 'ghost'}
          boxShadow="none"
          onClick={() => setStatView('conf')}
        >
          {t('admin.statViewConf')}
        </GradientButton>
      </Flex>

      {statView === 'conf' && (
        <Box>
          <Flex justify="space-between" align="center" mb="18px" flexWrap="wrap" gap="10px">
            <Text fontFamily="heading" fontSize="17px" fontWeight="700" letterSpacing="-0.4px">
              {t('admin.eventStatsTitle')}
            </Text>
            <Pill variant="outline" dot>
              {eventStats?.n ?? 0} {t('admin.confVotes')}
            </Pill>
          </Flex>

          {!eventStats || eventStats.n === 0 ? (
            <Box
              bg={thColors.card}
              border="1px dashed rgba(255,255,255,0.15)"
              borderRadius="12px"
              p="28px"
              textAlign="center"
              color="rgba(255,255,255,0.45)"
              fontSize="13px"
            >
              {t('admin.eventStatsEmpty')}
            </Box>
          ) : (
            <>
              <Box
                display="grid"
                gridTemplateColumns={{ base: '1fr', md: '300px 1fr' }}
                gap="16px"
                alignItems="stretch"
              >
                <Box
                  bgImage={thColors.gradientAdmin}
                  border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="16px"
                  p="26px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Text
                    fontSize="11px"
                    color="rgba(255,255,255,0.6)"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="0.6px"
                  >
                    {t('admin.confOverall')}
                  </Text>
                  <Text
                    fontFamily="heading"
                    fontSize="64px"
                    fontWeight="700"
                    lineHeight="1"
                    mt="10px"
                    bgGradient="linear(90deg, #4BE96A, #7CF29A, #4FC9F0)"
                    bgClip="text"
                    color="transparent"
                    style={{
                      backgroundImage: 'linear-gradient(90deg,#4BE96A,#7CF29A,#4FC9F0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {eventStats.total != null ? eventStats.total.toFixed(1) : '—'}
                  </Text>
                  <Text fontSize="13px" color="rgba(255,255,255,0.65)" mt="8px">
                    {t('admin.confOverallHint')}
                  </Text>
                  <Flex gap="16px" mt="22px">
                    <Box>
                      <Text fontSize="22px" fontWeight="800" color={thColors.greenLight}>
                        {eventStats.nps || '—'}
                      </Text>
                      <Text fontSize="10.5px" color="rgba(255,255,255,0.5)">
                        {t('admin.confNps')}
                      </Text>
                    </Box>
                    <Box w="1px" bg="rgba(255,255,255,0.2)" />
                    <Box>
                      <Text fontSize="22px" fontWeight="800">
                        {eventStats.conversion || '—'}
                      </Text>
                      <Text fontSize="10.5px" color="rgba(255,255,255,0.5)">
                        {t('admin.confConv')}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
                <Box display="grid" gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap="12px">
                  {(eventStats.bars || []).slice(0, 4).map((bar, i) => (
                    <DistBars key={bar.name} bar={bar} highlight={i === 0} />
                  ))}
                </Box>
              </Box>
              <Flex gap="8px" mt="18px" align="center" flexWrap="wrap">
                <Text fontSize="12px" color={thColors.textFaint} fontWeight="600">
                  {t('admin.eventTopReactions')}
                </Text>
                {eventStats.topReactions.length ? (
                  eventStats.topReactions.map((r, i) => (
                    <Pill key={r.label} variant={i === 0 ? 'green' : i === 3 ? 'cyan' : 'outline'}>
                      {r.label} ×{r.count}
                    </Pill>
                  ))
                ) : (
                  <Text fontSize="12px" color="rgba(255,255,255,0.35)">
                    —
                  </Text>
                )}
              </Flex>
            </>
          )}
        </Box>
      )}

      {statView === 'speakers' && (
        <Box>
          <Flex justify="space-between" align="center" mb="18px" flexWrap="wrap" gap="10px">
            <Text fontFamily="heading" fontSize="17px" fontWeight="700" letterSpacing="-0.4px">
              {t('admin.leaderboard')}
            </Text>
            <Flex gap="8px" flexWrap="wrap">
              <GradientButton
                h="32px"
                fontSize="12px"
                fontWeight="600"
                variant={hallFilter === 'all' ? 'primary' : 'ghost'}
                boxShadow="none"
                onClick={() => setHallFilter('all')}
              >
                {t('admin.allHalls')}
              </GradientButton>
              {data.halls.map((h) => (
                <GradientButton
                  key={h._id}
                  h="32px"
                  fontSize="12px"
                  fontWeight="600"
                  variant={hallFilter === h._id ? 'primary' : 'ghost'}
                  boxShadow="none"
                  onClick={() => setHallFilter(h._id)}
                >
                  {h.name}
                </GradientButton>
              ))}
              <GradientButton h="32px" fontSize="12px" variant="ghost" onClick={exportCsv}>
                {t('admin.exportCsv')}
              </GradientButton>
            </Flex>
          </Flex>

          <Box
            display={{ base: 'none', md: 'grid' }}
            gridTemplateColumns="44px 1.5fr repeat(4,1fr) 110px"
            gap="14px"
            px="18px"
            pb="10px"
            fontSize="10.5px"
            color="rgba(255,255,255,0.4)"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.6px"
          >
            <span />
            <span>{t('admin.colSpeakerShort')}</span>
            {(data.leaderboard[0]?.bars?.length
              ? data.leaderboard[0].bars.slice(0, 4).map((b) => b.name)
              : ['Контент', 'Подача', 'Слайды', 'Польза']
            ).map((name) => (
              <span key={name}>{name}</span>
            ))}
            <span style={{ textAlign: 'right' }}>{t('admin.colTotal')}</span>
          </Box>

          <Flex direction="column" gap="8px">
            {data.leaderboard.map((l, i) => {
              const rs = rankStyles[Math.min(i, 2)]
              return (
                <SurfaceCard
                  key={l.teamId}
                  highlighted={i === 0}
                  borderRadius="12px"
                  p="13px 18px"
                  display="grid"
                  gridTemplateColumns={{ base: '1fr', md: '44px 1.5fr repeat(4,1fr) 110px' }}
                  gap="14px"
                  alignItems="center"
                >
                  <Flex
                    w="36px"
                    h="36px"
                    borderRadius="11px"
                    bg={i < 3 ? rs.bg : thColors.keyUnsel}
                    boxShadow={i < 3 ? `${rs.sh}, inset 0 1px 0 rgba(255,255,255,0.3)` : '0 3px 0 #0B1118'}
                    color={i < 3 ? rs.c : thColors.mutedDark}
                    align="center"
                    justify="center"
                    fontWeight="800"
                    fontSize="15px"
                  >
                    {i + 1}
                  </Flex>
                  <Flex align="center" gap="11px" minW={0}>
                    <AvatarInitials name={l.name} size={38} />
                    <Box minW={0}>
                      <Text fontSize="13.5px" fontWeight="700">
                        {l.name}
                      </Text>
                      <Text fontSize="11px" color={thColors.textFaint} truncate>
                        {l.hall} · {l.n} {t('admin.ratingsCountSuffix')}
                      </Text>
                    </Box>
                  </Flex>
                  <CriterionBars bars={l.bars} />
                  <Box textAlign={{ base: 'left', md: 'right' }}>
                    <Text
                      fontSize="19px"
                      fontWeight="800"
                      color={i === 0 ? thColors.greenLight : 'white'}
                    >
                      {l.total}
                    </Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.4)">
                      {l.topReaction}
                    </Text>
                  </Box>
                </SurfaceCard>
              )
            })}
            {!data.leaderboard.length && (
              <Box
                bg={thColors.card}
                border="1px dashed rgba(255,255,255,0.15)"
                borderRadius="12px"
                p="28px"
                textAlign="center"
                color="rgba(255,255,255,0.45)"
                fontSize="13px"
              >
                {t('admin.leaderboardEmpty')}
              </Box>
            )}
          </Flex>

          <Flex gap="8px" mt="18px" align="center" flexWrap="wrap">
            <Text fontSize="12px" color={thColors.textFaint} fontWeight="600">
              {t('admin.topReactions')}
            </Text>
            {data.topReactions.length ? (
              data.topReactions.map((r, i) => (
                <Pill key={r.label} variant={i === 0 ? 'green' : i === 3 ? 'cyan' : 'outline'}>
                  {r.label} ×{r.count}
                </Pill>
              ))
            ) : (
              <Text fontSize="12px" color="rgba(255,255,255,0.35)">
                —
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  )
}

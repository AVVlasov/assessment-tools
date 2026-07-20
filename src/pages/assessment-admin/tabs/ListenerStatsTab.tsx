import React, { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { AvatarInitials, GradientButton, Pill, SurfaceCard } from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import { useGetListenerStatsQuery } from '../../../__data__/api/listenerApi'
import { URLs } from '../../../__data__/urls'
import { t } from '../../../utils/locale'

interface Props {
  eventId: string
}

const rankStyles = [
  { bg: 'linear-gradient(180deg,#4BE96A,#1FA53E)', c: '#04220C', sh: `0 3px 0 ${thColors.greenShadow}` },
  { bg: 'linear-gradient(180deg,#E8F2F7,#BFD4DE)', c: '#28404E', sh: '0 3px 0 #7E97A3' },
  { bg: 'linear-gradient(180deg,#3A70C2,#2A55A0)', c: '#fff', sh: '0 3px 0 #17325E' },
]

export const ListenerStatsTab: React.FC<Props> = ({ eventId }) => {
  const [hallFilter, setHallFilter] = useState('all')
  const { data, isLoading } = useGetListenerStatsQuery({
    eventId,
    hallId: hallFilter,
  })

  const exportCsv = (): void => {
    window.open(`${URLs.apiBase}/listener/stats/csv?eventId=${eventId}`, '_blank')
  }

  if (isLoading || !data) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  return (
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
        <span>Спикер</span>
        {(data.leaderboard[0]?.bars?.length
          ? data.leaderboard[0].bars.slice(0, 4).map((b) => b.name)
          : ['Контент', 'Подача', 'Слайды', 'Польза']
        ).map((name) => (
          <span key={name}>{name}</span>
        ))}
        <span style={{ textAlign: 'right' }}>Итог</span>
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
                    {l.hall} · {l.n} оценок
                  </Text>
                </Box>
              </Flex>
              {(l.bars.length ? l.bars : [1, 2, 3, 4].map(() => ({ name: '', val: 0, w: 0 })))
                .filter((b) => !b.name || !/\uFFFD|�/.test(b.name))
                .slice(0, 4)
                .map((b, bi) => (
                  <Box key={bi}>
                    <Text fontSize="11px" color={thColors.textFaint} mb="4px">
                      {b.val ? b.val.toFixed(1) : '—'}
                    </Text>
                    <Box h="5px" bg="rgba(255,255,255,0.1)" borderRadius="3px" overflow="hidden">
                      <Box
                        w={`${b.w || 0}%`}
                        h="100%"
                        bg={thColors.gradientGreenShort}
                      />
                    </Box>
                  </Box>
                ))}
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
  )
}

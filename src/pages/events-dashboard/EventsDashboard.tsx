import React, { useMemo, useState } from 'react'
import { Box, Container, Flex, Grid, Spinner, Text } from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useGetEventsQuery } from '../../__data__/api/eventApi'
import { EventCard } from '../../components/events'
import { Event } from '../../types'
import { GradientButton, PageShell } from '../../components/tehnohub'
import { thColors } from '../../theme'
import { t } from '../../utils/locale'

interface GroupedEvents {
  [year: string]: {
    [month: string]: Event[]
  }
}

const monthNames = [
  t('events.months.january'),
  t('events.months.february'),
  t('events.months.march'),
  t('events.months.april'),
  t('events.months.may'),
  t('events.months.june'),
  t('events.months.july'),
  t('events.months.august'),
  t('events.months.september'),
  t('events.months.october'),
  t('events.months.november'),
  t('events.months.december'),
]

const HERO_SLIDES = [
  {
    titleKey: 'events.hero.slide1Title',
    subKey: 'events.hero.slide1Sub',
  },
  {
    titleKey: 'events.hero.slide2Title',
    subKey: 'events.hero.slide2Sub',
  },
  {
    titleKey: 'events.hero.slide3Title',
    subKey: 'events.hero.slide3Sub',
  },
] as const

export const EventsDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useGetEventsQuery()
  const [heroIndex, setHeroIndex] = useState(0)

  const events = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return []
  }, [data])

  const groupedEvents = useMemo(() => {
    const grouped: GroupedEvents = {}
    events.forEach((event) => {
      const date = new Date(event.eventDate)
      const year = date.getFullYear().toString()
      const month = date.getMonth()
      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = []
      grouped[year][month].push(event)
    })
    return grouped
  }, [events])

  const sortedYears = Object.keys(groupedEvents).sort((a, b) => parseInt(b) - parseInt(a))
  const slide = HERO_SLIDES[heroIndex]

  if (isLoading) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Spinner size="xl" color={thColors.green} />
      </Flex>
    )
  }

  return (
    <PageShell>
      <Box bgImage={thColors.gradientAdmin} pb="28px" borderRadius="0 0 26px 26px">
        <Container maxW="1400px" pt="28px" px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap="16px">
            <Box flex="1" minW="240px">
              <Flex align="center" gap="10px" mb="14px" role="tablist" aria-label={t('events.hero.dotsLabel')}>
                {HERO_SLIDES.map((_, i) => {
                  const active = i === heroIndex
                  return (
                    <Box
                      key={i}
                      as="button"
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`${t('events.hero.slideLabel')} ${i + 1}`}
                      w="11px"
                      h="11px"
                      borderRadius={active ? '4px' : '50%'}
                      bg={active ? 'white' : 'transparent'}
                      border="1.5px solid white"
                      cursor="pointer"
                      onClick={() => setHeroIndex(i)}
                      transition="all 0.2s"
                    />
                  )
                })}
              </Flex>
              <Text
                fontFamily="heading"
                fontSize={{ base: '22px', md: '28px' }}
                fontWeight="700"
                lineHeight="1.15"
                key={`title-${heroIndex}`}
              >
                {t(slide.titleKey)}
              </Text>
              <Text fontSize="14px" color={thColors.textDim} mt="8px" maxW="520px" key={`sub-${heroIndex}`}>
                {t(slide.subKey)}
              </Text>
            </Box>
            <GradientButton h="48px" onClick={() => navigate('/assessment-tools/events/create')}>
              <FiPlus style={{ marginRight: 8 }} />
              {t('events.createNew')}
            </GradientButton>
          </Flex>
        </Container>
      </Box>

      <Container maxW="1400px" py={8} px={{ base: 4, md: 6 }}>
        {events.length === 0 ? (
          <Box
            bg={thColors.card}
            p={12}
            borderRadius="22px"
            border={`1px solid ${thColors.border}`}
            textAlign="center"
          >
            <Text fontFamily="heading" fontSize="18px" color={thColors.muted} mb={4}>
              {t('events.noEvents')}
            </Text>
            <Text color={thColors.textDim} mb={6}>
              Создайте первое мероприятие, чтобы начать работу
            </Text>
            <GradientButton onClick={() => navigate('/assessment-tools/events/create')}>
              {t('events.createNew')}
            </GradientButton>
          </Box>
        ) : (
          <Flex direction="column" gap={8}>
            {sortedYears.map((year) => (
              <Box key={year}>
                <Text
                  fontFamily="heading"
                  fontSize="20px"
                  fontWeight="700"
                  color={thColors.greenLight}
                  mb={6}
                  pb={3}
                  borderBottom={`1px solid ${thColors.border}`}
                >
                  {year}
                </Text>
                <Flex direction="column" gap={6}>
                  {Object.keys(groupedEvents[year])
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map((monthIndex) => (
                      <Box key={`${year}-${monthIndex}`}>
                        <Text fontSize="15px" fontWeight="700" color={thColors.muted} mb={4}>
                          {monthNames[parseInt(monthIndex)]}
                        </Text>
                        <Grid
                          templateColumns={{
                            base: '1fr',
                            md: 'repeat(2, 1fr)',
                            lg: 'repeat(3, 1fr)',
                          }}
                          gap={4}
                        >
                          {groupedEvents[year][monthIndex].map((event) => (
                            <EventCard key={event._id} event={event} />
                          ))}
                        </Grid>
                      </Box>
                    ))}
                </Flex>
              </Box>
            ))}
          </Flex>
        )}
      </Container>
    </PageShell>
  )
}

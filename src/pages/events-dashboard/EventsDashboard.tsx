import React, { useState, useMemo } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Grid,
  Spinner
} from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { useGetEventsQuery } from '../../__data__/api/eventApi'
import { EventWizard, EventCard } from '../../components/events'
import { Event } from '../../types'

interface GroupedEvents {
  [year: string]: {
    [month: string]: Event[]
  }
}

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

export const EventsDashboard: React.FC = () => {
  const { data, isLoading, refetch } = useGetEventsQuery()
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  // Ensure events is always an array
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

      if (!grouped[year]) {
        grouped[year] = {}
      }

      if (!grouped[year][month]) {
        grouped[year][month] = []
      }

      grouped[year][month].push(event)
    })

    return grouped
  }, [events])

  const sortedYears = Object.keys(groupedEvents).sort((a, b) => parseInt(b) - parseInt(a))

  const handleWizardSuccess = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <Box minH="100vh" bg="#0A0A0A" color="white" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="#D4FF00" />
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white">
      <Container maxW="1400px" py={8}>
        <Stack gap={8}>
          {/* Header */}
          <Stack direction="row" justify="space-between" align="center">
            <Box>
              <Heading
                fontSize={{ base: '2xl', md: '4xl' }}
                fontWeight="bold"
                color="#D4FF00"
              >
                Мероприятия
              </Heading>
              <Text fontSize="md" color="#B0B0B0" mt={2}>
                Управление мероприятиями и оценкой команд
              </Text>
            </Box>

            <Button
              leftIcon={<FiPlus />}
              bg="#D4FF00"
              color="#0A0A0A"
              fontWeight="bold"
              size="lg"
              px={6}
              _hover={{ bg: '#C4EF00' }}
              onClick={() => setIsWizardOpen(true)}
            >
              Создать мероприятие
            </Button>
          </Stack>

          {/* Events grouped by year and month */}
          {events.length === 0 ? (
            <Box
              bg="#1A1A1A"
              p={12}
              borderRadius="lg"
              border="1px solid #333333"
              textAlign="center"
            >
              <Heading size="md" color="#666666" mb={4}>
                Нет мероприятий
              </Heading>
              <Text color="#B0B0B0" mb={6}>
                Создайте первое мероприятие, чтобы начать работу
              </Text>
              <Button
                leftIcon={<FiPlus />}
                bg="#D4FF00"
                color="#0A0A0A"
                fontWeight="bold"
                _hover={{ bg: '#C4EF00' }}
                onClick={() => setIsWizardOpen(true)}
              >
                Создать мероприятие
              </Button>
            </Box>
          ) : (
            <Stack gap={8}>
              {sortedYears.map((year) => (
                <Box key={year}>
                  <Heading
                    size="lg"
                    color="#D4FF00"
                    mb={6}
                    pb={3}
                    borderBottom="2px solid #333333"
                  >
                    {year}
                  </Heading>

                  <Stack gap={6}>
                    {Object.keys(groupedEvents[year])
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((monthIndex) => {
                        const monthEvents = groupedEvents[year][monthIndex]
                        return (
                          <Box key={`${year}-${monthIndex}`}>
                            <Heading
                              size="md"
                              color="#B0B0B0"
                              mb={4}
                            >
                              {monthNames[parseInt(monthIndex)]}
                            </Heading>

                            <Grid
                              templateColumns={{
                                base: '1fr',
                                md: 'repeat(2, 1fr)',
                                lg: 'repeat(3, 1fr)'
                              }}
                              gap={4}
                            >
                              {monthEvents.map((event) => (
                                <EventCard key={event._id} event={event} />
                              ))}
                            </Grid>
                          </Box>
                        )
                      })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      <EventWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </Box>
  )
}


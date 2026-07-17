import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Flex, Spinner, Text } from '@chakra-ui/react'
import {
  AvatarInitials,
  BrandMark,
  GradientButton,
  KeyOption,
  Pill,
  StepProgress,
} from '../../components/tehnohub'
import { thColors } from '../../theme'
import {
  useGetExpertByTokenQuery,
  useGetActiveTeamForVotingQuery,
  useGetCriteriaQuery,
  useCreateRatingMutation,
  useGetExpertRatingsQuery,
  useGetEventQuery,
} from '../../__data__/api'
import type { CriterionItem, EventType, RatingItem, TeamType } from '../../types'
import { getEventTypeConfig } from '../../utils/eventTypeConfig'
import { t } from '../../utils/locale'

const TYPE_LABELS: Record<TeamType, string> = {
  team: 'Команда',
  participant: 'Участница',
  speaker: 'Спикер',
  event: 'Мероприятие',
}

const PAGE_TITLES: Record<EventType, string> = {
  hackathon: t('expertPage.titleHackathon'),
  queen_of_code: t('expertPage.titleQueen'),
  conference: t('expertPage.titleConference'),
}

const defaultOptions = (max = 5) =>
  Array.from({ length: max }, (_, i) => ({
    title: `${i + 1}`,
    subtitle: i === 0 ? 'слабо' : i === max - 1 ? 'отлично' : '',
  }))

type Screen = 'wait' | 'start' | 'step' | 'done'

export const AssessmentExpertPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { data: expert, isLoading: expertLoading } = useGetExpertByTokenQuery(token || '', {
    skip: !token,
  })
  const { data: event } = useGetEventQuery(expert?.eventId || '', { skip: !expert?.eventId })
  const { data: activeTeam, isLoading: teamLoading } = useGetActiveTeamForVotingQuery(
    { eventId: expert?.eventId },
    { skip: !expert?.eventId, pollingInterval: 3000 }
  )
  const { data: criteriaBlocks = [], isLoading: criteriaLoading } = useGetCriteriaQuery(
    activeTeam ? { eventId: activeTeam.eventId, criteriaType: activeTeam.type } : undefined,
    { skip: !activeTeam }
  )
  const [createRating] = useCreateRatingMutation()
  const { data: expertRatings = [] } = useGetExpertRatingsQuery(expert?._id || '', {
    skip: !expert,
    pollingInterval: 10000,
  })

  const [screen, setScreen] = useState<Screen>('wait')
  const [stepIdx, setStepIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const advRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTeamId = useRef<string | null>(null)

  const eventType: EventType = event?.eventType || 'hackathon'
  const config = getEventTypeConfig(eventType)
  const allCriteria: CriterionItem[] = useMemo(
    () => criteriaBlocks.flatMap((b) => b.criteria),
    [criteriaBlocks]
  )

  const alreadyRated = useMemo(() => {
    if (!activeTeam || !expert) return false
    return expertRatings.some(
      (r) => typeof r.teamId === 'object' && r.teamId._id === activeTeam._id
    )
  }, [activeTeam, expert, expertRatings])

  useEffect(() => {
    if (!activeTeam) {
      setScreen('wait')
      lastTeamId.current = null
      return
    }
    if (lastTeamId.current !== activeTeam._id) {
      lastTeamId.current = activeTeam._id
      setScores(Array(allCriteria.length).fill(0))
      setStepIdx(0)
      setScreen(alreadyRated ? 'done' : 'start')
    }
  }, [activeTeam, allCriteria.length, alreadyRated])

  useEffect(() => {
    setScores((prev) => {
      if (prev.length === allCriteria.length) return prev
      return Array(allCriteria.length).fill(0)
    })
  }, [allCriteria.length])

  const submit = async (finalScores: number[]): Promise<void> => {
    if (!activeTeam || !expert) return
    const ratingsArray: RatingItem[] = allCriteria.map((criterion, i) => ({
      criteriaId: criteriaBlocks.find((b) => b.criteria.includes(criterion))?._id || '',
      criterionName: criterion.name,
      score: finalScores[i] || 0,
    }))
    try {
      setSaveStatus('saving')
      await createRating({
        eventId: activeTeam.eventId,
        expertId: expert._id,
        teamId: activeTeam._id,
        ratings: ratingsArray,
      }).unwrap()
      setSaveStatus('saved')
      setScreen('done')
    } catch {
      setSaveStatus('error')
    }
  }

  const selectOption = (score: number): void => {
    const next = [...scores]
    next[stepIdx] = score
    setScores(next)
    if (advRef.current) clearTimeout(advRef.current)
    advRef.current = setTimeout(() => {
      if (stepIdx < allCriteria.length - 1) setStepIdx((s) => s + 1)
      else void submit(next)
    }, 450)
  }

  if (expertLoading || (teamLoading && !activeTeam) || (criteriaLoading && activeTeam)) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Spinner color={thColors.green} size="xl" />
      </Flex>
    )
  }

  if (!expert) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Text color="#FF6B6B" fontSize="xl">
          Ссылка недействительна
        </Text>
      </Flex>
    )
  }

  const crit = allCriteria[stepIdx]
  const cur = scores[stepIdx] || 0

  return (
    <Flex minH="100vh" bg={thColors.bg} justify="center" align="flex-start" py="28px" px="16px">
      <Box
        w="390px"
        maxW="100%"
        borderRadius="34px"
        overflow="hidden"
        border={`1px solid ${thColors.border}`}
        boxShadow="0 30px 80px rgba(0,0,0,0.6)"
      >
        {screen === 'wait' && (
          <Flex
            direction="column"
            minH="720px"
            p="22px"
            bgImage={thColors.gradientHero}
            color="white"
          >
            <Flex justify="space-between" align="center">
              <BrandMark />
              <Pill>{PAGE_TITLES[eventType]}</Pill>
            </Flex>
            <Flex flex="1" direction="column" justify="center" gap="12px">
              <Text fontFamily="heading" fontSize="26px" fontWeight="700">
                {t('expertPage.waiting')}
              </Text>
              <Text color={thColors.textDim} fontSize="14px" lineHeight="1.5">
                {t('expertPage.waitingHint')}
              </Text>
              <Text fontSize="13px" color={thColors.muted} mt="8px">
                {expert.fullName}
                {event?.name ? ` · ${event.name}` : ''}
              </Text>
            </Flex>
          </Flex>
        )}

        {screen === 'start' && activeTeam && (
          <Flex
            direction="column"
            minH="720px"
            p="22px"
            bgImage={thColors.gradientHero}
            color="white"
          >
            <Flex justify="space-between" align="center">
              <BrandMark />
              <Pill variant="green">{TYPE_LABELS[activeTeam.type]}</Pill>
            </Flex>
            <Box
              bg="rgba(255,255,255,0.08)"
              border="1px solid rgba(255,255,255,0.15)"
              borderRadius="22px"
              p="18px"
              mt="28px"
            >
              <Flex gap="14px" align="center">
                <AvatarInitials name={activeTeam.name} size={56} />
                <Box>
                  <Text fontSize="16px" fontWeight="800">
                    {activeTeam.name}
                  </Text>
                  {config.showProjectFields && activeTeam.projectName && (
                    <Text fontSize="13px" color={thColors.textDim} mt="2px">
                      {activeTeam.projectName}
                    </Text>
                  )}
                </Box>
              </Flex>
              <Box
                display="grid"
                gridTemplateColumns="repeat(2, minmax(0, 1fr))"
                gap="7px"
                mt="16px"
              >
                {allCriteria.slice(0, 4).map((c) => (
                  <Pill
                    key={c.name}
                    w="100%"
                    justifyContent="center"
                    textAlign="center"
                    fontSize="10.5px"
                    textTransform="uppercase"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {c.tag || c.name.split(' ')[0]}
                  </Pill>
                ))}
              </Box>
            </Box>
            <Text fontSize="13px" color={thColors.textDim} mt="16px">
              {t('expertPage.scaleHint')}
            </Text>
            <Box mt="auto">
              <GradientButton
                w="100%"
                h="58px"
                fontSize="16px"
                onClick={() => {
                  setStepIdx(0)
                  setScores(Array(allCriteria.length).fill(0))
                  setScreen('step')
                }}
                disabled={!allCriteria.length}
              >
                {t('listener.startCta')}
              </GradientButton>
            </Box>
          </Flex>
        )}

        {screen === 'step' && crit && activeTeam && (
          <Flex direction="column" minH="720px" color="white" bgImage={thColors.gradientHero}>
            <Box px="20px" pt="18px">
              <Flex justify="space-between" align="center">
                <Pill>{activeTeam.name}</Pill>
                <Pill fontWeight="700">
                  {stepIdx + 1} / {allCriteria.length}
                </Pill>
              </Flex>
              <StepProgress total={allCriteria.length} current={stepIdx} />
              <Box mt="22px">
                <Pill textTransform="uppercase">{crit.tag || crit.name}</Pill>
                <Text
                  fontFamily="heading"
                  fontSize="22px"
                  fontWeight="700"
                  mt="13px"
                  lineHeight="1.2"
                >
                  {crit.name}
                </Text>
                {crit.hint && (
                  <Text fontSize="13px" color={thColors.textDim} mt="7px">
                    {crit.hint}
                  </Text>
                )}
              </Box>
            </Box>
            <Flex
              flex="1"
              direction="column"
              gap="9px"
              bg={thColors.surface}
              borderRadius="28px 28px 0 0"
              mt="18px"
              px="18px"
              py="20px"
            >
              {(crit.options?.length ? crit.options : defaultOptions(crit.maxScore || 5)).map(
                (o, i) => (
                  <KeyOption
                    key={`${crit.name}-${i}`}
                    num={i + 1}
                    title={o.title}
                    subtitle={o.subtitle}
                    selected={cur === i + 1}
                    onClick={() => selectOption(i + 1)}
                  />
                )
              )}
              <Flex gap="10px" mt="auto" pt="10px">
                <GradientButton
                  variant="ghost"
                  h="52px"
                  onClick={() =>
                    stepIdx > 0 ? setStepIdx((s) => s - 1) : setScreen('start')
                  }
                >
                  {t('listener.back')}
                </GradientButton>
                <GradientButton
                  flex="1"
                  h="52px"
                  disabled={!cur}
                  onClick={() => {
                    if (stepIdx < allCriteria.length - 1) setStepIdx((s) => s + 1)
                    else void submit(scores)
                  }}
                >
                  {!cur
                    ? t('listener.pickKey')
                    : stepIdx < allCriteria.length - 1
                      ? t('listener.next')
                      : t('expertPage.saveButton')}
                </GradientButton>
              </Flex>
            </Flex>
          </Flex>
        )}

        {screen === 'done' && (
          <Flex
            direction="column"
            minH="720px"
            p="22px"
            bg={thColors.surface}
            color="white"
            align="center"
            justify="center"
            textAlign="center"
            gap="14px"
          >
            <Flex
              w="100px"
              h="100px"
              borderRadius="26px"
              bg="linear-gradient(180deg,#4BE96A,#1FA53E)"
              boxShadow={`0 9px 0 ${thColors.greenShadow}`}
              align="center"
              justify="center"
              transform="rotate(-6deg)"
              animation="popIn 0.5s ease"
            >
              <Text fontSize="40px" color="#04220C" fontWeight="800">
                ✓
              </Text>
            </Flex>
            <Text fontFamily="heading" fontSize="24px" fontWeight="700">
              {t('listener.doneTitle')}
              <br />
              {t('listener.doneTitleProd')}
            </Text>
            <Text color={thColors.textDim} fontSize="14px">
              {saveStatus === 'error' ? t('expertPage.error') : t('expertPage.done')}
            </Text>
            {activeTeam && (
              <Text fontSize="13px" color={thColors.muted}>
                {activeTeam.name}
              </Text>
            )}
            <Text fontSize="12px" color={thColors.textFaint} mt="8px">
              {t('expertPage.waitingHint')}
            </Text>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}

export default AssessmentExpertPage

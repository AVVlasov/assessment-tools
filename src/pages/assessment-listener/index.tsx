import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Spinner } from '@chakra-ui/react'
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
  useCreateListenerRatingMutation,
  useGetListenerHallQuery,
  useUpdateListenerReactionsMutation,
} from '../../__data__/api'
import type { ListenerCriterion, ListenerTargetType } from '../../types'
import { t } from '../../utils/locale'

type Screen = 'start' | 'step' | 'done'
type Mode = 'speaker' | 'conf'

const SESSION_KEY = 'th-listener-session'

const getSessionId = (): string => {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = `ls_${Math.random().toString(36).slice(2)}_${Date.now()}`
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return `ls_${Date.now()}`
  }
}

const defaultOptions = (max = 5) =>
  Array.from({ length: max }, (_, i) => ({
    title: `${i + 1}`,
    subtitle: i === 0 ? 'слабо' : i === max - 1 ? 'отлично' : '',
  }))

export const AssessmentListenerPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = useMemo(() => getSessionId(), [])
  const { data, isLoading, error, refetch } = useGetListenerHallQuery(
    { token, sessionId },
    {
      skip: !token,
      pollingInterval: 5000,
    }
  )
  const [createRating] = useCreateListenerRatingMutation()
  const [updateReactions] = useUpdateListenerReactionsMutation()
  const reactionSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mode, setMode] = useState<Mode>(() => (searchParams.get('mode') === 'conf' ? 'conf' : 'speaker'))
  const [screen, setScreen] = useState<Screen>('start')
  const [stepIdx, setStepIdx] = useState(0)
  const [ratings, setRatings] = useState<number[]>([])
  const [reactions, setReactions] = useState<Record<string, boolean>>({})
  const [startAt, setStartAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [userAvg, setUserAvg] = useState('—')
  const advRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const criteria = useMemo((): ListenerCriterion[] => {
    if (!data) return []
    if (mode === 'conf') return data.criteria.event
    if (data.isWorkshop && data.criteria.workshop?.length) return data.criteria.workshop
    if (data.isPanel && data.criteria.panel.length) return data.criteria.panel
    return data.criteria.speaker
  }, [data, mode])

  useEffect(() => {
    setRatings(Array(criteria.length).fill(0))
    setStepIdx(0)
  }, [criteria.length, mode, data?.currentSpeaker?._id])

  const crit = criteria[stepIdx]
  const curRating = ratings[stepIdx] || 0
  const speaker = data?.currentSpeaker
  const isLive = data?.hall.status === 'live' && !!speaker

  useEffect(() => {
    if (mode === 'conf' || screen !== 'step' || isLive) return
    if (advRef.current) clearTimeout(advRef.current)
    setScreen('start')
    setRatings([])
    setReactions({})
    setStepIdx(0)
  }, [isLive, mode, screen])

  const startFlow = (): void => {
    setScreen('step')
    setStepIdx(0)
    setRatings(Array(criteria.length).fill(0))
    setReactions({})
    setStartAt(Date.now())
  }

  const finish = async (finalRatings: number[]): Promise<void> => {
    if (!data) return
    const elapsedSec = Math.round((Date.now() - startAt) / 1000)
    setElapsed(elapsedSec)
    const scored = finalRatings.filter((r) => r > 0)
    const avg = scored.length
      ? (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)
      : '—'
    setUserAvg(avg)

    const targetType: ListenerTargetType =
      mode === 'conf'
        ? 'event'
        : data.isWorkshop
          ? 'workshop'
          : data.isPanel
            ? 'panel'
            : 'speaker'

    const scores = criteria.map((c, i) => {
      const score = finalRatings[i] || 1
      const opt = (c.options?.length ? c.options : defaultOptions())[score - 1]
      return {
        criterionName: c.name,
        tag: c.tag,
        score,
        optionTitle: opt?.title || '',
      }
    })

    try {
      await createRating({
        eventId: data.event._id,
        hallId: data.hall._id,
        teamId: mode === 'conf' ? null : speaker?._id || null,
        targetType,
        sessionId,
        scores,
        reactions: Object.keys(reactions).filter((k) => reactions[k]),
        elapsedSeconds: elapsedSec,
      }).unwrap()
    } catch {
      /* keep done screen even if save fails */
    }
    setScreen('done')
  }

  const selectOption = (score: number): void => {
    const next = [...ratings]
    next[stepIdx] = score
    setRatings(next)
    if (advRef.current) clearTimeout(advRef.current)
    advRef.current = setTimeout(() => {
      if (stepIdx < criteria.length - 1) {
        setStepIdx((s) => s + 1)
      } else {
        void finish(next)
      }
    }, 450)
  }

  useEffect(() => {
    if (screen !== 'step') return
    const onKey = (e: KeyboardEvent): void => {
      const n = Number(e.key)
      if (n >= 1 && n <= 5) selectOption(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, stepIdx, criteria.length, ratings])

  const stepBack = (): void => {
    if (stepIdx > 0) setStepIdx((s) => s - 1)
    else setScreen('start')
  }

  const persistReactions = (next: Record<string, boolean>): void => {
    if (!data) return
    const targetType: ListenerTargetType =
      mode === 'conf'
        ? 'event'
        : data.isWorkshop
          ? 'workshop'
          : data.isPanel
            ? 'panel'
            : 'speaker'
    const list = Object.keys(next).filter((k) => next[k])
    if (reactionSaveRef.current) clearTimeout(reactionSaveRef.current)
    reactionSaveRef.current = setTimeout(() => {
      void updateReactions({
        eventId: data.event._id,
        teamId: mode === 'conf' ? null : speaker?._id || null,
        targetType,
        sessionId,
        reactions: list,
      })
    }, 500)
  }

  const toggleReaction = (label: string): void => {
    setReactions((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      if (screen === 'done') persistReactions(next)
      return next
    })
  }

  const startConf = (): void => {
    if (reactionSaveRef.current) clearTimeout(reactionSaveRef.current)
    setMode('conf')
    setScreen('start')
    setStepIdx(0)
    setRatings([])
    setReactions({})
  }

  const goHome = (): void => {
    if (reactionSaveRef.current) clearTimeout(reactionSaveRef.current)
    setMode('speaker')
    setScreen('start')
    setStepIdx(0)
    setRatings([])
    setReactions({})
    void refetch()
  }

  if (isLoading) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Spinner color={thColors.green} size="xl" />
      </Flex>
    )
  }

  if (error || !data) {
    return (
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center" p={6}>
        <Text color="#FF6B6B">{t('listener.error')}</Text>
      </Flex>
    )
  }

  const reactionList =
    mode === 'conf'
      ? data.reactions.event
      : data.isWorkshop
        ? data.reactions.workshop || data.reactions.speaker
        : data.reactions.speaker
  const chips = criteria.map((c) => c.tag || c.name)
  const isConf = mode === 'conf'
  const displayName = isConf
    ? data.event.name
    : [speaker?.name, ...(speaker?.coSpeakers || [])].filter(Boolean).join(' + ') ||
      t('listener.noSpeaker')
  const displayTalk = isConf
    ? t('listener.confTalkMeta')
    : speaker?.projectName || ''
  const displayMeta = isConf
    ? [data.event.location, data.event.eventDate ? new Date(data.event.eventDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '']
        .filter(Boolean)
        .join(' · ')
    : [
        speaker?.org ||
          (data.isPanel && speaker?.coSpeakers?.length
            ? `${(speaker.coSpeakers?.length || 0) + 1} ${t('listener.panelSpeakers')}`
            : ''),
        speaker?.scheduledTime,
      ]
        .filter(Boolean)
        .join(' · ')
  const displayInitials = isConf ? 'ТК' : undefined

  type ErrorType = 'ended' | 'already' | 'closed'
  const errorType: ErrorType | null = (() => {
    if (screen !== 'start') return null
    if (isConf) return data.alreadyRatedEvent ? 'already' : null
    if (data.eventEnded) return 'ended'
    if (data.alreadyRatedSpeaker) return 'already'
    if (!isLive) return 'closed'
    return null
  })()

  const prev = isConf ? data.previousEventRating : data.previousSpeakerRating
  const sentAt = prev?.createdAt
    ? new Date(prev.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const nextTalkTime = data.nextSpeaker?.scheduledTime || data.speakers.find((s, i) => {
    const curId = speaker?._id
    const curIdx = data.speakers.findIndex((x) => x._id === curId)
    return curIdx >= 0 && i === curIdx + 1
  })?.scheduledTime

  const errorConfig: Record<
    ErrorType,
    {
      badge: string
      icon: string
      iconBg: string
      iconShadow: string
      iconColor: string
      title: string
      sub: string
      foot: string
      stats: boolean
      primaryLabel: string
      primaryAction: () => void
      ghostLabel: string
      ghostAction: () => void
    }
  > = {
    closed: {
      badge: `${t('listener.hallBadge')} ${data.hall.name}`,
      icon: '‖',
      iconBg: 'linear-gradient(180deg,#57C8F2,#2A8FC0)',
      iconShadow: '0 9px 0 #17567A,0 0 50px rgba(0,174,239,.35),inset 0 3px 0 rgba(255,255,255,.4)',
      iconColor: '#03293C',
      title: t('listener.closedTitle'),
      sub: t('listener.closedSub'),
      foot: t('listener.closedFoot'),
      stats: false,
      primaryLabel: t('listener.checkAgain'),
      primaryAction: () => void refetch(),
      ghostLabel: t('listener.rateWholeConf'),
      ghostAction: startConf,
    },
    ended: {
      badge: t('listener.endedBadge'),
      icon: '∎',
      iconBg: 'linear-gradient(180deg,#57C8F2,#2A8FC0)',
      iconShadow: '0 9px 0 #17567A,0 0 50px rgba(0,174,239,.35),inset 0 3px 0 rgba(255,255,255,.4)',
      iconColor: '#03293C',
      title: t('listener.endedTitle'),
      sub: t('listener.endedSub'),
      foot: t('listener.endedFoot'),
      stats: false,
      primaryLabel: t('listener.rateWholeConf'),
      primaryAction: startConf,
      ghostLabel: t('listener.whereRecordings'),
      ghostAction: goHome,
    },
    already: {
      badge: isConf ? t('listener.confBadge') : `${t('listener.hallBadge')} ${data.hall.name}`,
      icon: '✓',
      iconBg: 'linear-gradient(180deg,#4BE96A,#1FA53E)',
      iconShadow: '0 9px 0 #0F6B26,0 0 50px rgba(61,220,80,.4),inset 0 3px 0 rgba(255,255,255,.4)',
      iconColor: '#04220C',
      title: isConf ? t('listener.alreadyConfTitle') : t('listener.alreadyTitle'),
      sub: isConf ? t('listener.alreadyConfSub') : t('listener.alreadySub'),
      foot: nextTalkTime
        ? `${t('listener.nextTalk')} — ${nextTalkTime}`
        : t('listener.alreadyFoot'),
      stats: true,
      primaryLabel: isConf ? t('listener.backHome') : t('listener.rateWholeConf'),
      primaryAction: isConf ? goHome : startConf,
      ghostLabel: isConf ? t('listener.refresh') : t('listener.waitNext'),
      ghostAction: () => void refetch(),
    },
  }
  const errDef = errorType ? errorConfig[errorType] : null

  const phone = (
    <Box
      w="390px"
      maxW="100%"
      borderRadius="28px"
      overflow="hidden"
      border={`1px solid ${thColors.border}`}
      boxShadow="0 30px 80px rgba(0,0,0,0.6)"
    >
      {screen === 'start' && errDef && (
        <Flex
          direction="column"
          minH="780px"
          color="white"
          p="22px"
          bg={thColors.bg}
          bgImage={thColors.gradientHero}
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          boxSizing="border-box"
          position="relative"
          overflow="hidden"
        >
          <Flex position="relative" justify="space-between" align="center">
            <BrandMark />
            <Pill variant="outline" fontSize="11.5px" fontWeight="500" border="1px solid rgba(255,255,255,0.7)" px="13px" py="5px">
              {errDef.badge}
            </Pill>
          </Flex>
          <Flex flex="1" direction="column" justify="center" textAlign="center">
            <Flex
              w="88px"
              h="88px"
              mx="auto"
              borderRadius="22px"
              bg={errDef.iconBg}
              align="center"
              justify="center"
              transform="rotate(-6deg)"
              boxShadow={errDef.iconShadow}
            >
              <Text fontFamily="heading" fontSize="32px" fontWeight="700" color={errDef.iconColor}>
                {errDef.icon}
              </Text>
            </Flex>
            <Text
              fontFamily="heading"
              fontSize="22px"
              fontWeight="700"
              letterSpacing="-0.6px"
              lineHeight="1.2"
              mt="22px"
            >
              {errDef.title}
            </Text>
            <Text fontSize="13.5px" color={thColors.textDim} mt="10px" lineHeight="1.55" px="8px">
              {errDef.sub}
            </Text>
            {errDef.stats && (
              <Flex gap="10px" mt="22px">
                <Box
                  flex="1"
                  bg="rgba(255,255,255,0.07)"
                  border="1px solid rgba(255,255,255,0.12)"
                  borderRadius="12px"
                  p="12px"
                  textAlign="center"
                >
                  <Text fontSize="20px" fontWeight="800" color={thColors.greenLight}>
                    {prev?.averageScore ? prev.averageScore.toFixed(1) : userAvg !== '—' ? userAvg : '—'}
                  </Text>
                  <Text fontSize="10.5px" color={thColors.textFaint} mt="2px">
                    {t('listener.yourScore')}
                  </Text>
                </Box>
                <Box
                  flex="1"
                  bg="rgba(255,255,255,0.07)"
                  border="1px solid rgba(255,255,255,0.12)"
                  borderRadius="12px"
                  p="12px"
                  textAlign="center"
                >
                  <Text fontSize="20px" fontWeight="800">
                    {sentAt}
                  </Text>
                  <Text fontSize="10.5px" color={thColors.textFaint} mt="2px">
                    {t('listener.sentAt')}
                  </Text>
                </Box>
              </Flex>
            )}
          </Flex>
          <Flex direction="column" gap="10px">
            <GradientButton w="100%" h="52px" fontSize="14.5px" onClick={errDef.primaryAction}>
              {errDef.primaryLabel}
            </GradientButton>
            <GradientButton w="100%" variant="ghost" h="48px" fontSize="13.5px" onClick={errDef.ghostAction}>
              {errDef.ghostLabel}
            </GradientButton>
            <Text textAlign="center" fontSize="11px" color="rgba(255,255,255,0.4)">
              {errDef.foot}
            </Text>
          </Flex>
        </Flex>
      )}

      {screen === 'start' && !errDef && (
        <Flex
          direction="column"
          minH="780px"
          color="white"
          px="22px"
          pt="22px"
          pb="26px"
          bg={thColors.bg}
          bgImage={thColors.gradientHero}
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          boxSizing="border-box"
          position="relative"
          overflow="hidden"
        >
          <Flex position="relative" justify="space-between" align="center">
            <BrandMark />
            <Pill variant="outline" dot fontSize="11.5px" fontWeight="500" border="1px solid rgba(255,255,255,0.7)" bg="transparent">
              {isConf ? t('listener.confBadge') : `${t('listener.hallBadge')} ${data.hall.name}`}
            </Pill>
          </Flex>

          {(
            <>
              <Flex align="center" gap="5px" mt="26px">
                <Box
                  bg="white"
                  color="#0B1F24"
                  borderRadius="12px"
                  w="38px"
                  h="38px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="800"
                  fontSize="19px"
                >
                  #
                </Box>
                <Pill h="38px" px="18px" fontSize="14px" fontWeight="500" border="1.5px solid #fff">
                  {isConf
                    ? t('listener.confTag')
                    : data.isWorkshop
                      ? t('listener.workshopTag')
                      : t('listener.startTag')}
                </Pill>
              </Flex>
              <Text
                fontFamily="heading"
                fontSize="29px"
                fontWeight="700"
                letterSpacing="-1px"
                lineHeight="1.12"
                mt="18px"
              >
                {isConf ? t('listener.confTitleA') : t('listener.startTitleA')}
                <br />
                <Box
                  as="span"
                  bgGradient="linear-gradient(90deg,#4BE96A,#7CF29A,#4FC9F0)"
                  backgroundClip="text"
                  color="transparent"
                  style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {isConf ? t('listener.confTitleB') : t('listener.startTitleB')}
                </Box>
              </Text>
              <Text fontSize="14.5px" color={thColors.textDim} mt="12px" lineHeight="1.5">
                {isConf ? t('listener.confSub') : t('listener.startSub')}
              </Text>

              <Box
                bg="rgba(255,255,255,0.08)"
                border="1px solid rgba(255,255,255,0.15)"
                borderRadius="16px"
                p="18px"
                mt="24px"
                backdropFilter="blur(8px)"
              >
                <Flex gap="14px" align="center">
                  <AvatarInitials name={displayName} size={56} initials={displayInitials} />
                  <Box>
                    <Text fontSize="16px" fontWeight="800" lineHeight="1.25">
                      {displayName}
                    </Text>
                    <Text fontSize="13px" color={thColors.textDim} mt="2px">
                      {displayTalk}
                      {displayMeta ? (
                        <>
                          <br />
                          {displayMeta}
                        </>
                      ) : null}
                    </Text>
                  </Box>
                </Flex>
                <Flex flexWrap="wrap" gap="7px" mt="16px">
                  {chips.map((label) => (
                    <Pill
                      key={label}
                      fontSize="10.5px"
                      fontWeight="600"
                      textTransform="uppercase"
                      letterSpacing="0.4px"
                      border="1px solid rgba(255,255,255,0.3)"
                    >
                      {label}
                    </Pill>
                  ))}
                </Flex>
              </Box>

              <Flex mt="auto" direction="column" gap="12px">
                <Flex justify="center" gap="22px" mb="4px">
                  <Box textAlign="center">
                    <Text fontSize="25px" fontWeight="800" color={thColors.greenLight}>
                      ~40
                    </Text>
                    <Text fontSize="11px" color={thColors.textFaint}>
                      {t('listener.secondsLabel')}
                    </Text>
                  </Box>
                  <Box w="1px" bg="rgba(255,255,255,0.2)" />
                  <Box textAlign="center">
                    <Text fontSize="25px" fontWeight="800">
                      0
                    </Text>
                    <Text fontSize="11px" color={thColors.textFaint}>
                      {t('listener.tokensLabel')}
                    </Text>
                  </Box>
                </Flex>
                <GradientButton w="100%" h="56px" fontSize="16px" onClick={startFlow} disabled={!criteria.length}>
                  {t('listener.startCta')}
                </GradientButton>
                <Text textAlign="center" fontSize="11.5px" color="rgba(255,255,255,0.4)">
                  {t('listener.anonHint')}
                </Text>
              </Flex>
            </>
          )}
        </Flex>
      )}

      {screen === 'step' && crit && (
        <Flex direction="column" minH="780px" color="white" bgImage={thColors.gradientHero}>
          <Box px="20px" pt="18px">
            <Flex justify="space-between" align="center">
              <Pill>{isConf ? data.event.name : speaker?.name}</Pill>
              <Pill fontWeight="700">
                {stepIdx + 1} / {criteria.length}
              </Pill>
            </Flex>
            <StepProgress total={criteria.length} current={stepIdx} />
            <Box mt="22px" animation="floatUp 0.35s ease">
              <Pill textTransform="uppercase" letterSpacing="1px">
                {crit.tag || crit.name}
              </Pill>
              <Text
                fontFamily="heading"
                fontSize="23px"
                fontWeight="700"
                letterSpacing="-0.5px"
                lineHeight="1.2"
                mt="13px"
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
            borderRadius="22px 22px 0 0"
            mt="18px"
            px="18px"
            py="20px"
          >
            {(crit.options?.length ? crit.options : defaultOptions()).map((o, i) => (
              <KeyOption
                key={`${crit.name}-${i}`}
                num={i + 1}
                title={o.title}
                subtitle={o.subtitle}
                selected={curRating === i + 1}
                onClick={() => selectOption(i + 1)}
              />
            ))}
            <Flex align="center" gap="12px" mt="auto" pt="10px">
              <GradientButton variant="ghost" h="42px" px="24px" fontSize="13px" fontWeight="500" onClick={stepBack}>
                {t('listener.back')}
              </GradientButton>
              <Text flex="1" textAlign="right" fontSize="11.5px" color="rgba(255,255,255,0.4)">
                {t('listener.keyHint')}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}

      {screen === 'done' && (
        <Flex
          direction="column"
          minH="780px"
          color="white"
          p="22px"
          bg={thColors.surface}
          position="relative"
          overflow="hidden"
          boxSizing="border-box"
        >
          <Box
            position="absolute"
            top="-120px"
            left="50%"
            transform="translateX(-50%)"
            w="420px"
            h="420px"
            borderRadius="50%"
            bg="radial-gradient(circle,#2FD37B 0%,#12A8A6 40%,transparent 68%)"
            filter="blur(50px)"
            opacity={0.4}
          />
          <Flex position="relative" justify="space-between" align="center">
            <Pill fontSize="11.5px" fontWeight="500" border="1px solid rgba(255,255,255,0.6)" px="12px" py="4px">
              {isConf ? t('listener.confBadge') : `${t('listener.hallBadge')} ${data.hall.name}`}
            </Pill>
            <Pill
              fontSize="11.5px"
              fontWeight="600"
              border={`1px solid ${thColors.green}`}
              color={thColors.greenLight}
              bg="transparent"
              px="12px"
              py="4px"
            >
              {criteria.length} / {criteria.length} ✓
            </Pill>
          </Flex>
          <Box position="relative" textAlign="center" mt="34px">
            <Flex
              w="100px"
              h="100px"
              mx="auto"
              borderRadius="26px"
              bg="linear-gradient(180deg,#4BE96A,#1FA53E)"
              boxShadow={`0 9px 0 ${thColors.greenShadow},0 0 60px rgba(61,220,80,0.55),inset 0 3px 0 rgba(255,255,255,0.4)`}
              align="center"
              justify="center"
              transform="rotate(-6deg)"
              animation="popIn 0.5s ease"
            >
              <Box
                as="svg"
                w="46px"
                h="46px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#04220C"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </Box>
            </Flex>
            <Text
              fontFamily="heading"
              fontSize="24px"
              fontWeight="700"
              letterSpacing="-0.8px"
              lineHeight="1.15"
              mt="22px"
            >
              {t('listener.doneTitle')}
              <br />
              {t('listener.doneTitleProd')}
            </Text>
            <Text fontSize="13.5px" color={thColors.textDim} mt="9px" lineHeight="1.5">
              {t('listener.doneSubLead')}
              <br />
              {isConf
                ? t('listener.doneSubConf')
                : data.isWorkshop
                  ? t('listener.doneSubWorkshop')
                  : data.isPanel
                    ? t('listener.doneSubPanel')
                    : `${speaker?.name?.split(' ')[0] || ''} ${t('listener.doneSubSpeaker')}`}
            </Text>
          </Box>

          <Flex position="relative" gap="10px" mt="24px">
            {[
              { v: userAvg, l: t('listener.avgLabel'), c: 'white' },
              { v: `${elapsed}с`, l: t('listener.timeLabel'), c: 'white' },
            ].map((m) => (
              <Box
                key={m.l}
                flex="1"
                bg={thColors.card}
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="12px"
                p="13px"
                textAlign="center"
              >
                <Text fontSize="22px" fontWeight="800" color={m.c}>
                  {m.v}
                </Text>
                <Text fontSize="11px" color={thColors.textFaint} mt="3px">
                  {m.l}
                </Text>
              </Box>
            ))}
          </Flex>

          <Box
            position="relative"
            bg={thColors.card}
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="14px"
            p="15px 16px"
            mt="14px"
          >
            <Text fontSize="12px" color={thColors.textFaint} fontWeight="600" mb="10px">
              {t('listener.reactionsTitle')}
            </Text>
            <Flex flexWrap="wrap" gap="8px">
              {reactionList.map((r) => (
                <Pill
                  key={r}
                  variant={reactions[r] ? 'green' : 'outline'}
                  cursor="pointer"
                  fontSize="12.5px"
                  fontWeight="600"
                  px="13px"
                  py="8px"
                  border={reactions[r] ? undefined : '1px solid rgba(255,255,255,0.25)'}
                  color={reactions[r] ? undefined : 'rgba(255,255,255,0.8)'}
                  onClick={() => toggleReaction(r)}
                >
                  {r}
                </Pill>
              ))}
            </Flex>
          </Box>

          <Box position="relative" mt="auto" pt="14px">
            <GradientButton
              variant="ghost"
              w="100%"
              h="50px"
              fontSize="14px"
              onClick={isConf ? goHome : startConf}
            >
              {isConf ? t('listener.backHome') : t('listener.rateWholeConf')}
            </GradientButton>
          </Box>
        </Flex>
      )}
    </Box>
  )

  return (
    <Flex
      minH="100vh"
      bg={thColors.bg}
      justify="center"
      align="flex-start"
      py="28px"
      px="16px"
    >
      {phone}
    </Flex>
  )
}

export default AssessmentListenerPage

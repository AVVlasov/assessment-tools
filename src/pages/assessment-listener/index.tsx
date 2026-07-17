import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
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
  const { data, isLoading, error, refetch } = useGetListenerHallQuery(token, {
    skip: !token,
    pollingInterval: 5000,
  })
  const [createRating] = useCreateListenerRatingMutation()

  const [mode, setMode] = useState<Mode>('speaker')
  const [screen, setScreen] = useState<Screen>('start')
  const [stepIdx, setStepIdx] = useState(0)
  const [ratings, setRatings] = useState<number[]>([])
  const [reactions, setReactions] = useState<Record<string, boolean>>({})
  const [startAt, setStartAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [place, setPlace] = useState(0)
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
  const nextTalk = data?.nextSpeaker
  const isLive = data?.hall.status === 'live' && !!speaker

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
      const res = await createRating({
        eventId: data.event._id,
        hallId: data.hall._id,
        teamId: mode === 'conf' ? null : speaker?._id || null,
        targetType,
        sessionId: getSessionId(),
        scores,
        reactions: Object.keys(reactions).filter((k) => reactions[k]),
        elapsedSeconds: elapsedSec,
      }).unwrap()
      setPlace(res.place)
    } catch {
      setPlace((data.ratingsCount || 0) + 1)
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

  const stepBack = (): void => {
    if (stepIdx > 0) setStepIdx((s) => s - 1)
    else setScreen('start')
  }

  const stepNext = (): void => {
    if (!curRating) return
    if (stepIdx < criteria.length - 1) setStepIdx((s) => s + 1)
    else void finish(ratings)
  }

  const toggleReaction = (label: string): void => {
    setReactions((prev) => ({ ...prev, [label]: !prev[label] }))
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
  const displayName = isConf ? data.event.name : speaker?.name || t('listener.noSpeaker')
  const displayTalk = isConf
    ? `${data.speakers.length} докладов`
    : speaker?.projectName || ''
  const displayMeta = isConf
    ? data.event.location || new Date(data.event.eventDate).toLocaleDateString('ru-RU')
    : [speaker?.org, speaker?.scheduledTime].filter(Boolean).join(' · ')

  const phone = (
    <Box
      w="390px"
      maxW="100%"
      borderRadius="34px"
      overflow="hidden"
      border={`1px solid ${thColors.border}`}
      boxShadow="0 30px 80px rgba(0,0,0,0.6)"
    >
      {screen === 'start' && (
        <Flex
          direction="column"
          minH="780px"
          color="white"
          p="22px"
          bgImage={thColors.gradientHero}
          boxSizing="border-box"
        >
          <Flex justify="space-between" align="center">
            <BrandMark />
            <Pill variant="outline" dot>
              {isConf ? t('listener.confBadge') : `${t('listener.hallBadge')} ${data.hall.name}`}
            </Pill>
          </Flex>

          {!isLive && !isConf ? (
            <Flex flex="1" direction="column" justify="center" gap={4}>
              <Text fontFamily="heading" fontSize="24px" fontWeight="700">
                {t('listener.waitingBreak')}
              </Text>
              <GradientButton variant="ghost" onClick={() => refetch()}>
                Обновить
              </GradientButton>
            </Flex>
          ) : (
            <>
              <Flex align="center" gap="6px" mt="26px">
                <Box
                  bg="white"
                  color="#0B1F24"
                  borderRadius="30px"
                  w="30px"
                  h="30px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="800"
                  fontSize="14px"
                >
                  #
                </Box>
                <Pill>
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
                borderRadius="22px"
                p="18px"
                mt="24px"
                backdropFilter="blur(8px)"
              >
                <Flex gap="14px" align="center">
                  <AvatarInitials name={displayName} size={56} />
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
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, minmax(0, 1fr))"
                  gap="7px"
                  mt="16px"
                >
                  {chips.map((label) => (
                    <Pill
                      key={label}
                      w="100%"
                      justifyContent="center"
                      textAlign="center"
                      fontSize="10.5px"
                      textTransform="uppercase"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {label}
                    </Pill>
                  ))}
                </Box>
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
                <GradientButton h="58px" fontSize="16.5px" onClick={startFlow} disabled={!criteria.length}>
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
            borderRadius="28px 28px 0 0"
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
            <Flex gap="10px" mt="auto" pt="10px">
              <GradientButton variant="ghost" h="52px" onClick={stepBack}>
                {t('listener.back')}
              </GradientButton>
              <GradientButton
                flex="1"
                h="52px"
                disabled={!curRating}
                onClick={stepNext}
              >
                {!curRating
                  ? t('listener.pickKey')
                  : stepIdx < criteria.length - 1
                    ? `${t('listener.next')}: ${criteria[stepIdx + 1]?.tag || ''}`
                    : t('listener.deployFeedback')}
              </GradientButton>
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
            <Pill>
              {isConf ? t('listener.confBadge') : `${t('listener.hallBadge')} ${data.hall.name}`}
            </Pill>
            <Pill variant="cyan" borderColor={thColors.green} color={thColors.greenLight}>
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
              <Text fontSize="40px" color="#04220C" fontWeight="800">
                ✓
              </Text>
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
              { v: place ? `${place}-й` : '—', l: t('listener.placeLabel'), c: thColors.greenLight },
              { v: userAvg, l: t('listener.avgLabel'), c: 'white' },
              { v: `${elapsed}с`, l: t('listener.timeLabel'), c: 'white' },
            ].map((m) => (
              <Box
                key={m.l}
                flex="1"
                bg={thColors.card}
                border={`1px solid ${thColors.border}`}
                borderRadius="18px"
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
            border={`1px solid ${thColors.border}`}
            borderRadius="20px"
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
                  onClick={() => toggleReaction(r)}
                >
                  {r}
                </Pill>
              ))}
            </Flex>
          </Box>

          <Box
            position="relative"
            bg="linear-gradient(135deg,rgba(0,174,239,0.15),rgba(61,220,80,0.1))"
            border="1.5px solid rgba(0,174,239,0.4)"
            borderRadius="18px"
            p="13px 16px"
            mt="12px"
            display="flex"
            alignItems="center"
            gap="12px"
          >
            <Box
              w="42px"
              h="42px"
              borderRadius="12px"
              bg="linear-gradient(180deg,#57C8F2,#2A8FC0)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="18px"
              flexShrink={0}
            >
              ★
            </Box>
            <Box>
              <Text fontSize="13.5px" fontWeight="800" color="#7FD9F7">
                {isConf ? t('listener.achConf') : t('listener.achSpeaker')}
              </Text>
              <Text fontSize="11.5px" color={thColors.textFaint} mt="2px">
                {isConf ? t('listener.achConfSub') : t('listener.achSpeakerSub')}
              </Text>
            </Box>
          </Box>

          <Flex position="relative" mt="auto" direction="column" gap="10px" pt="14px">
            {(nextTalk || isConf) && (
              <Flex
                bg="linear-gradient(135deg,rgba(0,174,239,0.15),rgba(61,220,80,0.1))"
                border="1.5px solid rgba(0,174,239,0.4)"
                borderRadius="18px"
                p="13px 16px"
                align="center"
                gap="12px"
              >
                <AvatarInitials
                  name={isConf ? 'AP' : nextTalk?.name || '—'}
                  size={40}
                />
                <Box flex="1" minW={0}>
                  <Text
                    fontSize="10.5px"
                    color={thColors.greenLight}
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    {isConf ? t('listener.nextProgram') : t('listener.nextInHall')}
                    {' · '}
                    {isConf ? '18:10' : nextTalk?.scheduledTime || ''}
                  </Text>
                  <Text fontSize="13px" fontWeight="700" mt="2px">
                    {isConf
                      ? 'Afterparty'
                      : `${nextTalk?.projectName || ''} · ${nextTalk?.name || ''}`}
                  </Text>
                </Box>
              </Flex>
            )}
            {!isConf && (
              <GradientButton
                variant="cyan"
                h="52px"
                onClick={() => {
                  setMode('conf')
                  setScreen('start')
                  setRatings([])
                  setReactions({})
                  setStepIdx(0)
                }}
              >
                {t('listener.rateConf')}
              </GradientButton>
            )}
            <GradientButton
              variant="ghost"
              h="52px"
              onClick={() => {
                if (isConf) {
                  setMode('speaker')
                  setScreen('start')
                } else {
                  setScreen('start')
                  refetch()
                }
                setRatings([])
                setReactions({})
                setStepIdx(0)
              }}
            >
              {isConf ? t('listener.toHome') : t('listener.rateNext')}
            </GradientButton>
          </Flex>
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

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Flex, Grid, Input, Text } from '@chakra-ui/react'
import {
  GradientButton,
  IconBtn,
  KeyOption,
  Pill,
  StepProgress,
  SurfaceCard,
} from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import {
  useCreateCriteriaMutation,
  useDeleteCriteriaMutation,
  useGetCriteriaQuery,
  useLoadDefaultCriteriaMutation,
  useUpdateCriteriaMutation,
} from '../../../__data__/api'
import type { CriteriaType, CriterionItem, CriterionOption } from '../../../types'
import { t } from '../../../utils/locale'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'

interface ConferenceCriteriaTabProps {
  eventId: string
}

const TYPE_ORDER: CriteriaType[] = ['speaker', 'panel', 'workshop', 'event', 'all']

const TYPE_LABELS: Record<CriteriaType, string> = {
  all: 'Общие',
  team: 'Команды',
  participant: 'Участницы',
  speaker: 'Доклад',
  panel: 'Панель',
  workshop: 'Воркшоп',
  event: 'Конференция',
}

const ensureOptions = (opts?: CriterionOption[]): CriterionOption[] => {
  const base = (opts || []).map((o) => ({ title: o.title || '', subtitle: o.subtitle || '' }))
  while (base.length < 5) base.push({ title: '', subtitle: '' })
  return base.slice(0, 5)
}

const blankPage = (): CriterionItem => ({
  name: 'Ваш вопрос?',
  tag: 'Новый',
  hint: 'Подсказка под вопросом',
  maxScore: 5,
  options: [
    { title: 'Слабо', subtitle: '' },
    { title: 'Так себе', subtitle: '' },
    { title: 'Норм', subtitle: '' },
    { title: 'Хорошо', subtitle: '' },
    { title: 'Отлично', subtitle: '' },
  ],
})

const PREVIEW_SPEAKER: Record<string, string> = {
  speaker: 'Денис Артюшин',
  panel: 'Панельная дискуссия',
  workshop: 'Воркшоп · Gen AI',
  event: 'Техно хаб Конф',
  all: 'Слушатель',
  team: 'Команда',
  participant: 'Участница',
}

const cloneCriteria = (list: CriterionItem[]): CriterionItem[] =>
  list.map((c) => ({
    name: c.name || '',
    tag: c.tag || '',
    hint: c.hint || '',
    maxScore: c.maxScore || 5,
    options: ensureOptions(c.options),
  }))

export const ConferenceCriteriaTab: React.FC<ConferenceCriteriaTabProps> = ({ eventId }) => {
  const { data: blocks = [], isLoading } = useGetCriteriaQuery({ eventId })
  const [loadDefault] = useLoadDefaultCriteriaMutation()
  const [updateCriteria] = useUpdateCriteriaMutation()
  const [createCriteria] = useCreateCriteriaMutation()
  const [deleteCriteria] = useDeleteCriteriaMutation()

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort(
        (a, b) => TYPE_ORDER.indexOf(a.criteriaType) - TYPE_ORDER.indexOf(b.criteriaType)
      ),
    [blocks]
  )

  const [activeType, setActiveType] = useState<CriteriaType | ''>('')
  const [pageIdx, setPageIdx] = useState(0)
  const [draft, setDraft] = useState<CriterionItem[]>([])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [typeEdit, setTypeEdit] = useState(false)
  const [typeDraft, setTypeDraft] = useState('')
  const [confirmDelType, setConfirmDelType] = useState(false)
  const [confirmDelPage, setConfirmDelPage] = useState(false)

  const activeBlock = useMemo(
    () => sortedBlocks.find((b) => b.criteriaType === activeType) || sortedBlocks[0] || null,
    [sortedBlocks, activeType]
  )

  useEffect(() => {
    if (!activeType && sortedBlocks.length) {
      setActiveType(sortedBlocks[0].criteriaType)
    }
  }, [activeType, sortedBlocks])

  useEffect(() => {
    if (!activeBlock) {
      setDraft([])
      return
    }
    setDraft(cloneCriteria(activeBlock.criteria))
    setPageIdx(0)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlock?._id])

  const page = draft[pageIdx]

  const patchPage = (patch: Partial<CriterionItem>): void => {
    setDraft((prev) => {
      const next = prev.map((c) => ({ ...c, options: ensureOptions(c.options) }))
      next[pageIdx] = { ...next[pageIdx], ...patch }
      return next
    })
    setDirty(true)
  }

  const patchOption = (idx: number, field: keyof CriterionOption, value: string): void => {
    setDraft((prev) => {
      const next = prev.map((c) => ({ ...c, options: ensureOptions(c.options) }))
      const opts = [...(next[pageIdx].options || [])]
      opts[idx] = { ...opts[idx], [field]: value }
      next[pageIdx] = { ...next[pageIdx], options: opts }
      return next
    })
    setDirty(true)
  }

  const addPage = (): void => {
    setDraft((prev) => {
      const next = [...prev, blankPage()]
      setPageIdx(next.length - 1)
      return next
    })
    setDirty(true)
  }

  const deletePage = (): void => {
    if (draft.length <= 1) return
    if (confirmDelPage) {
      setConfirmDelPage(false)
      setDraft((prev) => prev.filter((_, i) => i !== pageIdx))
      setPageIdx((i) => Math.max(0, i - 1))
      setDirty(true)
      return
    }
    setConfirmDelPage(true)
    setTimeout(() => setConfirmDelPage(false), 3000)
  }

  const addType = async (): Promise<void> => {
    const id = `custom_${Date.now()}`
    const created = await createCriteria({
      eventId,
      blockName: 'Новый тип',
      criteriaType: id as CriteriaType,
      criteria: [blankPage()],
    }).unwrap()
    setActiveType(created.criteriaType)
    setTypeEdit(true)
    setTypeDraft(created.blockName)
  }

  const saveTypeName = async (): Promise<void> => {
    if (!activeBlock) return
    await updateCriteria({
      id: activeBlock._id,
      data: { blockName: typeDraft.trim() || activeBlock.blockName },
    })
    setTypeEdit(false)
  }

  const deleteType = async (): Promise<void> => {
    if (!activeBlock || sortedBlocks.length <= 1) return
    if (confirmDelType) {
      setConfirmDelType(false)
      await deleteCriteria(activeBlock._id)
      setActiveType('')
      return
    }
    setConfirmDelType(true)
    setTimeout(() => setConfirmDelType(false), 3000)
  }

  const handleSave = async (): Promise<void> => {
    if (!activeBlock) return
    await updateCriteria({ id: activeBlock._id, data: { criteria: draft } })
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const handleLoadDefaults = async (): Promise<void> => {
    if (!window.confirm(t('criteriaEditor.confirmDefaults'))) return
    await loadDefault({ eventId })
    setActiveType('')
  }

  if (isLoading) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  if (!sortedBlocks.length) {
    return (
      <SurfaceCard>
        <Text fontSize="15px" fontWeight="700" mb="6px">
          {t('criteriaEditor.noBlocks')}
        </Text>
        <Text fontSize="13px" color={thColors.textDim} mb="16px">
          {t('criteriaEditor.defaultsHint')}
        </Text>
        <GradientButton onClick={handleLoadDefaults}>
          {t('criteriaEditor.loadDefaults')}
        </GradientButton>
      </SurfaceCard>
    )
  }

  const options = ensureOptions(page?.options)
  const warn =
    !page?.tag?.trim() || !page?.name?.trim() || options.some((o) => !o.title.trim())

  const inputStyle = {
    bg: thColors.surface,
    borderColor: thColors.border,
    color: 'white',
    borderRadius: '10px',
    h: '42px',
    fontSize: '13px',
    _placeholder: { color: thColors.mutedDark },
    _focus: { borderColor: thColors.green },
  } as const

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1.15fr 380px' }} gap="22px" alignItems="start">
      <Box>
        {/* Type tabs */}
        <Flex gap="8px" mb="10px" flexWrap="wrap" align="center">
          {sortedBlocks.map((b) => (
            <GradientButton
              key={b._id}
              h="34px"
              px="18px"
              fontSize="12.5px"
              fontWeight="600"
              variant={activeBlock?._id === b._id ? 'primary' : 'ghost'}
              boxShadow="none"
              onClick={() => {
                setActiveType(b.criteriaType)
                setTypeEdit(false)
              }}
            >
              {b.blockName || TYPE_LABELS[b.criteriaType] || b.criteriaType}
            </GradientButton>
          ))}
          <IconBtn
            label={t('criteriaEditor.addType')}
            dashed
            size={34}
            onClick={() => void addType()}
          >
            <LuPlus size={15} />
          </IconBtn>
        </Flex>

        <Flex gap="8px" mb="12px" align="center" flexWrap="wrap">
          {typeEdit ? (
            <>
              <Input
                value={typeDraft}
                onChange={(e) => setTypeDraft(e.target.value)}
                w="200px"
                bg={thColors.surface}
                borderColor={thColors.green}
                color="white"
                borderRadius="10px"
                h="32px"
                fontSize="12.5px"
              />
              <GradientButton h="32px" px="15px" fontSize="11.5px" onClick={() => void saveTypeName()}>
                {t('criteriaEditor.saveType')}
              </GradientButton>
              <GradientButton h="32px" px="13px" fontSize="11.5px" variant="ghost" onClick={() => setTypeEdit(false)}>
                {t('common.cancel')}
              </GradientButton>
            </>
          ) : (
            <>
              <IconBtn
                label={t('criteriaEditor.editType')}
                size={32}
                onClick={() => {
                  setTypeEdit(true)
                  setTypeDraft(activeBlock?.blockName || '')
                }}
              >
                <LuPencil size={14} />
              </IconBtn>
              <IconBtn
                label={confirmDelType ? t('criteriaEditor.confirmDelType') : t('criteriaEditor.deleteType')}
                danger
                active={confirmDelType}
                size={32}
                disabled={sortedBlocks.length <= 1}
                onClick={() => void deleteType()}
              >
                <LuTrash2 size={14} />
              </IconBtn>
            </>
          )}
        </Flex>

        {/* Page pills */}
        <Flex gap="8px" mb="16px" flexWrap="wrap">
          {draft.map((c, i) => (
            <GradientButton
              key={i}
              h="32px"
              px="15px"
              fontSize="12px"
              fontWeight="600"
              variant={i === pageIdx ? 'primary' : 'ghost'}
              boxShadow="none"
              onClick={() => setPageIdx(i)}
            >
              {c.tag?.trim() || '·'}
            </GradientButton>
          ))}
          <GradientButton
            h="32px"
            px="13px"
            fontSize="12px"
            fontWeight="600"
            variant="ghost"
            color="rgba(255,255,255,0.6)"
            border="1.5px dashed rgba(255,255,255,0.25)"
            onClick={addPage}
          >
            {t('criteriaEditor.addPage')}
          </GradientButton>
        </Flex>

        {page && (
          <SurfaceCard>
            <Flex gap="10px" flexWrap="wrap">
              <Box w={{ base: '100%', sm: '160px' }}>
                <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" mb="6px" textTransform="uppercase" letterSpacing="0.5px">
                  {t('criteriaEditor.tagLabel')}
                </Text>
                <Input
                  {...inputStyle}
                  value={page.tag || ''}
                  onChange={(e) => patchPage({ tag: e.target.value })}
                  borderColor={page.tag?.trim() ? thColors.border : 'rgba(229,72,77,0.7)'}
                />
              </Box>
              <Box flex="1" minW="200px">
                <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" mb="6px" textTransform="uppercase" letterSpacing="0.5px">
                  {t('criteriaEditor.questionLabel')}
                </Text>
                <Input
                  {...inputStyle}
                  value={page.name || ''}
                  onChange={(e) => patchPage({ name: e.target.value })}
                  borderColor={page.name?.trim() ? thColors.border : 'rgba(229,72,77,0.7)'}
                />
              </Box>
            </Flex>

            <Box mt="12px">
              <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" mb="6px" textTransform="uppercase" letterSpacing="0.5px">
                {t('criteriaEditor.hintLabel')}
              </Text>
              <Input
                {...inputStyle}
                value={page.hint || ''}
                onChange={(e) => patchPage({ hint: e.target.value })}
              />
            </Box>

            <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" mt="16px" mb="8px" textTransform="uppercase" letterSpacing="0.5px">
              {t('criteriaEditor.keysLabel')}
            </Text>
            <Flex direction="column" gap="8px">
              {options.map((o, j) => (
                <Flex key={j} gap="8px" align="center">
                  <Flex
                    w="36px"
                    h="36px"
                    borderRadius="11px"
                    flexShrink={0}
                    align="center"
                    justify="center"
                    fontWeight="800"
                    fontSize="13px"
                    bg={thColors.keyUnsel}
                    color={thColors.mutedDark}
                    boxShadow="0 3px 0 #0B1118, inset 0 1px 0 rgba(255,255,255,0.12)"
                  >
                    {j + 1}
                  </Flex>
                  <Input
                    {...inputStyle}
                    flex="1"
                    minW={0}
                    fontWeight="600"
                    placeholder={t('criteriaEditor.optionTitle')}
                    value={o.title}
                    onChange={(e) => patchOption(j, 'title', e.target.value)}
                    borderColor={o.title.trim() ? thColors.border : 'rgba(229,72,77,0.7)'}
                  />
                  <Input
                    {...inputStyle}
                    flex="1.3"
                    minW={0}
                    color={thColors.textDim}
                    placeholder={t('criteriaEditor.optionSub')}
                    value={o.subtitle || ''}
                    onChange={(e) => patchOption(j, 'subtitle', e.target.value)}
                  />
                </Flex>
              ))}
            </Flex>

            {warn && (
              <Box
                mt="12px"
                bg="rgba(255,176,32,0.1)"
                border="1px solid rgba(255,176,32,0.45)"
                borderRadius="10px"
                p="10px 12px"
              >
                <Text fontSize="11.5px" color="#FFC24B" fontWeight="600" lineHeight="1.45">
                  {t('criteriaEditor.warnEmpty')}
                </Text>
              </Box>
            )}

            <Text fontSize="11.5px" color={thColors.textFaint} mt="12px" lineHeight="1.5">
              {t('criteriaEditor.hint')}
            </Text>

            <Flex gap="8px" mt="14px" justify="flex-end">
              <GradientButton
                h="44px"
                px="18px"
                variant="ghost"
                color={confirmDelPage ? '#fff' : '#FFB4B4'}
                borderColor="rgba(255,100,100,0.4)"
                bg={confirmDelPage ? 'linear-gradient(90deg,#E5484D,#C63A66)' : 'transparent'}
                disabled={draft.length <= 1}
                onClick={deletePage}
              >
                {confirmDelPage ? t('criteriaEditor.confirmDelPage') : t('criteriaEditor.deletePage')}
              </GradientButton>
              <GradientButton h="44px" px="22px" onClick={handleSave} disabled={!dirty && !saved}>
                {saved ? t('criteriaEditor.saved') : t('criteriaEditor.save')}
              </GradientButton>
            </Flex>
          </SurfaceCard>
        )}
      </Box>

      {/* Live listener preview */}
      <Box position="sticky" top="20px">
        <Text fontSize="10.5px" color={thColors.textFaint} fontWeight="600" mb="10px" textTransform="uppercase" letterSpacing="0.5px">
          {t('criteriaEditor.previewTitle')}
        </Text>
        <Box
          borderRadius="20px"
          overflow="hidden"
          border={`1px solid ${thColors.border}`}
          bgImage={thColors.gradientHero}
        >
          <Box px="16px" pt="14px">
            <Flex justify="space-between" align="center">
              <Pill fontSize="10px">
                {PREVIEW_SPEAKER[activeBlock?.criteriaType || 'speaker'] || TYPE_LABELS[activeBlock?.criteriaType || 'speaker']}
              </Pill>
              <Pill fontSize="10px" fontWeight="700">
                {pageIdx + 1} / {draft.length}
              </Pill>
            </Flex>
            <StepProgress total={draft.length} current={pageIdx} />
            <Box mt="14px">
              <Pill fontSize="9.5px" textTransform="uppercase" letterSpacing="1px">
                {page?.tag || '—'}
              </Pill>
              <Text
                fontFamily="heading"
                fontSize="17px"
                fontWeight="700"
                letterSpacing="-0.4px"
                lineHeight="1.2"
                mt="10px"
              >
                {page?.name || '—'}
              </Text>
              {page?.hint && (
                <Text fontSize="11px" color={thColors.textDim} mt="5px">
                  {page.hint}
                </Text>
              )}
            </Box>
          </Box>
          <Flex
            direction="column"
            gap="7px"
            bg={thColors.surface}
            borderRadius="18px 18px 0 0"
            mt="14px"
            px="13px"
            pt="16px"
            pb="12px"
          >
            {options.map((o, j) => (
              <KeyOption key={j} num={j + 1} title={o.title || '—'} subtitle={o.subtitle} />
            ))}
            <Flex align="center" gap="10px" mt="6px">
              <GradientButton h="36px" px="18px" fontSize="12px" variant="ghost" color="rgba(255,255,255,0.75)">
                {t('listener.back')}
              </GradientButton>
              <Text flex="1" textAlign="right" fontSize="11px" color="rgba(255,255,255,0.4)">
                {t('listener.keyHint')}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Grid>
  )
}

export default ConferenceCriteriaTab

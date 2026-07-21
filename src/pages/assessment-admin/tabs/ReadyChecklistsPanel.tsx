import React, { useEffect, useState } from 'react'
import { Box, Flex, Grid, Input, Text } from '@chakra-ui/react'
import { LuPlus, LuX } from 'react-icons/lu'
import { GradientButton, IconBtn } from '../../../components/tehnohub'
import { thColors } from '../../../theme'
import {
  useCreateChecklistMutation,
  useDeleteChecklistMutation,
  useGetChecklistsQuery,
  useUpdateChecklistMutation,
} from '../../../__data__/api'
import type { ReadinessChecklist, ReadinessChecklistType, SpeakerFormat } from '../../../types'
import { t } from '../../../utils/locale'

interface Props {
  eventId: string
}

const TYPE_OPTS: Array<{ value: ReadinessChecklistType; labelKey: string }> = [
  { value: 'talk', labelKey: 'admin.formatTalk' },
  { value: 'panel', labelKey: 'admin.formatPanel' },
  { value: 'workshop', labelKey: 'admin.formatWorkshop' },
]

const itemsPayload = (ck: ReadinessChecklist) =>
  ck.items.map((it) => ({ _id: it._id, text: it.text, done: it.done }))

export const ReadyChecklistsPanel: React.FC<Props> = ({ eventId }) => {
  const { data: checklists = [], isLoading } = useGetChecklistsQuery(eventId)
  const [createChecklist] = useCreateChecklistMutation()
  const [updateChecklist] = useUpdateChecklistMutation()
  const [deleteChecklist] = useDeleteChecklistMutation()
  const [confirmDelId, setConfirmDelId] = useState<string | null>(null)
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})
  const [itemDrafts, setItemDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    const names: Record<string, string> = {}
    const items: Record<string, string> = {}
    checklists.forEach((ck) => {
      names[ck._id] = ck.name
      ck.items.forEach((it) => {
        items[`${ck._id}:${it._id}`] = it.text
      })
    })
    setNameDrafts(names)
    setItemDrafts(items)
  }, [checklists])

  useEffect(() => {
    if (!confirmDelId) return
    const timer = window.setTimeout(() => setConfirmDelId(null), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmDelId])

  const patch = async (
    ck: ReadinessChecklist,
    data: {
      name?: string
      type?: SpeakerFormat
      items?: Array<{ _id?: string; text?: string; done?: boolean }>
    }
  ): Promise<void> => {
    await updateChecklist({ id: ck._id, eventId, data })
  }

  const handleCreate = async (): Promise<void> => {
    await createChecklist({
      eventId,
      name: t('admin.ckNewName'),
      type: 'talk',
      items: [{ text: '', done: false }],
    })
    setConfirmDelId(null)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (confirmDelId === id) {
      await deleteChecklist({ id, eventId })
      setConfirmDelId(null)
      return
    }
    setConfirmDelId(id)
  }

  if (isLoading) {
    return <Text color={thColors.textFaint}>{t('common.loading')}</Text>
  }

  return (
    <Box
      bg={thColors.surface}
      border={`1px solid ${thColors.border}`}
      borderRadius="14px"
      p="18px 20px"
      display="flex"
      flexDirection="column"
      gap="14px"
    >
      <Flex align="center" gap="12px" flexWrap="wrap">
        <Box flex="1" minW="200px">
          <Text fontFamily="heading" fontSize="15px" fontWeight="700" letterSpacing="-0.3px">
            {t('admin.ckTitle')}
          </Text>
          <Text fontSize="11.5px" color={thColors.textFaint} mt="3px">
            {t('admin.ckSub')}
          </Text>
        </Box>
        <GradientButton
          h="34px"
          px="16px"
          fontSize="12px"
          fontWeight="700"
          display="inline-flex"
          alignItems="center"
          gap="6px"
          onClick={() => void handleCreate()}
        >
          <LuPlus size={14} strokeWidth={2.4} />
          {t('admin.ckAdd')}
        </GradientButton>
      </Flex>

      {!checklists.length && (
        <Box
          border="1px dashed rgba(255,255,255,0.15)"
          borderRadius="12px"
          p="26px"
          textAlign="center"
          color={thColors.textFaint}
          fontSize="12.5px"
        >
          {t('admin.ckEmpty')}
        </Box>
      )}

      <Grid templateColumns="repeat(auto-fill, minmax(330px, 1fr))" gap="14px">
        {checklists.map((ck) => {
          const doneN = ck.items.filter((it) => it.done).length
          const pct = ck.items.length ? Math.round((doneN / ck.items.length) * 100) : 0
          const confirmDel = confirmDelId === ck._id

          return (
            <Box
              key={ck._id}
              bg={thColors.card}
              border={`1px solid ${thColors.border}`}
              borderRadius="12px"
              p="14px 16px 15px"
              display="flex"
              flexDirection="column"
              gap="12px"
              h="100%"
              minH="100%"
            >
              <Flex align="center" gap="10px">
                <Input
                  value={nameDrafts[ck._id] ?? ck.name}
                  onChange={(e) =>
                    setNameDrafts((prev) => ({ ...prev, [ck._id]: e.target.value }))
                  }
                  onBlur={() => {
                    const next = (nameDrafts[ck._id] ?? ck.name).trim()
                    if (next !== ck.name) void patch(ck, { name: next || t('admin.ckNewName') })
                  }}
                  placeholder={t('admin.ckNamePlaceholder')}
                  flex="1"
                  minW={0}
                  bg="#0C1218"
                  border="1px solid rgba(255,255,255,0.12)"
                  borderRadius="10px"
                  color="#fff"
                  fontSize="13.5px"
                  fontWeight="700"
                  px="12px"
                  py="9px"
                  h="auto"
                  _focus={{ borderColor: thColors.green, outline: 'none' }}
                />
                <Text fontSize="11.5px" fontWeight="800" color={thColors.greenLight} flexShrink={0}>
                  {doneN} / {ck.items.length}
                </Text>
              </Flex>

              <Box h="5px" bg="rgba(255,255,255,0.1)" borderRadius="3px" overflow="hidden">
                <Box w={`${pct}%`} h="100%" bg={thColors.gradientGreen} />
              </Box>

              <Flex align="center" gap="8px" flexWrap="wrap">
                <Text
                  fontSize="10px"
                  color="rgba(255,255,255,0.4)"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  flexShrink={0}
                >
                  {t('admin.ckType')}
                </Text>
                {TYPE_OPTS.map((opt) => (
                  <GradientButton
                    key={opt.value}
                    h="30px"
                    px="14px"
                    fontSize="11.5px"
                    fontWeight="600"
                    variant={ck.type === opt.value ? 'primary' : 'ghost'}
                    boxShadow="none"
                    onClick={() => void patch(ck, { type: opt.value })}
                  >
                    {t(opt.labelKey)}
                  </GradientButton>
                ))}
              </Flex>

              <Flex direction="column" gap="7px">
                {ck.items.map((it) => {
                  const draftKey = `${ck._id}:${it._id}`
                  return (
                    <Flex
                      key={it._id}
                      align="center"
                      gap="9px"
                      bg="#0C1218"
                      borderRadius="10px"
                      px="10px"
                      py="6px"
                      pr="8px"
                    >
                      <Box
                        as="button"
                        type="button"
                        w="20px"
                        h="20px"
                        borderRadius="6px"
                        border={
                          it.done
                            ? `1.5px solid ${thColors.green}`
                            : '1.5px solid rgba(255,255,255,0.25)'
                        }
                        bg={it.done ? thColors.green : 'transparent'}
                        color={thColors.cyanDeep}
                        fontSize="12px"
                        fontWeight="900"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        cursor="pointer"
                        onClick={() =>
                          void patch(ck, {
                            items: itemsPayload(ck).map((row) =>
                              row._id === it._id ? { ...row, done: !it.done } : row
                            ),
                          })
                        }
                      >
                        {it.done ? '✓' : ''}
                      </Box>
                      <Input
                        value={itemDrafts[draftKey] ?? it.text}
                        onChange={(e) =>
                          setItemDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                        }
                        onBlur={() => {
                          const next = itemDrafts[draftKey] ?? it.text
                          if (next !== it.text) {
                            void patch(ck, {
                              items: itemsPayload(ck).map((row) =>
                                row._id === it._id ? { ...row, text: next } : row
                              ),
                            })
                          }
                        }}
                        placeholder={t('admin.ckItemPlaceholder')}
                        flex="1"
                        minW={0}
                        bg="transparent"
                        border="none"
                        color="#fff"
                        fontSize="12.5px"
                        px={0}
                        py="3px"
                        h="auto"
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                      />
                      <IconBtn
                        label={t('admin.ckDelItem')}
                        size={26}
                        danger
                        onClick={() =>
                          void patch(ck, {
                            items: itemsPayload(ck).filter((row) => row._id !== it._id),
                          })
                        }
                        border="none"
                        color="rgba(255,255,255,0.35)"
                        _hover={{ bg: 'rgba(255,120,120,0.15)', color: '#FF8B8B' }}
                      >
                        <LuX size={13} strokeWidth={2.2} />
                      </IconBtn>
                    </Flex>
                  )
                })}
                <GradientButton
                  alignSelf="flex-start"
                  h="30px"
                  px="13px"
                  fontSize="11px"
                  fontWeight="600"
                  variant="ghost"
                  border="1.5px dashed rgba(255,255,255,0.22)"
                  color="rgba(255,255,255,0.6)"
                  onClick={() =>
                    void patch(ck, {
                      items: [...itemsPayload(ck), { text: '', done: false }],
                    })
                  }
                  _hover={{ borderColor: thColors.green, color: thColors.greenLight }}
                >
                  {t('admin.ckAddItem')}
                </GradientButton>
              </Flex>

              <Flex
                justify="flex-end"
                align="center"
                borderTop="1px solid rgba(255,255,255,0.06)"
                pt="11px"
                mt="auto"
              >
                <GradientButton
                  h="30px"
                  px="13px"
                  fontSize="11px"
                  fontWeight="600"
                  variant="ghost"
                  border="1px solid rgba(255,120,120,0.4)"
                  bg={confirmDel ? 'rgba(255,120,120,0.18)' : 'transparent'}
                  color={confirmDel ? '#FF8B8B' : 'rgba(255,140,140,0.85)'}
                  onClick={() => void handleDelete(ck._id)}
                >
                  {confirmDel ? t('admin.ckDelConfirm') : t('admin.ckDel')}
                </GradientButton>
              </Flex>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

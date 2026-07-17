import React, { useState } from 'react'
import { Box, Flex, Input, Textarea, Text, Dialog, Stack, Portal } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { Event, EventType } from '../../types'
import { useUpdateEventMutation, useDeleteEventMutation } from '../../__data__/api/eventApi'
import { GradientButton, Pill, SurfaceCard } from '../tehnohub'
import { thColors } from '../../theme'
import { t } from '../../utils/locale'
import {
  formatEventDateRu,
  parseDateInput,
  toDateInputValue,
  toEventDateIso,
  toRuDateDots,
} from '../../utils/date'
import { toaster } from '../ui/toaster'

const typeLabel = (type?: EventType): string => {
  if (type === 'conference') return t('events.types.conference')
  if (type === 'queen_of_code') return t('events.types.queen_of_code')
  if (type === 'hackathon') return t('events.types.hackathon')
  return type || '—'
}

interface EventCardProps {
  event: Event
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate()
  const [updateEvent] = useUpdateEventMutation()
  const [deleteEvent] = useDeleteEventMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dateText, setDateText] = useState(toRuDateDots(toDateInputValue(new Date(event.eventDate))))
  const [form, setForm] = useState({
    name: event.name,
    description: event.description || '',
    eventDate: toDateInputValue(new Date(event.eventDate)),
    location: event.location || '',
  })

  const startEdit = (): void => {
    const dateIso = toDateInputValue(new Date(event.eventDate))
    setForm({
      name: event.name,
      description: event.description || '',
      eventDate: dateIso,
      location: event.location || '',
    })
    setDateText(toRuDateDots(dateIso))
    setIsEditing(true)
  }

  const handleSave = async (): Promise<void> => {
    const parsedDate = parseDateInput(dateText) || parseDateInput(form.eventDate)
    if (!form.name.trim() || !parsedDate) {
      toaster.create({ title: t('events.editInvalid'), type: 'error' })
      return
    }
    try {
      await updateEvent({
        id: event._id,
        data: {
          name: form.name.trim(),
          description: form.description.trim(),
          eventDate: toEventDateIso(parsedDate),
          location: form.location.trim(),
        },
      }).unwrap()
      setIsEditing(false)
      toaster.create({ title: t('events.updated'), type: 'success' })
    } catch (error) {
      console.error('Failed to update event:', error)
      toaster.create({ title: t('events.updateFailed'), type: 'error' })
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteEvent(event._id).unwrap()
      setConfirmDelete(false)
      toaster.create({ title: t('events.deleted'), type: 'success' })
    } catch (error) {
      console.error('Failed to delete event:', error)
      toaster.create({ title: t('events.deleteFailed'), type: 'error' })
    }
  }

  const inputStyles = {
    bg: thColors.surface,
    borderColor: thColors.border,
    color: 'white' as const,
    borderRadius: '14px',
  }

  return (
    <>
      <SurfaceCard
        _hover={{
          borderColor: thColors.green,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s',
        }}
      >
        <Flex direction="column" gap="14px">
          <Flex align="center" gap="8px" flexWrap="wrap">
            <Text fontFamily="heading" fontSize="16px" fontWeight="700" flex="1">
              {event.name}
            </Text>
            <Pill variant="cyan" fontSize="10.5px">
              {typeLabel(event.eventType)}
            </Pill>
            <Box
              as="button"
              type="button"
              color={thColors.muted}
              cursor="pointer"
              _hover={{ color: thColors.greenLight }}
              onClick={startEdit}
              aria-label={t('events.edit')}
            >
              <FiEdit2 />
            </Box>
          </Flex>

          {event.description && (
            <Text color={thColors.textDim} fontSize="13px" lineClamp={2}>
              {event.description}
            </Text>
          )}

          <Text fontSize="12px" color={thColors.textFaint}>
            {formatEventDateRu(event.eventDate)}
            {event.location ? ` · ${event.location}` : ''}
          </Text>

          <Flex gap="8px" mt="4px">
            <GradientButton
              flex="1"
              h="42px"
              onClick={() => navigate(`/assessment-tools/admin?eventId=${event._id}`)}
            >
              {t('events.openEvent')}
            </GradientButton>
            <GradientButton
              variant="ghost"
              h="42px"
              px="14px"
              color="#FF6B6B"
              borderColor="rgba(255,100,100,0.5)"
              onClick={() => setConfirmDelete(true)}
              aria-label={t('events.delete')}
            >
              <FiTrash2 />
            </GradientButton>
          </Flex>
        </Flex>
      </SurfaceCard>

      <Dialog.Root
        open={confirmDelete}
        onOpenChange={(details) => {
          if (!details.open) setConfirmDelete(false)
        }}
        role="alertdialog"
      >
        <Portal>
          <Dialog.Backdrop bg="rgba(0,0,0,0.72)" zIndex={1400} />
          <Dialog.Positioner zIndex={1500} placeItems="center" p="16px">
            <Dialog.Content
              bg={thColors.surface}
              border={`1.5px solid ${thColors.border}`}
              borderRadius="18px"
              p="22px"
              maxW="420px"
              w="100%"
            >
              <Dialog.Header mb="10px">
                <Dialog.Title fontFamily="heading" fontSize="17px" fontWeight="700" color="white">
                  {t('events.deleteTitle')}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color={thColors.textDim} fontSize="14px" lineHeight="1.5">
                  {`${t('events.confirmDelete')} «${event.name}»`}
                </Text>
              </Dialog.Body>
              <Dialog.Footer mt="18px">
                <Flex gap="8px" width="100%" justify="flex-end">
                  <GradientButton variant="ghost" h="40px" onClick={() => setConfirmDelete(false)}>
                    {t('common.cancel')}
                  </GradientButton>
                  <GradientButton
                    h="40px"
                    bg="linear-gradient(180deg,#FF6B6B,#C62828)"
                    color="white"
                    boxShadow="0 8px 24px rgba(255,80,80,0.3)"
                    onClick={() => void handleDelete()}
                  >
                    {t('events.delete')}
                  </GradientButton>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={isEditing}
        onOpenChange={(details) => {
          if (!details.open) setIsEditing(false)
        }}
      >
        <Portal>
          <Dialog.Backdrop bg="rgba(0,0,0,0.72)" zIndex={1400} />
          <Dialog.Positioner zIndex={1500} placeItems="center" p="16px">
            <Dialog.Content
              bg={thColors.surface}
              border={`1.5px solid ${thColors.border}`}
              borderRadius="18px"
              p="22px"
              maxW="480px"
              w="100%"
            >
              <Dialog.Header mb="14px">
                <Dialog.Title fontFamily="heading" fontSize="17px" fontWeight="700" color="white">
                  {t('events.edit')}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="10px">
                  <Box>
                    <Text fontSize="12px" color={thColors.textFaint} mb="4px">
                      {t('events.name')} *
                    </Text>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      autoFocus
                      {...inputStyles}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="12px" color={thColors.textFaint} mb="4px">
                      {t('events.eventDate')} * (дд.мм.гггг)
                    </Text>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="25.07.2026"
                      value={dateText}
                      onChange={(e) => {
                        setDateText(e.target.value)
                        const parsed = parseDateInput(e.target.value)
                        if (parsed) setForm((f) => ({ ...f, eventDate: parsed }))
                      }}
                      {...inputStyles}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="12px" color={thColors.textFaint} mb="4px">
                      {t('events.location')}
                    </Text>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      {...inputStyles}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="12px" color={thColors.textFaint} mb="4px">
                      {t('events.description')}
                    </Text>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      {...inputStyles}
                    />
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer mt="18px">
                <Flex gap="8px" width="100%" justify="flex-end">
                  <GradientButton variant="ghost" h="40px" onClick={() => setIsEditing(false)}>
                    {t('common.cancel')}
                  </GradientButton>
                  <GradientButton h="40px" onClick={() => void handleSave()}>
                    {t('common.save')}
                  </GradientButton>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

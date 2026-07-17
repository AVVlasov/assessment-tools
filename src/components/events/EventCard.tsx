import React, { useState } from 'react'
import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { Event, EventType } from '../../types'
import { useUpdateEventMutation, useDeleteEventMutation } from '../../__data__/api/eventApi'
import { GradientButton, Pill, SurfaceCard } from '../tehnohub'
import { thColors } from '../../theme'
import { t } from '../../utils/locale'

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  hackathon: t('events.types.hackathon'),
  queen_of_code: t('events.types.queen_of_code'),
  conference: t('events.types.conference'),
}

interface EventCardProps {
  event: Event
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate()
  const [updateEvent] = useUpdateEventMutation()
  const [deleteEvent] = useDeleteEventMutation()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(event.name)

  const handleSaveName = async (): Promise<void> => {
    if (editedName.trim() && editedName !== event.name) {
      try {
        await updateEvent({ id: event._id, data: { name: editedName.trim() } }).unwrap()
      } catch (error) {
        console.error('Failed to update event name:', error)
      }
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = (): void => {
    setEditedName(event.name)
    setIsEditingName(false)
  }

  const handleDelete = async (): Promise<void> => {
    if (window.confirm(t('events.confirmDelete'))) {
      try {
        await deleteEvent(event._id).unwrap()
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }

  return (
    <SurfaceCard
      _hover={{
        borderColor: thColors.green,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s',
      }}
    >
      <Flex direction="column" gap="14px">
        {isEditingName ? (
          <Flex gap="8px" align="center">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              autoFocus
              bg={thColors.surface}
              borderColor={thColors.border}
              color="white"
              borderRadius="14px"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveName()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <GradientButton h="36px" px="12px" onClick={() => void handleSaveName()}>
              <FiCheck />
            </GradientButton>
            <GradientButton variant="ghost" h="36px" px="12px" onClick={handleCancelEdit}>
              <FiX />
            </GradientButton>
          </Flex>
        ) : (
          <Flex align="center" gap="8px" flexWrap="wrap">
            <Text fontFamily="heading" fontSize="16px" fontWeight="700" flex="1">
              {event.name}
            </Text>
            <Pill variant="cyan" fontSize="10.5px">
              {EVENT_TYPE_LABELS[event.eventType || 'hackathon']}
            </Pill>
            <Box
              as="button"
              color={thColors.muted}
              cursor="pointer"
              _hover={{ color: thColors.greenLight }}
              onClick={() => setIsEditingName(true)}
              aria-label={t('events.edit')}
            >
              <FiEdit2 />
            </Box>
          </Flex>
        )}

        {event.description && (
          <Text color={thColors.textDim} fontSize="13px" lineClamp={2}>
            {event.description}
          </Text>
        )}

        <Box>
          <Text fontSize="12px" color={thColors.textFaint}>
            {new Date(event.eventDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {event.location ? ` · ${event.location}` : ''}
          </Text>
        </Box>

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
            onClick={() => void handleDelete()}
            aria-label={t('events.delete')}
          >
            <FiTrash2 />
          </GradientButton>
        </Flex>
      </Flex>
    </SurfaceCard>
  )
}

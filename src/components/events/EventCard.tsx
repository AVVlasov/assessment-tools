import React, { useState } from 'react'
import {
  Box,
  Button,
  Stack,
  Text,
  Heading,
  Input,
  IconButton
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { Event } from '../../types'
import { useUpdateEventMutation, useDeleteEventMutation } from '../../__data__/api/eventApi'

interface EventCardProps {
  event: Event
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate()
  const [updateEvent] = useUpdateEventMutation()
  const [deleteEvent] = useDeleteEventMutation()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(event.name)

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== event.name) {
      try {
        await updateEvent({
          id: event._id,
          data: { name: editedName.trim() }
        }).unwrap()
      } catch (error) {
        console.error('Failed to update event name:', error)
      }
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setEditedName(event.name)
    setIsEditingName(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      try {
        await deleteEvent(event._id).unwrap()
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }

  const handleOpenEvent = () => {
    navigate(`/assessment-tools/admin?eventId=${event._id}`)
  }

  return (
    <Box
      bg="#1A1A1A"
      p={6}
      borderRadius="lg"
      border="1px solid #333333"
      _hover={{
        borderColor: '#D4FF00',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s'
      }}
      position="relative"
    >
      <Stack gap={4}>
        <Stack direction="row" justify="space-between" align="flex-start">
          <Box flex={1}>
            {isEditingName ? (
              <Stack direction="row" gap={2} align="center">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  size="md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <IconButton
                  aria-label="Сохранить"
                  size="sm"
                  colorScheme="green"
                  onClick={handleSaveName}
                >
                  <FiCheck />
                </IconButton>
                <IconButton
                  aria-label="Отмена"
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                >
                  <FiX />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" align="center" gap={2}>
                <Heading size="md" color="white">
                  {event.name}
                </Heading>
                <IconButton
                  aria-label="Редактировать название"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                  color="#B0B0B0"
                  _hover={{ color: '#D4FF00' }}
                >
                  <FiEdit2 />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Stack>

        {event.description && (
          <Text color="#B0B0B0" fontSize="sm" noOfLines={2}>
            {event.description}
          </Text>
        )}

        <Stack gap={2}>
          <Stack direction="row" align="center" gap={2}>
            <Text fontSize="sm" color="#666666">
              Дата:
            </Text>
            <Text fontSize="sm" color="#B0B0B0">
              {new Date(event.eventDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </Stack>

          {event.location && (
            <Stack direction="row" align="center" gap={2}>
              <Text fontSize="sm" color="#666666">
                Место:
              </Text>
              <Text fontSize="sm" color="#B0B0B0">
                {event.location}
              </Text>
            </Stack>
          )}
        </Stack>

        <Stack direction="row" gap={2} mt={2}>
          <Button
            flex={1}
            bg="#D4FF00"
            color="#0A0A0A"
            fontWeight="bold"
            _hover={{ bg: '#C4EF00' }}
            onClick={handleOpenEvent}
          >
            Открыть
          </Button>
          <IconButton
            aria-label="Удалить мероприятие"
            bg="#2A2A2A"
            color="#FF4444"
            borderColor="#FF4444"
            borderWidth="1px"
            _hover={{ bg: '#FF4444', color: 'white' }}
            onClick={handleDelete}
          >
            <FiTrash2 />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}


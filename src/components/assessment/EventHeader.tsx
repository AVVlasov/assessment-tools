import React from 'react';
import { Box, Editable, HStack, Text, Badge, Flex, IconButton } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Switch } from '../ui/switch';
import { useGetEventQuery, useUpdateEventMutation, useToggleVotingMutation } from '../../__data__/api';

export const EventHeader: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || '';
  
  const { data: event, isLoading } = useGetEventQuery(eventId, {
    skip: !eventId
  });
  const [updateEvent] = useUpdateEventMutation();
  const [toggleVoting] = useToggleVotingMutation();

  const handleNameChange = async (name: string) => {
    if (name && name !== event?.name && eventId) {
      await updateEvent({ id: eventId, data: { name } });
    }
  };

  const handleVotingToggle = async () => {
    if (eventId) {
      await toggleVoting(eventId);
    }
  };

  if (isLoading || !event) {
    return null;
  }

  const statusColors = {
    draft: 'gray',
    ready: 'blue',
    active: 'green',
    completed: 'purple'
  };

  const statusLabels = {
    draft: 'Черновик',
    ready: 'Готово',
    active: 'Активно',
    completed: 'Завершено'
  };

  return (
    <Box
      bg="#1A1A1A"
      borderBottom="1px solid #333333"
      p={6}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <HStack gap={4}>
          <IconButton
            aria-label="Вернуться к дашборду"
            onClick={() => navigate('/assessment-tools')}
            size="md"
            bg="#2A2A2A"
            color="#D4FF00"
            _hover={{ bg: '#3A3A3A', color: '#FFFFFF' }}
          >
            <FiArrowLeft size={20} />
          </IconButton>
          <Box fontSize="2xl" fontWeight="900" textTransform="uppercase" letterSpacing="-1px" color="#D4FF00">
            <Editable.Root
              defaultValue={event.name}
              onValueCommit={(e) => handleNameChange(e.value[0])}
              display="inline"
            >
              <Editable.Preview />
              <Editable.Input 
                bg="transparent" 
                border="none" 
                p={0}
                color="#D4FF00"
                _focus={{ outline: 'none', borderBottom: '2px solid #D4FF00' }}
              />
            </Editable.Root>
          </Box>
        </HStack>

        <HStack gap={3}>
          <Text fontSize="sm" fontWeight="600" color="#B0B0B0" textTransform="uppercase">
            Оценка
          </Text>
          <Switch
            checked={event.votingEnabled}
            onCheckedChange={handleVotingToggle}
            colorPalette="green"
          />
          <Text fontSize="sm" fontWeight="700" color={event.votingEnabled ? '#D4FF00' : '#B0B0B0'}>
            {event.votingEnabled ? 'Включена' : 'Выключена'}
          </Text>
        </HStack>
      </Flex>
    </Box>
  );
};


import React, { useState } from 'react';
import { Box, Button, Grid, HStack, Input, Stack, Text, Textarea, Badge, IconButton, Icon } from '@chakra-ui/react';
import { Radio, RadioGroup } from '../../../components/ui/radio';
import { Switch } from '../../../components/ui/switch';
import { useGetTeamsQuery, useCreateTeamMutation, useUpdateTeamMutation, useDeleteTeamMutation, useToggleTeamActiveMutation, useActivateTeamForVotingMutation, useStopTeamVotingMutation, useStopAllVotingMutation } from '../../../__data__/api';
import type { Team, TeamType } from '../../../types';
import { LuPlay, LuSquare, LuPencil, LuTrash2 } from 'react-icons/lu';

interface TeamsTabProps {
  eventId: string;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ eventId }) => {
  const { data: teams = [], isLoading } = useGetTeamsQuery({ eventId });
  const [createTeam] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [toggleActive] = useToggleTeamActiveMutation();
  const [activateForVoting] = useActivateTeamForVotingMutation();
  const [stopTeamVoting] = useStopTeamVotingMutation();
  const [stopAllVoting] = useStopAllVotingMutation();

  const [formData, setFormData] = useState({
    type: 'team' as TeamType,
    name: '',
    projectName: '',
    caseDescription: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TeamType>('all');
  const [showEvaluated, setShowEvaluated] = useState<boolean>(true);
  const [showNotEvaluated, setShowNotEvaluated] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) return;

    try {
      if (editingId) {
        await updateTeam({
          id: editingId,
          data: formData
        }).unwrap();
        setEditingId(null);
      } else {
        await createTeam({ ...formData, eventId }).unwrap();
      }
      
      setFormData({
        type: 'team',
        name: '',
        projectName: '',
        caseDescription: ''
      });
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleEdit = (team: Team) => {
    setFormData({
      type: team.type,
      name: team.name,
      projectName: team.projectName,
      caseDescription: team.caseDescription
    });
    setEditingId(team._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      type: 'team',
      name: '',
      projectName: '',
      caseDescription: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту команду/участника?')) {
      try {
        await deleteTeam(id).unwrap();
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive(id).unwrap();
    } catch (error) {
      console.error('Error toggling team active status:', error);
    }
  };

  const handleActivateForVoting = async (id: string) => {
    try {
      await activateForVoting(id).unwrap();
    } catch (error) {
      console.error('Error activating team for voting:', error);
    }
  };

  const handleStopVoting = async (id: string) => {
    try {
      await stopTeamVoting(id).unwrap();
    } catch (error) {
      console.error('Error stopping team voting:', error);
    }
  };

  const handleStopAllVoting = async () => {
    if (confirm('Вы уверены, что хотите остановить все оценивания?')) {
      try {
        await stopAllVoting({ eventId }).unwrap();
      } catch (error) {
        console.error('Error stopping all voting:', error);
      }
    }
  };

  const getVotingStatusLabel = (status: string) => {
    switch (status) {
      case 'not_evaluated':
        return 'Не оценен';
      case 'evaluating':
        return 'Оценивается';
      case 'evaluated':
        return 'Оценен';
      default:
        return 'Не оценен';
    }
  };

  const getVotingStatusColor = (status: string) => {
    switch (status) {
      case 'not_evaluated':
        return '#B0B0B0';
      case 'evaluating':
        return '#FFD700';
      case 'evaluated':
        return '#00FF00';
      default:
        return '#B0B0B0';
    }
  };

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  const hasActiveVoting = teams.some((team) => team.isActiveForVoting);

  const filteredTeams = teams.filter((team) => {
    if (typeFilter === 'team' && team.type !== 'team') {
      return false;
    }

    if (typeFilter === 'participant' && team.type !== 'participant') {
      return false;
    }

    const isEvaluated = team.votingStatus === 'evaluated';

    if (!showEvaluated && isEvaluated) {
      return false;
    }

    if (!showNotEvaluated && !isEvaluated) {
      return false;
    }

    return true;
  });

  return (
    <Stack gap={6}>
      {hasActiveVoting && (
        <Box
          bg="#1F1F1F"
          p={4}
          border="3px solid #FF0080"
          borderRadius="8px"
        >
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="700" color="#FF0080">
              🔴 Идёт оценивание
            </Text>
            <Button
              bg="#FF0080"
              color="#FFFFFF"
              fontWeight="700"
              px={8}
              borderRadius="50px"
              _hover={{ bg: '#0A0A0A', color: '#FF0080', border: '3px solid #FF0080' }}
              onClick={handleStopAllVoting}
            >
              ⏹ Остановить все оценивания
            </Button>
          </HStack>
        </Box>
      )}

      <Box
        bg="#1F1F1F"
        p={4}
        border="3px solid #333333"
        borderRadius="8px"
      >
        <Stack gap={3}>
          <Text fontSize="md" fontWeight="700" color="#B0B0B0">
            Фильтры отображения
          </Text>

          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="600" color="#D4FF00" textTransform="uppercase">
                Тип
              </Text>
              <RadioGroup
                value={typeFilter}
                onValueChange={(e) => setTypeFilter(e.value as 'all' | TeamType)}
              >
                <HStack gap={4}>
                  <Radio value="all">Все</Radio>
                  <Radio value="team">Только команды</Radio>
                  <Radio value="participant">Только участники</Radio>
                </HStack>
              </RadioGroup>
            </Stack>

            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="600" color="#D4FF00" textTransform="uppercase">
                Статус оценки
              </Text>
              <HStack gap={4}>
                <Switch
                  size="sm"
                  checked={showEvaluated}
                  onCheckedChange={() => setShowEvaluated((prev) => !prev)}
                  colorPalette="green"
                >
                  Оцененные
                </Switch>
                <Switch
                  size="sm"
                  checked={showNotEvaluated}
                  onCheckedChange={() => setShowNotEvaluated((prev) => !prev)}
                  colorPalette="pink"
                >
                  Не оцененные
                </Switch>
              </HStack>
            </Stack>
          </HStack>
        </Stack>
      </Box>

      <Box
        bg="#1F1F1F"
        p={6}
        border="3px solid #333333"
        borderRadius="8px"
      >
        <Text fontSize="xl" fontWeight="900" mb={4} textTransform="uppercase" color="#D4FF00">
          Добавить команду/участника
        </Text>
        
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <RadioGroup
              value={formData.type}
              onValueChange={(e) => setFormData({ ...formData, type: e.value as TeamType })}
            >
              <HStack gap={4}>
                <Radio value="team">Команда</Radio>
                <Radio value="participant">Участник</Radio>
              </HStack>
            </RadioGroup>

            <Input
              placeholder={formData.type === 'team' ? 'Название команды' : 'ФИО участника'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              bg="#1A1A1A"
              border="2px solid #333333"
              color="#FFFFFF"
              _focus={{ borderColor: '#D4FF00' }}
              required
            />

            <Input
              placeholder="Название проекта"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              bg="#1A1A1A"
              border="2px solid #333333"
              color="#FFFFFF"
              _focus={{ borderColor: '#D4FF00' }}
            />

            <Textarea
              placeholder="Описание кейса"
              value={formData.caseDescription}
              onChange={(e) => setFormData({ ...formData, caseDescription: e.target.value })}
              bg="#1A1A1A"
              border="2px solid #333333"
              color="#FFFFFF"
              _focus={{ borderColor: '#D4FF00' }}
              rows={4}
            />

            <HStack gap={3}>
              <Button
                type="submit"
                bg="#D4FF00"
                color="#000000"
                fontWeight="700"
                px={8}
                borderRadius="50px"
                _hover={{ bg: '#0A0A0A', color: '#D4FF00', border: '3px solid #D4FF00' }}
              >
                {editingId ? 'Обновить' : 'Добавить'}
              </Button>
              
              {editingId && (
                <Button
                  onClick={handleCancelEdit}
                  bg="transparent"
                  color="#FF0080"
                  border="3px solid #FF0080"
                  fontWeight="700"
                  px={8}
                  borderRadius="50px"
                  _hover={{ bg: '#FF0080', color: '#FFFFFF' }}
                >
                  Отмена
                </Button>
              )}
            </HStack>
          </Stack>
        </form>
      </Box>

      <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
        {filteredTeams.map((team) => (
          <Box
            key={team._id}
            bg="#1F1F1F"
            p={5}
            border="3px solid #333333"
            borderRadius="8px"
            transition="all 0.3s"
            _hover={{ borderColor: '#FF0080', transform: 'translateY(-5px)' }}
            opacity={team.isActive ? 1 : 0.6}
          >
            <Stack gap={2} mb={3}>
              <HStack justify="space-between">
                <Badge
                  bg={team.type === 'team' ? '#D4FF00' : '#FF0080'}
                  color="#000000"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                >
                  {team.type === 'team' ? 'Команда' : 'Участник'}
                </Badge>
                
                <Badge
                  bg={team.isActive ? '#00FF00' : '#FF6B00'}
                  color="#000000"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="700"
                >
                  {team.isActive ? 'Активна' : 'Остановлена'}
                </Badge>
              </HStack>

              <Badge
                bg={getVotingStatusColor(team.votingStatus || 'not_evaluated')}
                color="#000000"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="700"
                width="fit-content"
              >
                {getVotingStatusLabel(team.votingStatus || 'not_evaluated')}
              </Badge>
            </Stack>

            <Text fontSize="lg" fontWeight="900" mb={2} color="#FFFFFF">
              {team.name}
            </Text>

            {team.projectName && (
              <Text fontSize="sm" color="#B0B0B0" mb={1}>
                <Text as="span" color="#D4FF00" fontWeight="700">Проект:</Text> {team.projectName}
              </Text>
            )}

            {team.caseDescription && (
              <Text fontSize="sm" color="#B0B0B0" mb={3} noOfLines={3}>
                {team.caseDescription}
              </Text>
            )}

            <Stack gap={3} mt={4}>
              <Text 
                fontSize="xs" 
                color="#808080" 
                textTransform="uppercase" 
                fontWeight="600"
                letterSpacing="0.5px"
              >
                Настройки команды
              </Text>

              {team.votingStatus === 'evaluating' ? (
                <Button
                  size="sm"
                  bg="#FF0080"
                  color="#FFFFFF"
                  fontWeight="700"
                  _hover={{ bg: '#0A0A0A', color: '#FF0080', border: '2px solid #FF0080' }}
                  onClick={() => handleStopVoting(team._id)}
                  width="100%"
                  leftIcon={
                    <Icon fontSize="18px">
                      <LuSquare />
                    </Icon>
                  }
                >
                  Стоп
                </Button>
              ) : (
                <Button
                  size="sm"
                  bg="#D4FF00"
                  color="#000000"
                  fontWeight="700"
                  _hover={{ bg: '#C4EF00' }}
                  onClick={() => handleActivateForVoting(team._id)}
                  width="100%"
                  disabled={!team.isActive}
                  leftIcon={
                    <Icon fontSize="18px">
                      <LuPlay />
                    </Icon>
                  }
                >
                  Оценить
                </Button>
              )}

              <HStack gap={2} justify="space-between" align="center">
                <IconButton
                  size="sm"
                  variant="outline"
                  borderColor="#D4FF00"
                  color="#D4FF00"
                  _hover={{ bg: '#D4FF00', color: '#000000' }}
                  onClick={() => handleEdit(team)}
                  aria-label="Редактировать команду"
                >
                  <LuPencil />
                </IconButton>

                <HStack gap={2} flex={1} justify="center">
                  <Text fontSize="sm" color="#B0B0B0">
                    {team.isActive ? 'Активна' : 'Неактивна'}
                  </Text>
                  <Switch
                    size="sm"
                    checked={team.isActive}
                    onCheckedChange={() => handleToggleActive(team._id)}
                    colorPalette="green"
                  />
                </HStack>
                
                <IconButton
                  size="sm"
                  variant="outline"
                  borderColor="#FF0080"
                  color="#FF0080"
                  _hover={{ bg: '#FF0080', color: '#FFFFFF' }}
                  onClick={() => handleDelete(team._id)}
                  aria-label="Удалить команду"
                >
                  <LuTrash2 />
                </IconButton>
              </HStack>
            </Stack>
          </Box>
        ))}
      </Grid>

      {filteredTeams.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Нет команд или участников по выбранным фильтрам
          </Text>
        </Box>
      )}
    </Stack>
  );
};


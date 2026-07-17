import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, HStack, Input, Stack, Text, Textarea, Badge, IconButton, Icon } from '@chakra-ui/react';
import { Radio, RadioGroup } from '../../../components/ui/radio';
import { Switch } from '../../../components/ui/switch';
import {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useToggleTeamActiveMutation,
  useActivateTeamForVotingMutation,
  useStopTeamVotingMutation,
  useStopAllVotingMutation
} from '../../../__data__/api';
import type { EventType, Team, TeamType } from '../../../types';
import { getEventTypeConfig } from '../../../utils/eventTypeConfig';
import { LuPlay, LuSquare, LuPencil, LuTrash2 } from 'react-icons/lu';

interface TeamsTabProps {
  eventId: string;
  eventType: EventType;
}

const TYPE_LABELS: Record<TeamType, string> = {
  team: 'Команда',
  participant: 'Участница',
  speaker: 'Спикер',
  event: 'Мероприятие'
};

const TYPE_BADGE_COLORS: Record<TeamType, string> = {
  team: '#3DDC50',
  participant: '#4FC9F0',
  speaker: '#4CAF50',
  event: '#FF6B00'
};

const FORM_TITLES: Record<EventType, string> = {
  hackathon: 'Добавить команду',
  queen_of_code: 'Добавить участницу',
  conference: 'Добавить спикера'
};

const EMPTY_MESSAGES: Record<EventType, string> = {
  hackathon: 'Нет команд по выбранным фильтрам',
  queen_of_code: 'Нет участниц по выбранным фильтрам',
  conference: 'Нет спикеров по выбранным фильтрам'
};

export const TeamsTab: React.FC<TeamsTabProps> = ({ eventId, eventType }) => {
  const config = getEventTypeConfig(eventType);
  const { data: teams = [], isLoading } = useGetTeamsQuery({ eventId });
  const [createTeam] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [toggleActive] = useToggleTeamActiveMutation();
  const [activateForVoting] = useActivateTeamForVotingMutation();
  const [stopTeamVoting] = useStopTeamVotingMutation();
  const [stopAllVoting] = useStopAllVotingMutation();

  const [formData, setFormData] = useState({
    type: config.defaultTeamType as TeamType,
    name: '',
    projectName: '',
    caseDescription: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TeamType>('all');
  const [showEvaluated, setShowEvaluated] = useState<boolean>(true);
  const [showNotEvaluated, setShowNotEvaluated] = useState<boolean>(true);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      type: config.defaultTeamType
    }));
    setTypeFilter('all');
  }, [config.defaultTeamType, eventType]);

  const resetForm = () => {
    setFormData({
      type: config.defaultTeamType,
      name: '',
      projectName: '',
      caseDescription: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) return;

    const payload = {
      type: formData.type,
      name: formData.name,
      projectName: config.showProjectFields ? formData.projectName : '',
      caseDescription: config.showProjectFields ? formData.caseDescription : ''
    };

    try {
      if (editingId) {
        await updateTeam({
          id: editingId,
          data: payload
        }).unwrap();
        setEditingId(null);
      } else {
        await createTeam({ ...payload, eventId }).unwrap();
      }

      resetForm();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleEdit = (team: Team) => {
    if (team.type === 'event') return;
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
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
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

  const getNamePlaceholder = () => {
    if (formData.type === 'team') return 'Название команды';
    if (formData.type === 'speaker') return 'ФИО спикера';
    return 'ФИО участницы';
  };

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  const eventRatingEntity = teams.find((team) => team.type === 'event');
  const creatableTeams = teams.filter((team) => team.type !== 'event');
  const hasActiveVoting = teams.some((team) => team.isActiveForVoting);

  const filteredTeams = creatableTeams.filter((team) => {
    if (typeFilter !== 'all' && team.type !== typeFilter) {
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

  const renderContestantCard = (team: Team, options?: { hideDelete?: boolean; hideEdit?: boolean }) => (
    <Box
      key={team._id}
      bg="#0C1218"
      p={5}
      border="3px solid rgba(255,255,255,0.12)"
      borderRadius="8px"
      transition="all 0.3s"
      _hover={{ borderColor: '#4FC9F0', transform: 'translateY(-5px)' }}
      opacity={team.isActive ? 1 : 0.6}
    >
      <Stack gap={2} mb={3}>
        <HStack justify="space-between">
          <Badge
            bg={TYPE_BADGE_COLORS[team.type]}
            color="#000000"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
          >
            {TYPE_LABELS[team.type]}
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

      {config.showProjectFields && team.projectName && (
        <Text fontSize="sm" color="#B0B0B0" mb={1}>
          <Text as="span" color="#3DDC50" fontWeight="700">Проект:</Text> {team.projectName}
        </Text>
      )}

      {config.showProjectFields && team.caseDescription && (
        <Text fontSize="sm" color="#B0B0B0" mb={3} lineClamp={3}>
          {team.caseDescription}
        </Text>
      )}

      <Stack gap={3} mt={4}>
        {team.votingStatus === 'evaluating' ? (
          <Button
            size="sm"
            bg="#4FC9F0"
            color="#FFFFFF"
            fontWeight="700"
            _hover={{ bg: '#060B10', color: '#4FC9F0', border: '2px solid #4FC9F0' }}
            onClick={() => handleStopVoting(team._id)}
            width="100%"
          >
            <Icon fontSize="18px" mr={2}>
              <LuSquare />
            </Icon>
            Стоп
          </Button>
        ) : (
          <Button
            size="sm"
            bg="#3DDC50"
            color="#000000"
            fontWeight="700"
            _hover={{ bg: '#21A038' }}
            onClick={() => handleActivateForVoting(team._id)}
            width="100%"
            disabled={!team.isActive}
          >
            <Icon fontSize="18px" mr={2}>
              <LuPlay />
            </Icon>
            Оценить
          </Button>
        )}

        <HStack gap={2} justify="space-between" align="center">
          {!options?.hideEdit && (
            <IconButton
              size="sm"
              variant="outline"
              borderColor="#3DDC50"
              color="#3DDC50"
              _hover={{ bg: '#3DDC50', color: '#000000' }}
              onClick={() => handleEdit(team)}
              aria-label="Редактировать"
            >
              <LuPencil />
            </IconButton>
          )}

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

          {!options?.hideDelete && (
            <IconButton
              size="sm"
              variant="outline"
              borderColor="#FF4444"
              color="#FF4444"
              _hover={{ bg: '#FF4444', color: '#FFFFFF' }}
              onClick={() => handleDelete(team._id)}
              aria-label="Удалить"
            >
              <LuTrash2 />
            </IconButton>
          )}
        </HStack>
      </Stack>
    </Box>
  );

  return (
    <Stack gap={6}>
      {hasActiveVoting && (
        <Box
          bg="#0C1218"
          p={4}
          border="3px solid #4FC9F0"
          borderRadius="8px"
        >
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="700" color="#4FC9F0">
              Идёт оценивание
            </Text>
            <Button
              bg="#4FC9F0"
              color="#FFFFFF"
              fontWeight="700"
              px={8}
              borderRadius="50px"
              _hover={{ bg: '#060B10', color: '#4FC9F0', border: '3px solid #4FC9F0' }}
              onClick={handleStopAllVoting}
            >
              Остановить все оценивания
            </Button>
          </HStack>
        </Box>
      )}

      {config.showEventRatingCard && eventRatingEntity && (
        <Box
          bg="#0C1218"
          p={4}
          border="2px solid #FF6B00"
          borderRadius="8px"
        >
          <Text fontSize="md" fontWeight="700" color="#FF6B00" mb={2} textTransform="uppercase">
            Общая оценка мероприятия
          </Text>
          <Text fontSize="sm" color="#B0B0B0" mb={4} maxW="640px">
            Включайте в конце, когда спикеры уже оценены. Слушатели увидят короткую форму
            про организацию и общее впечатление — не смешивайте это с оценкой доклада.
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
            {renderContestantCard(eventRatingEntity, { hideDelete: true, hideEdit: true })}
          </Grid>
        </Box>
      )}

      <Box
        bg="#0C1218"
        p={4}
        border="3px solid rgba(255,255,255,0.12)"
        borderRadius="8px"
      >
        <Stack gap={3}>
          <Text fontSize="md" fontWeight="700" color="#B0B0B0">
            Фильтры отображения
          </Text>

          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            {config.showTypeSelector && (
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="600" color="#3DDC50" textTransform="uppercase">
                  Тип
                </Text>
                <RadioGroup
                  value={typeFilter}
                  onValueChange={(e) => setTypeFilter(e.value as 'all' | TeamType)}
                >
                  <HStack gap={4}>
                    <Radio value="all">Все</Radio>
                    <Radio value="team">Только команды</Radio>
                    <Radio value="participant">Только участницы</Radio>
                  </HStack>
                </RadioGroup>
              </Stack>
            )}

            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="600" color="#3DDC50" textTransform="uppercase">
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
        bg="#0C1218"
        p={6}
        border="3px solid rgba(255,255,255,0.12)"
        borderRadius="8px"
      >
        <Text fontSize="xl" fontWeight="900" mb={2} textTransform="uppercase" color="#3DDC50">
          {FORM_TITLES[eventType]}
        </Text>
        {eventType === 'conference' && (
          <Text fontSize="sm" color="#B0B0B0" mb={4}>
            Добавьте спикеров в порядке выступлений. Нажимайте «Оценить» только для текущего докладчика —
            так слушатели не путаются.
          </Text>
        )}
        {eventType === 'queen_of_code' && (
          <Text fontSize="sm" color="#B0B0B0" mb={4}>
            Достаточно ФИО участницы. Проект и кейс здесь не нужны — жюри оценивает выступление.
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            {config.showTypeSelector && (
              <RadioGroup
                value={formData.type}
                onValueChange={(e) => setFormData({ ...formData, type: e.value as TeamType })}
              >
                <HStack gap={4}>
                  <Radio value="team">Команда</Radio>
                  <Radio value="participant">Участница</Radio>
                </HStack>
              </RadioGroup>
            )}

            <Input
              placeholder={getNamePlaceholder()}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              bg="#141C24"
              border="2px solid rgba(255,255,255,0.12)"
              color="#FFFFFF"
              _focus={{ borderColor: '#3DDC50' }}
              required
            />

            {config.showProjectFields && (
              <>
                <Input
                  placeholder="Название проекта"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  bg="#141C24"
                  border="2px solid rgba(255,255,255,0.12)"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#3DDC50' }}
                />

                <Textarea
                  placeholder="Описание кейса"
                  value={formData.caseDescription}
                  onChange={(e) => setFormData({ ...formData, caseDescription: e.target.value })}
                  bg="#141C24"
                  border="2px solid rgba(255,255,255,0.12)"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#3DDC50' }}
                  rows={4}
                />
              </>
            )}

            <HStack gap={3}>
              <Button
                type="submit"
                bg="#3DDC50"
                color="#000000"
                fontWeight="700"
                px={8}
                borderRadius="50px"
                _hover={{ bg: '#060B10', color: '#3DDC50', border: '3px solid #3DDC50' }}
              >
                {editingId ? 'Обновить' : 'Добавить'}
              </Button>

              {editingId && (
                <Button
                  onClick={handleCancelEdit}
                  bg="transparent"
                  color="#4FC9F0"
                  border="3px solid #4FC9F0"
                  fontWeight="700"
                  px={8}
                  borderRadius="50px"
                  _hover={{ bg: '#4FC9F0', color: '#FFFFFF' }}
                >
                  Отмена
                </Button>
              )}
            </HStack>
          </Stack>
        </form>
      </Box>

      <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
        {filteredTeams.map((team) => renderContestantCard(team))}
      </Grid>

      {filteredTeams.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            {EMPTY_MESSAGES[eventType]}
          </Text>
        </Box>
      )}
    </Stack>
  );
};

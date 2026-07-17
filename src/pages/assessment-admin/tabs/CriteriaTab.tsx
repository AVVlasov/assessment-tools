import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, Input, Stack, Text, NativeSelect } from '@chakra-ui/react';
import {
  useGetCriteriaQuery,
  useCreateCriteriaMutation,
  useLoadDefaultCriteriaMutation,
  useUpdateCriteriaMutation,
  useDeleteCriteriaMutation
} from '../../../__data__/api';
import type { CriteriaType, CriterionItem, EventType } from '../../../types';
import { getEventTypeConfig } from '../../../utils/eventTypeConfig';

interface CriteriaTabProps {
  eventId: string;
  eventType: EventType;
}

const CRITERIA_TYPE_LABELS: Record<CriteriaType, string> = {
  all: 'Для всех',
  team: 'Только для команд',
  participant: 'Только для участниц',
  speaker: 'Только для спикеров',
  event: 'Общая оценка мероприятия'
};

export const CriteriaTab: React.FC<CriteriaTabProps> = ({ eventId, eventType }) => {
  const config = getEventTypeConfig(eventType);
  const { data: criteriaBlocks = [], isLoading } = useGetCriteriaQuery({ eventId });
  const [createCriteria] = useCreateCriteriaMutation();
  const [loadDefault] = useLoadDefaultCriteriaMutation();
  const [updateCriteria] = useUpdateCriteriaMutation();
  const [deleteCriteria] = useDeleteCriteriaMutation();

  const [blockName, setBlockName] = useState('');
  const [criteriaType, setCriteriaType] = useState<CriteriaType>(config.defaultCriteriaType);
  const [criteria, setCriteria] = useState<CriterionItem[]>([
    { name: '', maxScore: 5 }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setCriteriaType(config.defaultCriteriaType);
  }, [config.defaultCriteriaType, eventType]);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { name: '', maxScore: 5 }]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index: number, field: keyof CriterionItem, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const resetForm = () => {
    setBlockName('');
    setCriteriaType(config.defaultCriteriaType);
    setCriteria([{ name: '', maxScore: 5 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blockName || criteria.some(c => !c.name)) {
      alert('Заполните все поля');
      return;
    }

    try {
      if (editingId) {
        await updateCriteria({
          id: editingId,
          data: { blockName, criteriaType, criteria }
        }).unwrap();
        setEditingId(null);
      } else {
        await createCriteria({ eventId, blockName, criteriaType, criteria }).unwrap();
      }

      resetForm();
    } catch (error) {
      console.error('Error saving criteria:', error);
    }
  };

  const handleLoadDefault = async () => {
    if (confirm('Это заменит все существующие критерии. Продолжить?')) {
      try {
        await loadDefault({ eventId }).unwrap();
        alert('Критерии по умолчанию загружены');
      } catch (error) {
        console.error('Error loading default criteria:', error);
      }
    }
  };

  const handleEdit = (block: { _id: string; blockName: string; criteriaType?: CriteriaType; criteria: CriterionItem[] }) => {
    setBlockName(block.blockName);
    setCriteriaType(block.criteriaType || config.defaultCriteriaType);
    setCriteria(block.criteria);
    setEditingId(block._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот блок критериев?')) {
      try {
        await deleteCriteria(id).unwrap();
      } catch (error) {
        console.error('Error deleting criteria:', error);
      }
    }
  };

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  const defaultsHint =
    eventType === 'conference'
      ? 'Для конференции загрузятся короткие критерии «глазами слушателя»: понятность, польза, логика — без метрик вроде «вовлечённости зала».'
      : eventType === 'queen_of_code'
        ? 'Для конкурса — компактный набор критериев по выступлению участницы.'
        : 'Для хакатона — критерии оценки команды и участницы из положения.';

  return (
    <Stack gap={6}>
      <Box
        bg="#1F1F1F"
        p={4}
        border="2px solid #333333"
        borderRadius="8px"
      >
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          <Box flex={1} minW="240px">
            <Text fontSize="md" fontWeight="700" color="#FFFFFF" mb={1}>
              Критерии по умолчанию
            </Text>
            <Text fontSize="sm" color="#B0B0B0">
              {defaultsHint}
            </Text>
          </Box>
          <Button
            bg="#FF6B00"
            color="#000000"
            fontWeight="700"
            px={6}
            borderRadius="50px"
            _hover={{ bg: '#0A0A0A', color: '#FF6B00', border: '3px solid #FF6B00' }}
            onClick={handleLoadDefault}
          >
            Загрузить критерии по умолчанию
          </Button>
        </HStack>
      </Box>

      <Box
        bg="#1F1F1F"
        p={6}
        border="3px solid #333333"
        borderRadius="8px"
      >
        <Text fontSize="xl" fontWeight="900" mb={4} textTransform="uppercase" color="#D4FF00">
          {editingId ? 'Редактировать блок' : 'Создать блок критериев'}
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <Input
              placeholder="Название блока"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              bg="#1A1A1A"
              border="2px solid #333333"
              color="#FFFFFF"
              _focus={{ borderColor: '#D4FF00' }}
              required
            />

            <Box>
              <Text fontSize="md" fontWeight="700" color="#B0B0B0" mb={2}>
                Тип критериев:
              </Text>
              <NativeSelect.Root
                value={criteriaType}
                onChange={(e) => setCriteriaType(e.target.value as CriteriaType)}
              >
                <NativeSelect.Field
                  bg="#1A1A1A"
                  border="2px solid #333333"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#D4FF00' }}
                >
                  {config.allowedCriteriaTypes.map((type) => (
                    <option key={type} value={type} style={{ background: '#1A1A1A' }}>
                      {CRITERIA_TYPE_LABELS[type]}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>

            <Text fontSize="md" fontWeight="700" color="#B0B0B0" mt={2}>
              Критерии:
            </Text>

            {criteria.map((criterion, index) => (
              <HStack key={index} gap={3} align="start">
                <Input
                  placeholder="Название критерия"
                  value={criterion.name}
                  onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                  bg="#1A1A1A"
                  border="2px solid #333333"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#D4FF00' }}
                  flex={3}
                  required
                />

                <Input
                  type="number"
                  placeholder="Макс. балл"
                  value={criterion.maxScore}
                  onChange={(e) => handleCriterionChange(index, 'maxScore', parseInt(e.target.value) || 5)}
                  bg="#1A1A1A"
                  border="2px solid #333333"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#D4FF00' }}
                  flex={1}
                  min={0}
                  max={10}
                />

                {criteria.length > 1 && (
                  <Button
                    onClick={() => handleRemoveCriterion(index)}
                    bg="transparent"
                    color="#FF0080"
                    border="2px solid #FF0080"
                    _hover={{ bg: '#FF0080', color: '#FFFFFF' }}
                    size="sm"
                  >
                    Удалить
                  </Button>
                )}
              </HStack>
            ))}

            <Button
              onClick={handleAddCriterion}
              bg="transparent"
              color="#D4FF00"
              border="2px solid #D4FF00"
              _hover={{ bg: '#D4FF00', color: '#000000' }}
              width="fit-content"
            >
              + Добавить критерий
            </Button>

            <HStack gap={3} mt={4}>
              <Button
                type="submit"
                bg="#D4FF00"
                color="#000000"
                fontWeight="700"
                px={8}
                borderRadius="50px"
                _hover={{ bg: '#0A0A0A', color: '#D4FF00', border: '3px solid #D4FF00' }}
              >
                {editingId ? 'Обновить блок' : 'Сохранить блок'}
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

      <Stack gap={4}>
        {criteriaBlocks.map((block) => (
          <Box
            key={block._id}
            bg="#1F1F1F"
            p={5}
            border="3px solid #333333"
            borderRadius="8px"
            transition="all 0.3s"
            _hover={{ borderColor: '#D4FF00' }}
          >
            <HStack justify="space-between" mb={3}>
              <Box>
                <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                  {block.blockName}
                </Text>
                <Text fontSize="xs" color="#B0B0B0" mt={1}>
                  {CRITERIA_TYPE_LABELS[block.criteriaType] || CRITERIA_TYPE_LABELS.all}
                </Text>
              </Box>

              <HStack gap={2}>
                <Button
                  size="sm"
                  bg="transparent"
                  color="#D4FF00"
                  border="2px solid #D4FF00"
                  _hover={{ bg: '#D4FF00', color: '#000000' }}
                  onClick={() => handleEdit(block)}
                >
                  Редактировать
                </Button>

                <Button
                  size="sm"
                  bg="transparent"
                  color="#FF0080"
                  border="2px solid #FF0080"
                  _hover={{ bg: '#FF0080', color: '#FFFFFF' }}
                  onClick={() => handleDelete(block._id)}
                >
                  Удалить
                </Button>
              </HStack>
            </HStack>

            <Stack gap={2}>
              {block.criteria.map((criterion, index) => (
                <HStack key={index} justify="space-between" px={3} py={2} bg="#1A1A1A" borderRadius="4px">
                  <Text color="#B0B0B0" fontSize="sm">
                    {index + 1}. {criterion.name}
                  </Text>
                  <Text color="#D4FF00" fontSize="sm" fontWeight="700">
                    0-{criterion.maxScore} баллов
                  </Text>
                </HStack>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      {criteriaBlocks.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Нет добавленных критериев оценки
          </Text>
        </Box>
      )}
    </Stack>
  );
};

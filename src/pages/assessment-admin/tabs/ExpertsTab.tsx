import React, { useState } from 'react';
import { Box, Button, Grid, HStack, Input, Stack, Text, IconButton } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useGetExpertsQuery,
  useCreateExpertMutation,
  useDeleteExpertMutation,
  useUpdateExpertMutation,
  useGetActiveTeamForVotingQuery,
  useGetCriteriaQuery,
  useGetRatingsQuery,
} from '../../../__data__/api';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface ExpertsTabProps {
  eventId: string;
}

export const ExpertsTab: React.FC<ExpertsTabProps> = ({ eventId }) => {
  const { data: experts = [], isLoading } = useGetExpertsQuery({ eventId });
  const { data: activeTeam } = useGetActiveTeamForVotingQuery({ eventId });
  const { data: criteriaBlocks = [] } = useGetCriteriaQuery({ eventId });
  const { data: allRatings = [] } = useGetRatingsQuery({ eventId });
  const [createExpert] = useCreateExpertMutation();
  const [deleteExpert] = useDeleteExpertMutation();
  const [updateExpert] = useUpdateExpertMutation();

  const [fullName, setFullName] = useState('');
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const getExpertLink = (token: string) => {
    if (!token) {
      return '';
    }

    const origin = window.location.origin;
    return `${origin}/assessment-tools/expert/${token}`;
  };

  // Функция расчета прогресса эксперта для активной команды
  const calculateExpertProgress = (expertId: string) => {
    if (!activeTeam) return 0;
    
    const allCriteria = criteriaBlocks.flatMap(block => block.criteria);
    if (allCriteria.length === 0) return 0;

    const expertRating = allRatings.find(r => {
      const ratingExpertId = typeof r.expertId === 'object' ? r.expertId._id : r.expertId;
      const ratingTeamId = typeof r.teamId === 'object' ? r.teamId._id : r.teamId;
      return ratingExpertId === expertId && ratingTeamId === activeTeam._id;
    });

    if (!expertRating) return 0;

    const ratedCriteria = expertRating.ratings.filter(r => r.score > 0).length;
    return Math.round((ratedCriteria / allCriteria.length) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName) return;

    try {
      await createExpert({ eventId, fullName }).unwrap();
      setFullName('');
    } catch (error) {
      console.error('Error creating expert:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого эксперта?')) {
      try {
        await deleteExpert(id).unwrap();
      } catch (error) {
        console.error('Error deleting expert:', error);
      }
    }
  };

  const startEdit = (expert: { _id: string; fullName: string }) => {
    setEditingId(expert._id);
    setEditingName(expert.fullName);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateExpert({ id: editingId, data: { fullName: editingName.trim() } }).unwrap();
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error updating expert:', error);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleDownloadQR = (expert: any) => {
    const svg = document.getElementById(`qr-${expert._id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${expert.fullName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  return (
    <Stack gap={6}>
      <Box
        bg="#0C1218"
        p={6}
        border="3px solid rgba(255,255,255,0.12)"
        borderRadius="8px"
      >
        <Text fontSize="xl" fontWeight="900" mb={4} textTransform="uppercase" color="#3DDC50">
          Добавить эксперта
        </Text>
        
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <Input
              placeholder="ФИО эксперта"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              bg="#141C24"
              border="2px solid rgba(255,255,255,0.12)"
              color="#FFFFFF"
              _focus={{ borderColor: '#3DDC50' }}
              required
            />

            <Button
              type="submit"
              bg="#3DDC50"
              color="#000000"
              fontWeight="700"
              px={8}
              borderRadius="50px"
              _hover={{ bg: '#060B10', color: '#3DDC50', border: '3px solid #3DDC50' }}
              width="fit-content"
            >
              Добавить и сгенерировать QR-код
            </Button>
          </Stack>
        </form>
      </Box>

      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
        {experts.map((expert) => (
          <Box
            key={expert._id}
            bg="#0C1218"
            p={5}
            border="3px solid rgba(255,255,255,0.12)"
            borderRadius="8px"
            transition="all 0.3s"
            _hover={{ borderColor: '#3DDC50', transform: 'translateY(-5px)' }}
            textAlign="center"
          >
            {editingId === expert._id ? (
              <HStack mb={3} gap={2}>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  bg="#141C24"
                  border="2px solid rgba(255,255,255,0.12)"
                  color="#FFFFFF"
                  _focus={{ borderColor: '#3DDC50' }}
                />
                <Button
                  size="sm"
                  bg="#3DDC50"
                  color="#000"
                  onClick={() => void saveEdit()}
                >
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  color="#FFFFFF"
                  borderColor="rgba(255,255,255,0.3)"
                  onClick={() => setEditingId(null)}
                >
                  ✕
                </Button>
              </HStack>
            ) : (
              <HStack justify="center" mb={2} gap={2}>
                <Text fontSize="lg" fontWeight="900" color="#FFFFFF">
                  {expert.fullName}
                </Text>
                <IconButton
                  aria-label="Редактировать"
                  size="xs"
                  variant="ghost"
                  color="#3DDC50"
                  onClick={() => startEdit(expert)}
                >
                  <FiEdit2 />
                </IconButton>
                <IconButton
                  aria-label="Удалить"
                  size="xs"
                  variant="ghost"
                  color="#FF4444"
                  onClick={() => void handleDelete(expert._id)}
                >
                  <FiTrash2 />
                </IconButton>
              </HStack>
            )}

            {activeTeam && (
              <Box mb={4}>
                <Text fontSize="xs" color="#B0B0B0" mb={2}>
                  Прогресс оценивания
                </Text>
                <Box position="relative" height="24px" bg="#141C24" borderRadius="12px" overflow="hidden">
                  <Box
                    position="absolute"
                    height="100%"
                    width={`${calculateExpertProgress(expert._id)}%`}
                    bg={calculateExpertProgress(expert._id) === 100 ? '#00FF00' : '#3DDC50'}
                    transition="all 0.3s ease"
                    borderRadius="12px"
                  />
                  <Text
                    position="absolute"
                    width="100%"
                    lineHeight="24px"
                    fontWeight="700"
                    fontSize="xs"
                    color={calculateExpertProgress(expert._id) > 50 ? '#000000' : '#FFFFFF'}
                  >
                    {calculateExpertProgress(expert._id)}%
                  </Text>
                </Box>
              </Box>
            )}

            <Box
              bg="#FFFFFF"
              p={3}
              borderRadius="8px"
              display="inline-block"
              mb={4}
              cursor="pointer"
              transition="all 0.3s"
              _hover={{ transform: 'scale(1.05)', boxShadow: '0 0 20px #3DDC50' }}
              onClick={() => setSelectedExpert(expert)}
            >
              <QRCodeSVG
                id={`qr-${expert._id}`}
                value={getExpertLink(expert.token)}
                size={150}
                level="H"
                includeMargin={true}
              />
            </Box>

            <Stack gap={2}>
              <Button
                size="sm"
                bg="transparent"
                color="#3DDC50"
                border="2px solid #3DDC50"
                _hover={{ bg: '#3DDC50', color: '#000000' }}
                onClick={() => handleDownloadQR(expert)}
                width="100%"
              >
                Скачать QR
              </Button>
              
              <Button
                size="sm"
                bg="transparent"
                color="#FF6B00"
                border="2px solid #FF6B00"
                _hover={{ bg: '#FF6B00', color: '#000000' }}
                onClick={() => handleCopyLink(getExpertLink(expert.token))}
                width="100%"
              >
                Копировать ссылку
              </Button>
              
              <Button
                size="sm"
                bg="transparent"
                color="#FF4444"
                border="2px solid #FF4444"
                _hover={{ bg: '#FF4444', color: '#FFFFFF' }}
                onClick={() => void handleDelete(expert._id)}
                width="100%"
              >
                Удалить
              </Button>
            </Stack>
          </Box>
        ))}
      </Grid>

      {experts.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Нет добавленных экспертов
          </Text>
        </Box>
      )}

      {/* Модальное окно с увеличенным QR-кодом */}
      {selectedExpert && (
        <Dialog.Root
          open={!!selectedExpert}
          onOpenChange={(details) => !details.open && setSelectedExpert(null)}
          size={{ base: 'full', md: 'lg' }}
        >
          <Dialog.Backdrop bg="blackAlpha.900" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="#060B10"
              border={{ base: 'none', md: '3px solid #3DDC50' }}
              borderRadius={{ base: '0', md: '12px' }}
              p={{ base: 6, md: 6 }}
              maxW={{ base: '100vw', md: '600px' }}
              maxH={{ base: '100vh', md: 'auto' }}
              width={{ base: '100vw', md: 'auto' }}
              height={{ base: '100vh', md: 'auto' }}
              display="flex"
              flexDirection="column"
            >
              <Dialog.Header>
                <Dialog.Title
                  fontSize={{ base: '3xl', md: 'xl' }}
                  fontWeight="900"
                  color="#3DDC50"
                  textAlign="center"
                  mb={{ base: 4, md: 2 }}
                >
                  {selectedExpert.fullName}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body flex="1" display="flex" alignItems="center" justifyContent="center">
                <Box textAlign="center" width="100%">
                  <Box
                    bg="#FFFFFF"
                    p={{ base: 4, md: 4 }}
                    borderRadius="12px"
                    display="inline-block"
                    boxShadow="0 4px 20px rgba(212, 255, 0, 0.3)"
                    width={{ base: '100%', md: 'auto' }}
                    maxW={{ base: '340px', md: '350px' }}
                    mx="auto"
                    cursor="pointer"
                    transition="all 0.3s"
                    _hover={{ transform: 'scale(0.98)', boxShadow: '0 2px 10px rgba(212, 255, 0, 0.5)' }}
                    onClick={() => setSelectedExpert(null)}
                  >
                    <QRCodeSVG
                      value={getExpertLink(selectedExpert.token)}
                      size={300}
                      level="H"
                      includeMargin={true}
                      style={{ width: '100%', height: 'auto', maxWidth: '300px' }}
                    />
                  </Box>
                  
                  <Text
                    mt={{ base: 8, md: 6 }}
                    color="#B0B0B0"
                    fontSize={{ base: 'md', md: 'sm' }}
                    wordBreak="break-all"
                    px={{ base: 4, md: 0 }}
                  >
                    {getExpertLink(selectedExpert.token)}
                  </Text>
                </Box>
              </Dialog.Body>

              <Dialog.Footer mt={{ base: 6, md: 6 }}>
                <Stack gap={3} width="100%">
                  <Button
                    bg="#3DDC50"
                    color="#000000"
                    fontWeight="700"
                    size={{ base: 'lg', md: 'md' }}
                    _hover={{ bg: '#21A038' }}
                    onClick={() => handleDownloadQR(selectedExpert)}
                    width="100%"
                  >
                    Скачать QR-код
                  </Button>
                  
                  <Button
                    bg="transparent"
                    color="#3DDC50"
                    border="2px solid #3DDC50"
                    fontWeight="700"
                    size={{ base: 'lg', md: 'md' }}
                    _hover={{ bg: '#3DDC50', color: '#000000' }}
                    onClick={() => setSelectedExpert(null)}
                    width="100%"
                  >
                    Закрыть
                  </Button>
                </Stack>
              </Dialog.Footer>

              <Dialog.CloseTrigger
                position="absolute"
                top={4}
                right={4}
                color="#3DDC50"
                _hover={{ color: '#FFFFFF' }}
              />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </Stack>
  );
};


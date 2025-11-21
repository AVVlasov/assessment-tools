import React, { useState } from 'react';
import { Box, Grid, HStack, Stack, Text } from '@chakra-ui/react';
import { RadioGroup, Radio } from '../../../components/ui/radio';
import { useGetTop3Query } from '../../../__data__/api';

export const Top3Tab: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('');
  const { data: top3 = [], isLoading } = useGetTop3Query({ type: filterType });

  const placeColors = ['#D4FF00', '#AFAFAF', '#FF6B00'];
  const placeLabels = ['1 МЕСТО', '2 МЕСТО', '3 МЕСТО'];

  if (isLoading) {
    return <Text color="#B0B0B0">Загрузка...</Text>;
  }

  return (
    <Stack gap={6}>
      <HStack>
        <Text fontSize="md" fontWeight="700" color="#B0B0B0">
          Фильтр:
        </Text>
        <RadioGroup value={filterType} onValueChange={(e) => setFilterType(e.value)}>
          <HStack gap={4}>
            <Radio value="">Все</Radio>
            <Radio value="team">Только команды</Radio>
            <Radio value="participant">Только участники</Radio>
          </HStack>
        </RadioGroup>
      </HStack>

      {top3.length > 0 ? (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(3, 1fr)'
          }}
          gap={4}
          alignItems="end"
        >
          {/* 2 место */}
          {top3[1] && (
            <Box
              bg="#1F1F1F"
              p={6}
              border="3px solid #AFAFAF"
              borderRadius="8px"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(175, 175, 175, 0.3)' }}
              position="relative"
              minH="250px"
            >
              <Box
                position="absolute"
                top="-15px"
                left="50%"
                transform="translateX(-50%)"
                bg="#AFAFAF"
                color="#000000"
                px={4}
                py={1}
                borderRadius="50px"
                fontSize="sm"
                fontWeight="900"
                textTransform="uppercase"
              >
                {placeLabels[1]}
              </Box>

              <Stack gap={3} textAlign="center" mt={4}>
                <Text
                  fontSize="6xl"
                  fontWeight="900"
                  color="#AFAFAF"
                  lineHeight="1"
                >
                  2
                </Text>

                <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                  {top3[1].team.name}
                </Text>

                {top3[1].team.projectName && (
                  <Text fontSize="sm" color="#B0B0B0">
                    {top3[1].team.projectName}
                  </Text>
                )}

                <Box
                  bg="#AFAFAF"
                  color="#000000"
                  p={3}
                  borderRadius="8px"
                  mt={2}
                >
                  <Text fontSize="2xl" fontWeight="900">
                    {top3[1].totalScore.toFixed(2)}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                    Баллов
                  </Text>
                </Box>

                <Text fontSize="xs" color="#B0B0B0">
                  Оценок: {top3[1].ratingsCount}
                </Text>
              </Stack>
            </Box>
          )}

          {/* 1 место */}
          {top3[0] && (
            <Box
              bg="#1F1F1F"
              p={6}
              border="3px solid #D4FF00"
              borderRadius="8px"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
              position="relative"
              minH="300px"
            >
              <Box
                position="absolute"
                top="-15px"
                left="50%"
                transform="translateX(-50%)"
                bg="#D4FF00"
                color="#000000"
                px={4}
                py={1}
                borderRadius="50px"
                fontSize="sm"
                fontWeight="900"
                textTransform="uppercase"
                boxShadow="0 0 20px rgba(212, 255, 0, 0.5)"
              >
                {placeLabels[0]}
              </Box>

              <Stack gap={3} textAlign="center" mt={4}>
                <Text
                  fontSize="8xl"
                  fontWeight="900"
                  color="#D4FF00"
                  lineHeight="1"
                  style={{ textShadow: '0 0 30px rgba(212, 255, 0, 0.5)' }}
                >
                  1
                </Text>

                <Text fontSize="xl" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                  {top3[0].team.name}
                </Text>

                {top3[0].team.projectName && (
                  <Text fontSize="sm" color="#B0B0B0">
                    {top3[0].team.projectName}
                  </Text>
                )}

                <Box
                  bg="#D4FF00"
                  color="#000000"
                  p={4}
                  borderRadius="8px"
                  mt={2}
                  boxShadow="0 0 30px rgba(212, 255, 0, 0.3)"
                >
                  <Text fontSize="3xl" fontWeight="900">
                    {top3[0].totalScore.toFixed(2)}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                    Баллов
                  </Text>
                </Box>

                <Text fontSize="xs" color="#B0B0B0">
                  Оценок: {top3[0].ratingsCount}
                </Text>
              </Stack>
            </Box>
          )}

          {/* 3 место */}
          {top3[2] && (
            <Box
              bg="#1F1F1F"
              p={6}
              border="3px solid #FF6B00"
              borderRadius="8px"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-10px)', boxShadow: '0 0 30px rgba(255, 107, 0, 0.3)' }}
              position="relative"
              minH="250px"
            >
              <Box
                position="absolute"
                top="-15px"
                left="50%"
                transform="translateX(-50%)"
                bg="#FF6B00"
                color="#000000"
                px={4}
                py={1}
                borderRadius="50px"
                fontSize="sm"
                fontWeight="900"
                textTransform="uppercase"
              >
                {placeLabels[2]}
              </Box>

              <Stack gap={3} textAlign="center" mt={4}>
                <Text
                  fontSize="6xl"
                  fontWeight="900"
                  color="#FF6B00"
                  lineHeight="1"
                >
                  3
                </Text>

                <Text fontSize="lg" fontWeight="900" color="#FFFFFF" textTransform="uppercase">
                  {top3[2].team.name}
                </Text>

                {top3[2].team.projectName && (
                  <Text fontSize="sm" color="#B0B0B0">
                    {top3[2].team.projectName}
                  </Text>
                )}

                <Box
                  bg="#FF6B00"
                  color="#000000"
                  p={3}
                  borderRadius="8px"
                  mt={2}
                >
                  <Text fontSize="2xl" fontWeight="900">
                    {top3[2].totalScore.toFixed(2)}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                    Баллов
                  </Text>
                </Box>

                <Text fontSize="xs" color="#B0B0B0">
                  Оценок: {top3[2].ratingsCount}
                </Text>
              </Stack>
            </Box>
          )}
        </Grid>
      ) : (
        <Box textAlign="center" py={10}>
          <Text color="#B0B0B0" fontSize="lg">
            Недостаточно данных для отображения топ-3
          </Text>
        </Box>
      )}
    </Stack>
  );
};


import React, { useState } from 'react'
import {
  Box,
  Button,
  Stack,
  Heading,
  Input,
  Textarea,
  Text,
  Field,
  Container,
  IconButton
} from '@chakra-ui/react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useCreateEventMutation } from '../../__data__/api/eventApi'
import { CreateEventRequest } from '../../types'

const steps = [
  { title: 'Основная информация', description: 'Название и дата мероприятия' },
  { title: 'Детали', description: 'Описание и место проведения' },
  { title: 'Подтверждение', description: 'Проверьте данные' }
]

export const EventCreate: React.FC = () => {
  const navigate = useNavigate()
  const [createEvent, { isLoading }] = useCreateEventMutation()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    location: '',
    status: 'draft'
  })

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await createEvent(formData).unwrap()
      navigate('/assessment-tools')
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleChange = (field: keyof CreateEventRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.name.trim().length > 0 && formData.eventDate.length > 0
    }
    return true
  }

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white" py={8}>
      <Container maxW="1000px">
        <Stack gap={8}>
          {/* Header with back button */}
          <Stack direction="row" align="center" gap={4}>
            <IconButton
              aria-label="Назад к списку"
              onClick={() => navigate('/assessment-tools')}
              variant="ghost"
              color="white"
              _hover={{ bg: '#1A1A1A' }}
            >
              <FiArrowLeft size={24} />
            </IconButton>
            <Heading fontSize="3xl" fontWeight="bold" color="#D4FF00">
              Создание мероприятия
            </Heading>
          </Stack>

          {/* Steps Progress */}
          <Box bg="#1A1A1A" p={6} borderRadius="lg" border="1px solid #333333">
            <Stack direction="row" gap={4} align="stretch">
              {steps.map((stepInfo, index) => (
                <React.Fragment key={index}>
                  <Stack flex={1} gap={3}>
                    <Stack direction="row" align="center" gap={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={index <= currentStep ? '#D4FF00' : '#333333'}
                        color={index <= currentStep ? '#0A0A0A' : '#999999'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                        fontSize="lg"
                        flexShrink={0}
                      >
                        {index + 1}
                      </Box>
                      <Box flex={1}>
                        <Text fontSize="md" fontWeight="bold" color={index <= currentStep ? 'white' : '#999999'}>
                          {stepInfo.title}
                        </Text>
                        <Text fontSize="sm" color={index <= currentStep ? '#D0D0D0' : '#666666'}>
                          {stepInfo.description}
                        </Text>
                      </Box>
                    </Stack>
                  </Stack>
                  {index < steps.length - 1 && (
                    <Box
                      w="40px"
                      h="2px"
                      bg={index < currentStep ? '#D4FF00' : '#333333'}
                      alignSelf="center"
                      mt={2}
                    />
                  )}
                </React.Fragment>
              ))}
            </Stack>
          </Box>

          {/* Step Content */}
          <Box bg="#1A1A1A" p={8} borderRadius="lg" border="1px solid #333333" minH="400px">
            {currentStep === 0 && (
              <Stack gap={6}>
                <Field.Root required>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    Название мероприятия
                  </Field.Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Введите название"
                    size="lg"
                    bg="#0A0A0A"
                    borderColor="#333333"
                    color="white"
                    _placeholder={{ color: '#666666' }}
                    _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    Дата проведения
                  </Field.Label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleChange('eventDate', e.target.value)}
                    size="lg"
                    bg="#0A0A0A"
                    borderColor="#333333"
                    color="white"
                    _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                  />
                </Field.Root>
              </Stack>
            )}

            {currentStep === 1 && (
              <Stack gap={6}>
                <Field.Root>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    Описание мероприятия
                  </Field.Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Введите описание"
                    rows={6}
                    bg="#0A0A0A"
                    borderColor="#333333"
                    color="white"
                    _placeholder={{ color: '#666666' }}
                    _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    Место проведения
                  </Field.Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Введите место проведения"
                    size="lg"
                    bg="#0A0A0A"
                    borderColor="#333333"
                    color="white"
                    _placeholder={{ color: '#666666' }}
                    _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                  />
                </Field.Root>
              </Stack>
            )}

            {currentStep === 2 && (
              <Stack gap={6}>
                <Heading size="lg" color="#D4FF00" mb={4}>
                  Проверьте данные
                </Heading>
                
                <Box bg="#0A0A0A" p={6} borderRadius="md" border="1px solid #333333">
                  <Stack gap={4}>
                    <Box>
                      <Text fontSize="sm" color="#B0B0B0" fontWeight="medium" mb={1}>
                        Название:
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="white">
                        {formData.name}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="#B0B0B0" fontWeight="medium" mb={1}>
                        Дата:
                      </Text>
                      <Text fontSize="lg" color="white">
                        {new Date(formData.eventDate).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </Box>
                    
                    {formData.description && (
                      <Box>
                        <Text fontSize="sm" color="#B0B0B0" fontWeight="medium" mb={1}>
                          Описание:
                        </Text>
                        <Text fontSize="md" color="white">
                          {formData.description}
                        </Text>
                      </Box>
                    )}
                    
                    {formData.location && (
                      <Box>
                        <Text fontSize="sm" color="#B0B0B0" fontWeight="medium" mb={1}>
                          Место проведения:
                        </Text>
                        <Text fontSize="md" color="white">
                          {formData.location}
                        </Text>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Stack direction="row" gap={4} justify="flex-end">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                size="lg"
                px={8}
                borderColor="#666666"
                color="white"
                _hover={{ bg: '#1A1A1A', borderColor: '#D4FF00' }}
              >
                Назад
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/assessment-tools')}
              variant="outline"
              disabled={isLoading}
              size="lg"
              px={8}
              borderColor="#666666"
              color="white"
              _hover={{ bg: '#1A1A1A', borderColor: '#FF4444' }}
            >
              Отмена
            </Button>

            {currentStep < 2 ? (
              <Button
                bg="#D4FF00"
                color="#0A0A0A"
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                px={8}
                fontWeight="bold"
                _hover={{ bg: '#C4EF00' }}
                _disabled={{ bg: '#666666', color: '#333333', cursor: 'not-allowed' }}
              >
                Далее
              </Button>
            ) : (
              <Button
                bg="#D4FF00"
                color="#0A0A0A"
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                size="lg"
                px={8}
                fontWeight="bold"
                _hover={{ bg: '#C4EF00' }}
              >
                {isLoading ? 'Создание...' : 'Создать'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default EventCreate

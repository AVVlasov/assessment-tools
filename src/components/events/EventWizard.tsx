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
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogBackdrop
} from '@chakra-ui/react'
import { useCreateEventMutation } from '../../__data__/api/eventApi'
import { CreateEventRequest } from '../../types'

interface EventWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const steps = [
  { title: 'Основная информация', description: 'Название и дата мероприятия' },
  { title: 'Детали', description: 'Описание и место проведения' },
  { title: 'Подтверждение', description: 'Проверьте данные' }
]

export const EventWizard: React.FC<EventWizardProps> = ({ isOpen, onClose, onSuccess }) => {
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
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({
        name: '',
        description: '',
        eventDate: new Date().toISOString().split('T')[0],
        location: '',
        status: 'draft'
      })
      setCurrentStep(0)
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
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogContent>
        <DialogTitle>
          Создание мероприятия
        </DialogTitle>
        <DialogCloseTrigger />
        
        <DialogBody>
          {/* Steps Progress */}
          <Stack gap={4} mb={6}>
            <Stack direction="row" gap={4} align="center">
              {steps.map((stepInfo, index) => (
                <Box key={index} flex={1}>
                  <Stack direction="row" align="center" gap={3}>
                    <Box
                      w={8}
                      h={8}
                      borderRadius="full"
                      bg={index <= currentStep ? '#D4FF00' : '#333333'}
                      color={index <= currentStep ? '#0A0A0A' : '#999999'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      {index + 1}
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold" color={index <= currentStep ? 'white' : '#999999'}>
                        {stepInfo.title}
                      </Text>
                      <Text fontSize="xs" color={index <= currentStep ? '#D0D0D0' : '#999999'}>
                        {stepInfo.description}
                      </Text>
                    </Box>
                  </Stack>
                  {index < steps.length - 1 && (
                    <Box h="2px" bg={index < currentStep ? '#D4FF00' : '#333333'} mt={2} />
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>

          {/* Step Content */}
          {currentStep === 0 && (
            <Stack gap={4} py={4}>
              <Field.Root required>
                <Field.Label color="white" fontWeight="medium">Название мероприятия</Field.Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Введите название"
                  size="lg"
                  bg="#1A1A1A"
                  borderColor="#333333"
                  color="white"
                  _placeholder={{ color: '#666666' }}
                  _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label color="white" fontWeight="medium">Дата проведения</Field.Label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleChange('eventDate', e.target.value)}
                  size="lg"
                  bg="#1A1A1A"
                  borderColor="#333333"
                  color="white"
                  _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                />
              </Field.Root>
            </Stack>
          )}

          {currentStep === 1 && (
            <Stack gap={4} py={4}>
              <Field.Root>
                <Field.Label color="white" fontWeight="medium">Описание мероприятия</Field.Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Введите описание"
                  rows={4}
                  bg="#1A1A1A"
                  borderColor="#333333"
                  color="white"
                  _placeholder={{ color: '#666666' }}
                  _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="white" fontWeight="medium">Место проведения</Field.Label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Введите место проведения"
                  size="lg"
                  bg="#1A1A1A"
                  borderColor="#333333"
                  color="white"
                  _placeholder={{ color: '#666666' }}
                  _focus={{ borderColor: '#D4FF00', boxShadow: '0 0 0 1px #D4FF00' }}
                />
              </Field.Root>
            </Stack>
          )}

          {currentStep === 2 && (
            <Stack gap={4} py={4}>
              <Heading size="md" color="#D4FF00">
                Проверьте данные
              </Heading>
              
              <Box bg="#1A1A1A" p={4} borderRadius="md" border="1px solid #333333">
                <Stack gap={3}>
                  <Box>
                    <Text fontSize="sm" color="#E0E0E0" fontWeight="medium">Название:</Text>
                    <Text fontSize="md" fontWeight="bold" color="white">{formData.name}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="#E0E0E0" fontWeight="medium">Дата:</Text>
                    <Text fontSize="md" color="white">{new Date(formData.eventDate).toLocaleDateString('ru-RU')}</Text>
                  </Box>
                  
                  {formData.description && (
                    <Box>
                      <Text fontSize="sm" color="#E0E0E0" fontWeight="medium">Описание:</Text>
                      <Text fontSize="md" color="white">{formData.description}</Text>
                    </Box>
                  )}
                  
                  {formData.location && (
                    <Box>
                      <Text fontSize="sm" color="#E0E0E0" fontWeight="medium">Место проведения:</Text>
                      <Text fontSize="md" color="white">{formData.location}</Text>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}

          <Stack direction="row" gap={3} justify="flex-end" mt={6}>
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Назад
              </Button>
            )}
            
            <Button onClick={onClose} variant="outline" disabled={isLoading}>
              Отмена
            </Button>

            {currentStep < 2 ? (
              <Button
                bg="#D4FF00"
                color="#0A0A0A"
                onClick={handleNext}
                disabled={!canProceed()}
                _hover={{ bg: '#C4EF00' }}
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
                _hover={{ bg: '#C4EF00' }}
              >
                {isLoading ? 'Создание...' : 'Создать'}
              </Button>
            )}
          </Stack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}


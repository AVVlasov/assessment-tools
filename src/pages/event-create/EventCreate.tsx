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
  IconButton,
} from '@chakra-ui/react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useCreateEventMutation } from '../../__data__/api/eventApi'
import { CreateEventRequest, EventType } from '../../types'
import { EVENT_TYPES } from '../../utils/eventTypeConfig'
import {
  formatEventDateRu,
  parseDateInput,
  toDateInputValue,
  toEventDateIso,
  toRuDateDots,
} from '../../utils/date'
import { toaster } from '../../components/ui/toaster'
import { t } from '../../utils/locale'

const TYPE_LABELS: Record<EventType, { title: string; description: string }> = {
  hackathon: {
    title: t('events.types.hackathon'),
    description: t('events.types.hackathonDesc'),
  },
  queen_of_code: {
    title: t('events.types.queen_of_code'),
    description: t('events.types.queen_of_codeDesc'),
  },
  conference: {
    title: t('events.types.conference'),
    description: t('events.types.conferenceDesc'),
  },
}

const steps = [
  { title: t('events.wizard.step0'), description: t('events.wizard.step0Desc') },
  { title: t('events.wizard.step1'), description: 'Название и дата мероприятия' },
  { title: t('events.wizard.step2'), description: 'Описание и место проведения' },
  { title: t('events.wizard.step3'), description: 'Проверьте данные' },
]

export const EventCreate: React.FC = () => {
  const navigate = useNavigate()
  const [createEvent, { isLoading }] = useCreateEventMutation()
  const [currentStep, setCurrentStep] = useState(0)
  const [dateText, setDateText] = useState(toDateInputValue())
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    eventType: 'conference',
    description: '',
    eventDate: toDateInputValue(),
    location: '',
    status: 'draft',
  })

  const handleNext = (): void => {
    if (currentStep === 1) {
      const parsed = parseDateInput(dateText) || parseDateInput(formData.eventDate)
      if (!parsed) {
        toaster.create({ title: t('events.editInvalid'), type: 'error' })
        return
      }
      setFormData((prev) => ({ ...prev, eventDate: parsed }))
      setDateText(parsed)
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    const parsed = parseDateInput(formData.eventDate)
    if (!parsed || !formData.name.trim() || !formData.eventType) {
      toaster.create({ title: t('events.editInvalid'), type: 'error' })
      return
    }
    try {
      const created = await createEvent({
        ...formData,
        name: formData.name.trim(),
        eventType: formData.eventType,
        eventDate: toEventDateIso(parsed),
      }).unwrap()
      toaster.create({ title: t('events.wizard.created'), type: 'success' })
      navigate(`/assessment-tools/admin?eventId=${created._id}`)
    } catch (error) {
      console.error('Failed to create event:', error)
      toaster.create({ title: t('events.createFailed'), type: 'error' })
    }
  }

  const handleChange = (field: keyof CreateEventRequest, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDateChange = (raw: string): void => {
    setDateText(raw)
    const parsed = parseDateInput(raw)
    if (parsed) {
      handleChange('eventDate', parsed)
    }
  }

  const canProceed = (): boolean => {
    if (currentStep === 0) {
      return Boolean(formData.eventType)
    }
    if (currentStep === 1) {
      return (
        formData.name.trim().length > 0 &&
        Boolean(parseDateInput(dateText) || parseDateInput(formData.eventDate))
      )
    }
    return true
  }

  return (
    <Box minH="100vh" bg="#060B10" color="white" py={{ base: 4, md: 8 }}>
      <Container maxW="1000px" px={{ base: 4, md: 6 }}>
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack direction="row" align="center" gap={{ base: 2, md: 4 }}>
            <IconButton
              aria-label="Назад к списку"
              onClick={() => navigate('/assessment-tools')}
              variant="ghost"
              color="white"
              size={{ base: 'sm', md: 'md' }}
              _hover={{ bg: '#141C24' }}
            >
              <FiArrowLeft size={24} />
            </IconButton>
            <Heading
              fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
              fontWeight="bold"
              color="#3DDC50"
            >
              {t('events.wizard.title')}
            </Heading>
          </Stack>

          <Box bg="#141C24" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid rgba(255,255,255,0.12)">
            <Box display={{ base: 'block', md: 'none' }}>
              <Stack direction="row" align="center" gap={3}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg="#3DDC50"
                  color="#060B10"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="lg"
                  flexShrink={0}
                >
                  {currentStep + 1}
                </Box>
                <Box flex={1}>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    {steps[currentStep].title}
                  </Text>
                  <Text fontSize="sm" color="#E0E0E0">
                    {steps[currentStep].description}
                  </Text>
                </Box>
              </Stack>
              <Text fontSize="xs" color="#5E7280" mt={3} textAlign="center">
                Шаг {currentStep + 1} из {steps.length}
              </Text>
            </Box>

            <Box display={{ base: 'none', md: 'block' }}>
              <Stack direction="row" gap={4} align="stretch">
                {steps.map((stepInfo, index) => (
                  <Stack key={index} flex={1} gap={3}>
                    <Stack direction="row" align="center" gap={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={index <= currentStep ? '#3DDC50' : 'rgba(255,255,255,0.12)'}
                        color={index <= currentStep ? '#060B10' : '#5E7280'}
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
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color={index <= currentStep ? 'white' : '#5E7280'}
                        >
                          {stepInfo.title}
                        </Text>
                        <Text fontSize="xs" color={index <= currentStep ? '#E0E0E0' : '#8FA6B8'}>
                          {stepInfo.description}
                        </Text>
                      </Box>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          <Box
            bg="#141C24"
            p={{ base: 4, md: 6, lg: 8 }}
            borderRadius="lg"
            border="1px solid rgba(255,255,255,0.12)"
            minH={{ base: '300px', md: '400px' }}
          >
            {currentStep === 0 && (
              <Stack gap={4}>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  Выберите тип мероприятия
                </Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.65)">
                  Тип задаёт, что будут оценивать. После создания изменить его нельзя.
                </Text>
                <Stack gap={3}>
                  {EVENT_TYPES.map((type) => {
                    const selected = formData.eventType === type
                    return (
                      <Box
                        key={type}
                        as="button"
                        textAlign="left"
                        p={5}
                        borderRadius="lg"
                        border={
                          selected ? '2px solid #3DDC50' : '2px solid rgba(255,255,255,0.12)'
                        }
                        bg={selected ? 'rgba(61,220,80,0.08)' : '#060B10'}
                        cursor="pointer"
                        onClick={() => handleChange('eventType', type)}
                        _hover={{ borderColor: '#3DDC50' }}
                        width="100%"
                      >
                        <Text
                          fontSize="lg"
                          fontWeight="900"
                          color={selected ? '#3DDC50' : 'white'}
                          mb={1}
                        >
                          {TYPE_LABELS[type].title}
                        </Text>
                        <Text fontSize="sm" color="rgba(255,255,255,0.65)">
                          {TYPE_LABELS[type].description}
                        </Text>
                      </Box>
                    )
                  })}
                </Stack>
              </Stack>
            )}

            {currentStep === 1 && (
              <Stack gap={6}>
                <Field.Root required>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    {t('events.wizard.nameLabel')}
                  </Field.Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('events.wizard.namePlaceholder')}
                    size="lg"
                    bg="#060B10"
                    borderColor="rgba(255,255,255,0.12)"
                    color="white"
                    _placeholder={{ color: '#8FA6B8' }}
                    _focus={{ borderColor: '#3DDC50', boxShadow: '0 0 0 1px #3DDC50' }}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    {t('events.wizard.dateLabel')}
                  </Field.Label>
                  <Stack gap={3}>
                    <Input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      size="lg"
                      bg="#060B10"
                      borderColor="rgba(255,255,255,0.12)"
                      color="white"
                      _focus={{ borderColor: '#3DDC50', boxShadow: '0 0 0 1px #3DDC50' }}
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="дд.мм.гггг"
                      value={/^\d{4}-\d{2}-\d{2}$/.test(dateText) ? toRuDateDots(dateText) : dateText}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onBlur={() => {
                        const parsed = parseDateInput(dateText)
                        if (parsed) {
                          setDateText(parsed)
                          handleChange('eventDate', parsed)
                        }
                      }}
                      size="lg"
                      bg="#060B10"
                      borderColor="rgba(255,255,255,0.12)"
                      color="white"
                      _placeholder={{ color: '#8FA6B8' }}
                      _focus={{ borderColor: '#3DDC50', boxShadow: '0 0 0 1px #3DDC50' }}
                    />
                    <Text fontSize="xs" color="#8FA6B8">
                      Можно выбрать в календаре или ввести вручную: 25.07.2026
                    </Text>
                  </Stack>
                </Field.Root>
              </Stack>
            )}

            {currentStep === 2 && (
              <Stack gap={6}>
                <Field.Root>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    {t('events.wizard.descriptionLabel')}
                  </Field.Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder={t('events.wizard.descriptionPlaceholder')}
                    rows={6}
                    bg="#060B10"
                    borderColor="rgba(255,255,255,0.12)"
                    color="white"
                    _placeholder={{ color: '#8FA6B8' }}
                    _focus={{ borderColor: '#3DDC50', boxShadow: '0 0 0 1px #3DDC50' }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label color="white" fontWeight="medium" fontSize="lg">
                    {t('events.wizard.locationLabel')}
                  </Field.Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder={t('events.wizard.locationPlaceholder')}
                    size="lg"
                    bg="#060B10"
                    borderColor="rgba(255,255,255,0.12)"
                    color="white"
                    _placeholder={{ color: '#8FA6B8' }}
                    _focus={{ borderColor: '#3DDC50', boxShadow: '0 0 0 1px #3DDC50' }}
                  />
                </Field.Root>
              </Stack>
            )}

            {currentStep === 3 && (
              <Stack gap={6}>
                <Heading size="lg" color="#3DDC50" mb={4}>
                  {t('events.wizard.reviewTitle')}
                </Heading>

                <Box bg="#060B10" p={6} borderRadius="md" border="1px solid rgba(255,255,255,0.12)">
                  <Stack gap={4}>
                    <Box>
                      <Text fontSize="sm" color="rgba(255,255,255,0.65)" fontWeight="medium" mb={1}>
                        {t('events.wizard.typeLabel')}:
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="#3DDC50">
                        {TYPE_LABELS[formData.eventType].title}
                      </Text>
                      <Text fontSize="sm" color="rgba(255,255,255,0.65)">
                        {TYPE_LABELS[formData.eventType].description}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color="rgba(255,255,255,0.65)" fontWeight="medium" mb={1}>
                        Название:
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="white">
                        {formData.name}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color="rgba(255,255,255,0.65)" fontWeight="medium" mb={1}>
                        Дата:
                      </Text>
                      <Text fontSize="lg" color="white">
                        {formatEventDateRu(formData.eventDate)}
                      </Text>
                    </Box>

                    {formData.description && (
                      <Box>
                        <Text fontSize="sm" color="rgba(255,255,255,0.65)" fontWeight="medium" mb={1}>
                          Описание:
                        </Text>
                        <Text fontSize="md" color="white">
                          {formData.description}
                        </Text>
                      </Box>
                    )}

                    {formData.location && (
                      <Box>
                        <Text fontSize="sm" color="rgba(255,255,255,0.65)" fontWeight="medium" mb={1}>
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

          <Stack direction={{ base: 'column', md: 'row' }} gap={3} justify="flex-end">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                size={{ base: 'md', md: 'lg' }}
                px={{ base: 6, md: 8 }}
                width={{ base: 'full', md: 'auto' }}
                borderColor="#8FA6B8"
                color="white"
                _hover={{ bg: '#141C24', borderColor: '#3DDC50' }}
              >
                {t('events.wizard.back')}
              </Button>
            )}

            <Button
              onClick={() => navigate('/assessment-tools')}
              variant="outline"
              disabled={isLoading}
              size={{ base: 'md', md: 'lg' }}
              px={{ base: 6, md: 8 }}
              width={{ base: 'full', md: 'auto' }}
              borderColor="#8FA6B8"
              color="white"
              _hover={{ bg: '#141C24', borderColor: '#FF4444' }}
            >
              {t('common.cancel')}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                bg="#3DDC50"
                color="#060B10"
                onClick={handleNext}
                disabled={!canProceed()}
                size={{ base: 'md', md: 'lg' }}
                px={{ base: 6, md: 8 }}
                minW={{ base: 'full', md: '140px' }}
                width={{ base: 'full', md: 'auto' }}
                fontWeight="bold"
                borderRadius="30px"
                opacity={canProceed() ? 1 : 0.55}
                _hover={{ bg: '#21A038' }}
                _disabled={{
                  bg: '#1D2833',
                  color: '#8FA6B8',
                  cursor: 'not-allowed',
                  opacity: 1,
                }}
              >
                {t('events.wizard.next')}
              </Button>
            ) : (
              <Button
                bg="#3DDC50"
                color="#060B10"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                loading={isLoading}
                size={{ base: 'md', md: 'lg' }}
                px={{ base: 6, md: 8 }}
                width={{ base: 'full', md: 'auto' }}
                fontWeight="bold"
                borderRadius="30px"
                _hover={{ bg: '#21A038' }}
              >
                {isLoading ? t('events.wizard.creating') : t('events.wizard.finish')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default EventCreate

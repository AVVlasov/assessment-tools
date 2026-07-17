import React, { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { QRCodeSVG } from 'qrcode.react'
import { thColors } from '../../theme'
import { GradientButton } from './GradientButton'

export interface QrModalProps {
  open: boolean
  title: string
  subtitle?: string
  url: string
  downloadName?: string
  onClose: () => void
  copyLabel?: string
  copiedLabel?: string
  downloadLabel?: string
  closeLabel?: string
  hint?: string
}

export const QrModal = ({
  open,
  title,
  subtitle,
  url,
  downloadName = 'qr.png',
  onClose,
  copyLabel = 'Копировать',
  copiedLabel = 'Скопировано',
  downloadLabel = 'Скачать PNG для презентации',
  closeLabel = 'Закрыть',
  hint,
}: QrModalProps): React.ReactElement | null => {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const handleDownload = (): void => {
    const svg = document.getElementById('th-qr-svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const canvas = document.createElement('canvas')
    const size = 440
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)
    img.onload = () => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 20, 20, size - 40, size - 40)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = downloadName
      a.click()
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  }

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(2,6,10,0.85)"
      zIndex={100}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p="30px"
      backdropFilter="blur(6px)"
      onClick={onClose}
    >
      <Box
        w="440px"
        maxW="100%"
        bg={thColors.card}
        border={`1px solid ${thColors.border}`}
        borderRadius="26px"
        p="26px"
        boxShadow="0 40px 100px rgba(0,0,0,0.7)"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex justify="space-between" align="flex-start" mb="18px">
          <Box>
            <Text fontFamily="heading" fontSize="16px" fontWeight="700" letterSpacing="-0.3px">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="12.5px" color={thColors.textFaint} mt="4px">
                {subtitle}
              </Text>
            )}
          </Box>
          <GradientButton variant="ghost" h="32px" px="14px" fontSize="12px" onClick={onClose}>
            {closeLabel}
          </GradientButton>
        </Flex>

        <Flex justify="center">
          <Box
            bg="white"
            borderRadius="20px"
            p="14px"
            boxShadow="0 0 50px rgba(61,220,80,0.25)"
          >
            <QRCodeSVG id="th-qr-svg" value={url} size={220} level="M" includeMargin={false} />
          </Box>
        </Flex>

        <Flex
          align="center"
          gap="8px"
          bg={thColors.surface}
          border={`1px solid ${thColors.border}`}
          borderRadius="30px"
          pl="16px"
          pr="6px"
          py="6px"
          mt="18px"
        >
          <Text
            flex="1"
            fontSize="12.5px"
            color={thColors.greenLight}
            fontWeight="600"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {url}
          </Text>
          <GradientButton variant="secondary" h="32px" px="14px" fontSize="12px" onClick={handleCopy}>
            {copied ? copiedLabel : copyLabel}
          </GradientButton>
        </Flex>

        <GradientButton w="100%" mt="12px" onClick={handleDownload}>
          {downloadLabel}
        </GradientButton>

        {hint && (
          <Text textAlign="center" fontSize="11.5px" color={thColors.textFaint} mt="12px" lineHeight="1.5">
            {hint}
          </Text>
        )}
      </Box>
    </Box>
  )
}

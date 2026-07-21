import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { thColors } from '../../theme'

export interface KeyOptionProps {
  num: number
  title: string
  subtitle?: string
  selected?: boolean
  onClick?: () => void
}

export const KeyOption = ({
  num,
  title,
  subtitle,
  selected,
  onClick,
}: KeyOptionProps): React.ReactElement => (
  <Flex
    role="button"
    tabIndex={0}
    align="center"
    gap="14px"
    px="15px"
    py="12px"
    borderRadius="12px"
    cursor="pointer"
    bg={selected ? 'rgba(61,220,80,0.08)' : thColors.card}
    border={selected ? `1.5px solid ${thColors.green}` : `1px solid ${thColors.border}`}
    boxShadow={selected ? '0 0 26px rgba(61,220,80,0.2)' : 'none'}
    transition="all 0.15s"
    _hover={{ transform: 'translateX(3px)' }}
    onClick={onClick}
    onKeyDown={(e) => {
      if (!onClick) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
  >
    <Box
      w="44px"
      h="44px"
      borderRadius="13px"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontWeight="800"
      fontSize="16px"
      bg={selected ? thColors.keySel : thColors.keyUnsel}
      color={selected ? '#04220C' : thColors.mutedDark}
      boxShadow={
        selected
          ? `0 4px 0 ${thColors.greenShadow}, inset 0 1px 0 rgba(255,255,255,0.4)`
          : '0 4px 0 #0B1118, inset 0 1px 0 rgba(255,255,255,0.12)'
      }
    >
      {num}
    </Box>
    <Box>
      <Text
        fontSize="14px"
        fontWeight="700"
        color={selected ? thColors.greenLight : 'rgba(255,255,255,0.88)'}
        lineHeight="1.25"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          fontSize="11.5px"
          color={selected ? 'rgba(124,242,154,0.7)' : thColors.mutedDark}
          mt="2px"
        >
          {subtitle}
        </Text>
      )}
    </Box>
  </Flex>
)

import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export type PillVariant = 'outline' | 'solid' | 'green' | 'cyan' | 'white'

export interface PillProps extends BoxProps {
  variant?: PillVariant
  active?: boolean
  dot?: boolean
  children: React.ReactNode
}

const variantStyles: Record<PillVariant, BoxProps> = {
  outline: {
    border: `1.5px solid ${thColors.borderStrong}`,
    bg: 'transparent',
    color: 'white',
  },
  solid: {
    border: 'none',
    bg: 'white',
    color: thColors.surface,
  },
  green: {
    border: 'none',
    bg: thColors.gradientGreenShort,
    color: '#FFFFFF',
  },
  cyan: {
    border: `1.5px solid rgba(0,174,239,0.6)`,
    bg: 'transparent',
    color: thColors.cyanLight,
  },
  white: {
    border: 'none',
    bg: 'white',
    color: thColors.surface,
  },
}

export const Pill = ({
  variant = 'outline',
  active,
  dot,
  children,
  ...rest
}: PillProps): React.ReactElement => {
  const resolved = active ? variantStyles.solid : variantStyles[variant]
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="6px"
      borderRadius="30px"
      px="13px"
      py="5px"
      fontSize="12px"
      fontWeight="700"
      lineHeight="1.2"
      whiteSpace="nowrap"
      {...resolved}
      {...rest}
    >
      {dot && (
        <Box
          as="span"
          w="6px"
          h="6px"
          borderRadius="50%"
          bg={thColors.green}
          flexShrink={0}
        />
      )}
      {children}
    </Box>
  )
}

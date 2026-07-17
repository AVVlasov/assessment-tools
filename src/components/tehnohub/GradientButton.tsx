import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export type GradientButtonVariant = 'primary' | 'secondary' | 'ghost' | 'cyan' | 'key'

export interface GradientButtonProps extends BoxProps {
  variant?: GradientButtonVariant
  disabled?: boolean
  children: React.ReactNode
}

const styles: Record<GradientButtonVariant, BoxProps> = {
  primary: {
    bg: thColors.gradientGreen,
    color: '#06220D',
    border: 'none',
    boxShadow: '0 8px 24px rgba(61,220,80,0.3)',
  },
  secondary: {
    bg: thColors.keyUnsel,
    color: 'white',
    border: 'none',
    boxShadow: `0 4px 0 #0B1118, inset 0 1px 0 rgba(255,255,255,0.12)`,
  },
  ghost: {
    bg: 'transparent',
    color: 'white',
    border: `1.5px solid ${thColors.borderStrong}`,
  },
  cyan: {
    bg: 'transparent',
    color: thColors.cyanLight,
    border: '1.5px solid rgba(0,174,239,0.6)',
  },
  key: {
    bg: thColors.keySel,
    color: '#04220C',
    border: 'none',
    boxShadow: `0 4px 0 ${thColors.greenShadow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
  },
}

export const GradientButton = ({
  variant = 'primary',
  disabled,
  children,
  onClick,
  ...rest
}: GradientButtonProps): React.ReactElement => {
  const base = disabled
    ? {
        bg: '#1D2833',
        color: '#B0B0B0',
        border: '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: 'none',
        cursor: 'not-allowed',
      }
    : styles[variant]

  return (
    <Box
      as="button"
      type="button"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      h="48px"
      px="22px"
      borderRadius="30px"
      fontSize="14.5px"
      fontWeight="800"
      fontFamily="inherit"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      transition="all 0.15s"
      opacity={disabled ? 0.85 : 1}
      _hover={
        disabled
          ? undefined
          : variant === 'primary'
            ? { transform: 'translateY(-2px)' }
            : { borderColor: thColors.green, color: thColors.greenLight }
      }
      _active={disabled ? undefined : { transform: 'translateY(2px)' }}
      onClick={disabled ? undefined : onClick}
      {...base}
      {...rest}
    >
      {children}
    </Box>
  )
}

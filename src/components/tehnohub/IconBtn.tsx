import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export interface IconBtnProps extends Omit<BoxProps, 'onClick'> {
  label: string
  danger?: boolean
  active?: boolean
  dashed?: boolean
  disabled?: boolean
  size?: number
  onClick: () => void
  children: React.ReactNode
}

export const IconBtn = ({
  label,
  danger,
  active,
  dashed,
  disabled,
  size = 34,
  onClick,
  children,
  ...rest
}: IconBtnProps): React.ReactElement => {
  const radius = size <= 30 ? '9px' : '10px'
  const border = dashed
    ? '1.5px dashed rgba(255,255,255,0.25)'
    : danger
      ? active
        ? 'none'
        : '1px solid rgba(255,120,120,0.45)'
      : '1px solid rgba(255,255,255,0.2)'

  return (
    <Box
      as="button"
      type="button"
      aria-label={label}
      title={label}
      w={`${size}px`}
      h={`${size}px`}
      minW={`${size}px`}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      borderRadius={radius}
      border={border}
      bg={active ? 'linear-gradient(90deg,#E5484D,#C63A66)' : 'transparent'}
      color={
        disabled
          ? 'rgba(255,255,255,0.25)'
          : danger
            ? active
              ? '#fff'
              : '#FF8A8A'
            : dashed
              ? 'rgba(255,255,255,0.6)'
              : 'rgba(255,255,255,0.65)'
      }
      cursor={disabled ? 'not-allowed' : 'pointer'}
      fontFamily="inherit"
      p={0}
      opacity={disabled ? 0.55 : 1}
      transition="all 0.15s"
      _hover={
        disabled
          ? undefined
          : {
              borderColor: danger
                ? 'rgba(255,120,120,0.7)'
                : dashed
                  ? thColors.green
                  : 'rgba(255,255,255,0.45)',
              color: danger ? (active ? '#fff' : '#FF4444') : dashed ? thColors.greenLight : '#fff',
              bg: active ? 'linear-gradient(90deg,#E5484D,#C63A66)' : 'rgba(255,255,255,0.04)',
            }
      }
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {children}
    </Box>
  )
}

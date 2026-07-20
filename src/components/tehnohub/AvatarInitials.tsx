import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export interface AvatarInitialsProps extends BoxProps {
  name: string
  size?: number
  live?: boolean
  initials?: string
}

export const AvatarInitials = ({
  name,
  size = 48,
  live = true,
  initials,
  ...rest
}: AvatarInitialsProps): React.ReactElement => (
  <Box
    w={`${size}px`}
    h={`${size}px`}
    borderRadius={`${Math.round(size * 0.25)}px`}
    bg={live ? thColors.cyan : '#2B3947'}
    color={live ? thColors.cyanDeep : thColors.muted}
    display="flex"
    alignItems="center"
    justifyContent="center"
    fontWeight="800"
    fontSize={`${Math.round(size * 0.34)}px`}
    flexShrink={0}
    {...rest}
  >
    {initials || getInitials(name)}
  </Box>
)

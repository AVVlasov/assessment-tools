import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export interface SurfaceCardProps extends BoxProps {
  highlighted?: boolean
  children: React.ReactNode
}

export const SurfaceCard = ({
  highlighted,
  children,
  ...rest
}: SurfaceCardProps): React.ReactElement => (
  <Box
    bg={thColors.card}
    border={highlighted ? `1.5px solid ${thColors.green}` : `1px solid ${thColors.border}`}
    borderRadius="22px"
    p="18px"
    boxShadow={highlighted ? '0 0 44px rgba(61,220,80,0.14)' : 'none'}
    {...rest}
  >
    {children}
  </Box>
)

import React from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { thColors } from '../../theme'

export interface PageShellProps extends BoxProps {
  hero?: boolean
  children: React.ReactNode
}

export const PageShell = ({ hero, children, ...rest }: PageShellProps): React.ReactElement => (
  <Box
    minH="100vh"
    bg={thColors.bg}
    color="white"
    fontFamily="body"
    backgroundImage={hero ? thColors.gradientHero : undefined}
    backgroundRepeat="no-repeat"
    {...rest}
  >
    {children}
  </Box>
)

import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { thColors } from '../../theme'

export interface StepProgressProps {
  total: number
  current: number
}

export const StepProgress = ({ total, current }: StepProgressProps): React.ReactElement => (
  <Flex gap="6px" mt="14px">
    {Array.from({ length: total }, (_, i) => (
      <Box
        key={i}
        flex="1"
        h="5px"
        borderRadius="3px"
        bg={i <= current ? thColors.gradientGreenShort : 'rgba(255,255,255,0.15)'}
      />
    ))}
  </Flex>
)

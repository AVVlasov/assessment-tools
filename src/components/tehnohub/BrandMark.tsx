import React from 'react'
import { Flex, Box } from '@chakra-ui/react'

export interface BrandMarkProps {
  size?: number
}

/** Decorative brand mark (not a carousel control). */
export const BrandMark = ({ size = 13 }: BrandMarkProps): React.ReactElement => (
  <Flex
    align="center"
    gap="5px"
    aria-hidden="true"
    pointerEvents="none"
    title="Assessment Tools"
  >
    <Box w={`${size}px`} h={`${size}px`} borderRadius="50%" bg="white" />
    <Box
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="4px"
      border="1.5px solid white"
    />
    <Box
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="50%"
      border="1.5px solid white"
    />
  </Flex>
)

import React from 'react'
import { ChakraProvider as ChacraProv, createSystem, defaultConfig } from '@chakra-ui/react'
import type { PropsWithChildren } from 'react'

const ChacraProvider: React.ElementType = ChacraProv

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      bg: '#0A0A0A',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    },
  },
  theme: {
    tokens: {
      colors: {
        primary: {
          bg: { value: '#0A0A0A' },
          secondary: { value: '#1A1A1A' },
          card: { value: '#1F1F1F' }
        },
        accent: {
          primary: { value: '#D4FF00' },
          orange: { value: '#FF6B00' },
          pink: { value: '#FF0080' },
          gray: { value: '#AFAFAF' }
        },
        text: {
          white: { value: '#FFFFFF' },
          gray: { value: '#B0B0B0' }
        },
        border: {
          default: { value: '#333333' }
        }
      },
      fonts: {
        body: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' },
        heading: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }
      },
      radii: {
        l1: { value: '0.5rem' },
        l2: { value: '0.75rem' },
        l3: { value: '1rem' },
        full: { value: '50px' }
      }
    },
    semanticTokens: {
      colors: {
        bg: {
          primary: { value: '{colors.primary.bg}' },
          secondary: { value: '{colors.primary.secondary}' },
          card: { value: '{colors.primary.card}' }
        }
      }
    }
  }
})

export const Provider = (props: PropsWithChildren) => (
  <ChacraProvider value={system}>
    {props.children}
  </ChacraProvider>
)

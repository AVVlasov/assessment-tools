import React from 'react'
import { ChakraProvider as ChacraProv, createSystem, defaultConfig } from '@chakra-ui/react'
import type { PropsWithChildren } from 'react'
import { Toaster } from './components/ui/toaster'

const ChacraProvider: React.ElementType = ChacraProv

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      bg: '#060B10',
      color: '#FFFFFF',
      fontFamily: "'Golos Text', system-ui, sans-serif",
    },
    '@keyframes popIn': {
      '0%': { transform: 'scale(0.6)', opacity: 0 },
      '70%': { transform: 'scale(1.08)' },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
    '@keyframes floatUp': {
      '0%': { transform: 'translateY(14px)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 },
    },
  },
  theme: {
    tokens: {
      colors: {
        th: {
          bg: { value: '#060B10' },
          surface: { value: '#0C1218' },
          card: { value: '#141C24' },
          elevated: { value: '#1A222C' },
          key: { value: '#232E3A' },
          green: { value: '#3DDC50' },
          greenDark: { value: '#21A038' },
          greenLight: { value: '#7CF29A' },
          greenDeep: { value: '#1FA53E' },
          greenShadow: { value: '#0F6B26' },
          cyan: { value: '#00AEEF' },
          cyanLight: { value: '#4FC9F0' },
          cyanDeep: { value: '#04222E' },
          muted: { value: '#8FA6B8' },
          mutedDark: { value: '#5E7280' },
          text: { value: '#FFFFFF' },
          textDim: { value: 'rgba(255,255,255,0.65)' },
          textFaint: { value: 'rgba(255,255,255,0.5)' },
          border: { value: 'rgba(255,255,255,0.12)' },
          borderStrong: { value: 'rgba(255,255,255,0.3)' },
        },
        primary: {
          bg: { value: '#060B10' },
          secondary: { value: '#0C1218' },
          card: { value: '#141C24' },
        },
        accent: {
          primary: { value: '#3DDC50' },
          orange: { value: '#00AEEF' },
          pink: { value: '#4FC9F0' },
          gray: { value: '#8FA6B8' },
        },
        text: {
          white: { value: '#FFFFFF' },
          gray: { value: '#B0B0B0' },
        },
        border: {
          default: { value: 'rgba(255,255,255,0.12)' },
        },
      },
      fonts: {
        body: { value: "'Golos Text', system-ui, sans-serif" },
        heading: { value: "'Unbounded', system-ui, sans-serif" },
      },
      radii: {
        l1: { value: '0.75rem' },
        l2: { value: '1rem' },
        l3: { value: '1.25rem' },
        full: { value: '30px' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          primary: { value: '{colors.th.bg}' },
          secondary: { value: '{colors.th.surface}' },
          card: { value: '{colors.th.card}' },
        },
      },
    },
  },
})

export const thColors = {
  bg: '#060B10',
  surface: '#0C1218',
  card: '#141C24',
  elevated: '#1A222C',
  key: '#232E3A',
  green: '#3DDC50',
  greenDark: '#21A038',
  greenLight: '#7CF29A',
  greenDeep: '#1FA53E',
  greenShadow: '#0F6B26',
  cyan: '#00AEEF',
  cyanLight: '#4FC9F0',
  cyanDeep: '#04222E',
  muted: '#8FA6B8',
  mutedDark: '#5E7280',
  textDim: 'rgba(255,255,255,0.65)',
  textFaint: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.3)',
  gradientGreen: 'linear-gradient(90deg,#21A038,#3DDC50,#8AE98F)',
  gradientGreenShort: 'linear-gradient(90deg,#21A038,#3DDC50)',
  gradientHero: [
    'radial-gradient(80% 60% at 100% 0%,rgba(47,211,123,0.55) 0%,rgba(47,211,123,0) 70%)',
    'radial-gradient(140% 100% at 100% 0%,#2FD37B 0%,#26C994 8%,#1CBA9F 16%,#12A8A6 26%,#0E8A90 36%,#0C5F6A 46%,#0B3540 58%,#081F28 74%,#050E14 100%)',
  ].join(','),
  gradientAdmin: [
    'radial-gradient(70% 90% at 95% 0%,rgba(47,211,123,0.5) 0%,rgba(47,211,123,0) 65%)',
    'radial-gradient(120% 200% at 95% 0%,#2FD37B 0%,#26C994 10%,#1CBA9F 18%,#12A8A6 28%,#0E8A90 40%,#0C5F6A 50%,#0B3540 62%,#0A1A22 80%,#0C1218 100%)',
  ].join(','),
  keyUnsel: 'linear-gradient(180deg,#232E3A,#1A222C)',
  keySel: 'linear-gradient(180deg,#4BE96A,#1FA53E)',
} as const

export const Provider = (props: PropsWithChildren) => (
  <ChacraProvider value={system}>
    {props.children}
    <Toaster />
  </ChacraProvider>
)

import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Flex, Spinner } from '@chakra-ui/react'

import { URLs } from './__data__/urls'
import { MainPage } from './pages'
import { thColors } from './theme'

const AssessmentAdminPage = lazy(() => import('./pages/assessment-admin'))
const AssessmentExpertPage = lazy(() => import('./pages/assessment-expert'))
const AssessmentListenerPage = lazy(() => import('./pages/assessment-listener'))
const EventCreatePage = lazy(() => import('./pages/event-create'))

const PageWrapper = ({ children }: React.PropsWithChildren) => (
  <Suspense
    fallback={
      <Flex minH="100vh" bg={thColors.bg} align="center" justify="center">
        <Spinner color={thColors.green} size="xl" />
      </Flex>
    }
  >
    {children}
  </Suspense>
)

export const Dashboard = () => {
  return (
    <Routes>
      <Route
        path={URLs.baseUrl}
        element={
          <PageWrapper>
            <MainPage />
          </PageWrapper>
        }
      />
      <Route
        path="/assessment-tools/admin"
        element={
          <PageWrapper>
            <AssessmentAdminPage />
          </PageWrapper>
        }
      />
      <Route
        path="/assessment-tools/expert/:token"
        element={
          <PageWrapper>
            <AssessmentExpertPage />
          </PageWrapper>
        }
      />
      <Route
        path="/assessment-tools/rate/hall/:token"
        element={
          <PageWrapper>
            <AssessmentListenerPage />
          </PageWrapper>
        }
      />
      <Route
        path="/assessment-tools/events/create"
        element={
          <PageWrapper>
            <EventCreatePage />
          </PageWrapper>
        }
      />
    </Routes>
  )
}

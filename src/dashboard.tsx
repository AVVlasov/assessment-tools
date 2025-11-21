import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { URLs } from './__data__/urls'
import { MainPage } from './pages'

const AssessmentAdminPage = lazy(() => import('./pages/assessment-admin'))
const AssessmentExpertPage = lazy(() => import('./pages/assessment-expert'))

const PageWrapper = ({ children }: React.PropsWithChildren) => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
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
    </Routes>
  )
}

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'

import { Dashboard } from './dashboard'
import { Provider } from './theme'
import { store } from './__data__/store'

const App = () => {
  return (
    <BrowserRouter>
      <ReduxProvider store={store}>
        <Provider>
          <Dashboard />
        </Provider>
      </ReduxProvider>
    </BrowserRouter>
  )
}

export default App

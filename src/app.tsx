import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'

import { Dashboard } from './dashboard'
import { Provider } from './theme'
import { store } from './__data__/store'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=Unbounded:wght@500;700&display=swap'

const App = () => {
  useEffect(() => {
    const id = 'tehnohub-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    document.head.appendChild(link)
  }, [])

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

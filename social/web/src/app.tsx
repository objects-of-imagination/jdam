import { Router, Routes, Route } from '@solidjs/router'
import { Login } from './login/login'
import { UserDashboard } from './dash/dash'
import { ClientProvider } from './client_provider'

import '~shared/assets/app.css'
import { Theme } from '~comps/theme'

function App() {

  return (
    <ClientProvider>
      <Theme/>
      <Router>
        <Routes>
          <Route path="/dash" component={ UserDashboard }/>
          <Route path="/*" component={ Login }/>
        </Routes>
      </Router>
    </ClientProvider>
  )
}

export default App

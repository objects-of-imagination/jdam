import { ClientProvider } from './client_provider'
import { NodeLanes } from './node_lanes'
import { Theme } from '~comps/theme'
import { SoundList } from './sound_list'

import '~shared/assets/app.css'
import styles from './app.module.css'

function App() {
  return (
    <ClientProvider>
      <Theme/>
      <div class={ `fixed full ${styles.app}` }>
        <SoundList/>
        <div class={ `relative ${styles.main}` }>
          <NodeLanes/>
        </div>
        <div class={ `relative ${styles.toolbar}` }>
          Toolbar 
        </div>
      </div>
    </ClientProvider>
  )
}

export default App

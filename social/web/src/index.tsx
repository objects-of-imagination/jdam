/* @refresh reload */
import { render } from 'solid-js/web'

import '~shared/index.css'
import App from './app'

const root = document.getElementById('root')

render(() => <App />, root!)

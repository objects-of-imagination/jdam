import { ParentComponent, createContext, createEffect, useContext } from 'solid-js'
import { SessionClient } from './client/session_client'

const client = new SessionClient()

declare global {
  interface Window {
    client: SessionClient
  }
}

window.client = client
const ClientContext = createContext<{ client: SessionClient }>({ client })

export interface ClientProviderProps {
  client?: SessionClient
  clientInit?: (client: SessionClient) => void
}

export const ClientProvider: ParentComponent<ClientProviderProps> = props => {

  createEffect(() => {
    if (props.clientInit) {
      props.clientInit(props.client ? props.client : client)
      return
    }
    props.client ? props.client.init() : client.init()
  })

  return (
    <ClientContext.Provider value={ { client: props.client ? props.client : client } }>
      { props.children }
    </ClientContext.Provider>
  )
}

export function useClient() { return useContext(ClientContext).client }

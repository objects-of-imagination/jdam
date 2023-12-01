import { ParentComponent, createContext, createEffect, useContext } from 'solid-js'
import { SocialClient } from './client/social_client'

const client = new SocialClient()

declare global {
  interface Window {
    client: SocialClient
  }
}

window.client = client
const ClientContext = createContext<{ client: SocialClient }>({ client })

export interface ClientProviderProps {
  client?: SocialClient
  clientInit?: (client: SocialClient) => void
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

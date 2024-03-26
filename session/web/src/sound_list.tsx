import { For, createSignal, onCleanup, onMount, Switch, Match, createMemo, Show } from 'solid-js'
import { useClient } from './client_provider'
import { Tabs } from '~comps/tabs'
import { Sound } from '~shared/data'
import { DataState } from './client/session_client'

import styles from './sound_list.module.css'

export function SoundList() {
  const client = useClient()

  const [ sounds, setSounds ] = createSignal(Array.from(client.data.sounds.values()))
  const [ unlinked, setUnlinked ] = createSignal(client.getUnlinkedSounds())
  const [ viewing, setViewing ] = createSignal('all')

  const unlinkedSet = createMemo(() => {
    return new Set(unlinked().map(sound => sound.id))
  })

  const updateList = (data: Partial<DataState> = client.data) => {
    if (!(data.sounds || data.nodes)) { return }
    setSounds(Array.from(client.data.sounds.values()))
    setUnlinked(client.getUnlinkedSounds())
  }

  let onSetData = (data: Partial<DataState>) => {
    updateList(data)
  }

  onMount(() => {
    client.on('set-data', onSetData)
  })

  onCleanup(() => {
    client.off('set-data', onSetData)
  })

  return (
    <div class={ `rounded absolute box-shadow ${styles.soundList} ${styles.expanded}` }>
      <Tabs
        tabs={ [
          { index: 'all', name: 'All' },
          { index: 'unlinked', name: 'Unlinked' }
        ] }
        initialTab={ viewing() }
        onSelectTab={ index => { setViewing(index) } }
      >
        { index => (
          <ul class="list">
            <Switch>
              <Match when={ index === 'all' }>
                <For each={ sounds() }>
                  { sound => (
                    <SoundListItem 
                      sound={ sound }
                      unlinked={ unlinkedSet().has(sound.id) }
                    />
                  )}
                </For> 
              </Match>
              <Match when={ index === 'unlinked' }>
                <For each={ unlinked() }>
                  { sound => (
                    <SoundListItem 
                      sound={ sound }
                      unlinked
                    />
                  )}
                </For> 
              </Match>
            </Switch>
          </ul>
        )}
      </Tabs>
    </div>
  )
}


export interface SoundListItemProps {
  sound: Sound
  unlinked?: boolean
}

export function SoundListItem(props: SoundListItemProps) {
  return (
    <li class={ styles.soundListItem } classList={ {  unlinked: props.unlinked } }>
      <div class={ styles.name }>
        { props.sound.name }
      </div>
      <div class={ styles.unlinked }>
        <Show when={ props.unlinked }>
          U
        </Show>
      </div>
      <div class={ styles.createdby }>
        { props.sound.createdBy }
      </div>
    </li> 
  )
}

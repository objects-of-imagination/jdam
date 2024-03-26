import { For, JSX, createComputed, createSignal } from 'solid-js'

import styles from './tabs.module.css'

export interface TabsProps {
  tabs: { index: string, name?: string }[]
  initialTab?: string & TabsProps['tabs'][number]['index'],
  onSelectTab?: (index: string & TabsProps['tabs'][number]['index']) => void
  children: (index: string & TabsProps['tabs'][number]['index']) => JSX.Element
}

export function Tabs(props: TabsProps) {

  const [ activeTab, setActiveTab ] = createSignal(props.initialTab || '')
  
  createComputed(() => {
    if (!props.tabs.length) { return }
    setActiveTab(props.tabs[0].index)
  })

  const handleOnSelect = (index: string) => {
    setActiveTab(index)
    props.onSelectTab?.(index)
  }

  return (
    <div class={ styles.tabs }>
      <div class={ styles.tabHeader }>
        <For each={ props.tabs }>
          { tab => (
            <button 
              class={ `no-fill ${styles.tab}` }
              classList={ { active: activeTab() === tab.index } }
              onClick={ () => { handleOnSelect(tab.index) }  }
            >
              { tab.name ? tab.name : tab.index }
            </button>
          )}
        </For>
      </div>
      <div class={ styles.tabContent }>
        { props.children(activeTab()) }
      </div>
    </div>
  )
}

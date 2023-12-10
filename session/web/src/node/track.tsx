import { useClient } from '../client_provider'
import styles from './track.module.css'
import Deferred from '~shared/deferred'
import { Node, Sound } from '~shared/data'
import { Show } from 'solid-js'

export interface TrackProps {
  node: Node
  sound?: Sound
}

export function Track(props: TrackProps) {
  const client = useClient()
  client

  let fileSelected = new Deferred<File>()
  let input: HTMLInputElement | undefined


  const handleOnClick = async () => {
    if (!input) { return }

    fileSelected.init()

    input.addEventListener('change', () => {
      if (!input?.files?.[0]) {
        fileSelected.reject(new Error('no file selected'))
        return 
      }

      fileSelected.resolve(input.files[0])
    }, { once: true })
    input.addEventListener('cancel', () => {
      fileSelected.reject(new Error('canceled'))
    }, { once: true })

    input.click()

    try  {
      const file = await fileSelected.promise
      console.log(file)

      const newSound = await client.createSound({
        createdBy: client.data.person,
        nodeId: props.node.id,
        sound: {
          name: file.name,
          size: file.size
        }
      })
      if (!newSound) { return }

      try {
        await client.uploadSound(file, newSound.id, file.name)
      } catch (err) {
        console.log(err)
        await client.deleteSound({ id: newSound.id })
      }
    } catch (err) {
      // console.log('canceled')
    }
  }

  return (
    <div class={ styles.track }>
      <div class={ `flex center ${styles.controls}` }>
        info
      </div>
      <div class={ `flex center ${styles.waveform}` }>
        <Show 
          when={ props.sound }
          fallback={
            <button 
              class="secondary rounded"
              onClick={ handleOnClick }
            >
            Upload
            </button>
          }>
          { props.sound!.name }
        </Show>
      </div>
      <input 
        ref={ input }
        class="display none"
        type="file"
        accept="audio/*"
      />
    </div>
  )
}

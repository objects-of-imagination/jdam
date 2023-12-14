import { createEffect, createMemo, createResource, onCleanup, onMount } from 'solid-js'
import { Id } from '~shared/data'
import { useClient } from './client_provider'

import styles from './waveform.module.css'

export interface WaveformProps {
  soundId: Id
}

export default function Waveform(props: WaveformProps) {
  const client = useClient()

  let canvas: SVGSVGElement | undefined
  
  const [ peaks ] = createResource<number[]>(async () => {
    const data = await client.downloadPcm(props.soundId)
    if (!data) { return [] }

    return Array.from(data)
  })

  const minMax = createMemo(() => {
    const data = peaks()
    if (!data) { return [ 0, 255 ] }

    return [ Math.min(...data), Math.max(...data) ] 
  })

  const redrawCanvas = () => {
    const data = peaks()
    if (!canvas || !data) { return }

    const pathEl = canvas.querySelector('path')
    if (!pathEl) { return }

    const d = [ 'M0,0' ]
    const [ min, max ] = minMax()
    for (let i = 0; i < data.length; i++) {
      const fac = i / (data.length - 1)
      d.push(`L${fac * 200},${-240 * (data[i] - min) / (max - min)}`)
    }
    for (let i = data.length - 1; i >= 0; i--) {
      const fac = i / (data.length - 1)
      d.push(`L${fac * 200},${240 * (data[i] - min) / (max - min)}`)
    }
    d.push('Z')
    pathEl.setAttribute('d', d.join(''))
  }

  const observer = new ResizeObserver(() => {
    redrawCanvas()
  })

  createEffect(() => {
    peaks()
    redrawCanvas()  
  })

  onMount(() => {
    observer.observe(canvas!)
  })

  onCleanup(() => {
    observer.disconnect()
  })

  return (
    <div class="absolute full">
      <svg 
        class={ styles.svg }
        ref={ canvas } 
        viewBox="0 -256 200 512" 
        preserveAspectRatio='none'
      >
        <path vector-effect="non-scaling-stroke" d=""/>
      </svg>
    </div>
  )
}

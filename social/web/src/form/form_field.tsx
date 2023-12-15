import { For, JSX, Match, ParentProps, Show, Switch, createComputed, createEffect, createSignal } from 'solid-js'
import { formId, stateError } from './form'

import styles from './form_field.module.css'

import eye from '~shared/assets/eye.svg'
import checkOrX from '~shared/assets/check_or_x.svg'

export interface FormFieldProps extends JSX.HTMLAttributes<HTMLDivElement> {
  name: string 
}

export function FormField(props: FormFieldProps) {

  let ref: HTMLDivElement | undefined

  createEffect(() => {
    if (!ref) { return }
    
    const label = ref.querySelector('label')
    if (label) {
      label.setAttribute('for', formId(props.name))
      label.className = styles.label
    }

    const input = ref.querySelector('input')
    if (input) {
      input.setAttribute('id', formId(props.name))
      input.className = `rounded no-border ${styles.input}`
    }
    
  })

  return (
    <div style={ { 
      '--primary-fg': 'var(--white)',
      '--primary-bg': 'var(--grey80)'
    } }
    ref={ ref } { ...props }>
      { props.children }
    </div>
  )
}

export function PasswordInput(props: JSX.InputHTMLAttributes<HTMLInputElement>) {

  const [ plain, setPlain ] = createSignal(false)

  return (
    <div class={ `relative ${styles.passwordWrap}` }>
      <input type={ plain() ? 'text' : 'password' } { ...props } class={ `rounded no-border ${styles.input}` }/>
      <button 
        type="button"
        onClick={ () => { setPlain(!plain()) } }
        style={ { right: '0.33em', top: '50%', transform: 'translateY(-50%)' } }
        class="flex center no-fill absolute circle" 
      >
        <svg 
          class="icon no-fill" 
          viewBox="0 0 64 64"
        >
          <use href={ `${eye}#brow` }/>
          <Show when={ plain() } fallback={
            <use href={ `${eye}#closed` }/>
          }>
            <use href={ `${eye}#open` }/>
          </Show>
        </svg>
      </button>
    </div>
  )
}

export interface ValidIndicationProps {
  enabled?: boolean
  state?: 'none' | 'valid' | 'invalid'
  error?: string
  validation?: (input: string, id?: string) => string[] | undefined
}

export function ValidIndication(props: ParentProps<ValidIndicationProps>) {

  let ref: HTMLDivElement | undefined

  const [ state, setState ] = createSignal<ValidIndicationProps['state']>('none')
  const [ errors, setErrors ] = createSignal<ValidIndicationProps['error'][]>([])

  createComputed(() => {
    setErrors(props.error ? [ props.error ] : [])
  })

  createComputed(() => {
    setState(props.state || 'none')
  })

  createComputed(() => {
    if (!props.enabled) {
      setState('none')
      setErrors([])
    }
  })

  createEffect(() => {
    if (!(props.enabled ?? true)) { return }
    if (!ref) { return }

    const input = ref?.querySelector<HTMLInputElement>('input')
    if (!input) { return }

    input.addEventListener('invalid', evt => {
      evt.preventDefault()
      onInput(true)
    })

    const onInput = (required = false) => {
      if (!props.enabled) { return }
      if (!input) { return }
      if (!input.value && !required) { 
        setState('none')
        setErrors([])
        input.setCustomValidity('')
        return
      }

      const errors = stateError(input.validity, {
        input: input.value,
        type: input.type,
        minLength: input.minLength,
        maxLength: input.maxLength,
        pattern: input.pattern
      })

      if (props.validation) {
        const customErrors = props.validation(input.value, input.id)
        input.setCustomValidity(customErrors?.at(0) || '')
        if (customErrors?.length) { errors.splice(0, 0, ...customErrors) }
      }
      setErrors(errors)

      setState(input.validity.valid ? 'valid' : 'invalid')
    }

    input.addEventListener('input', onInput)

    onInput()
  })

  return (
    <div class={ `${styles.validation} ${state()}` }>
      <div class={ `rounded ${styles.border}` }/>
      <div ref={ ref } class={ styles.children }>
        { props.children }
      </div>
      <Show when={ props.enabled }>
        <div class={ `flex center ${styles.icon}` }>
          <svg 
            style={ { stroke: 'var(--border-col, var(--input-bg))' } }
            class="icon no-fill" 
            viewBox="0 0 64 64"
          >
            <Switch>
              <Match when={ state() === 'none' }>
                <use href={ `${checkOrX}#none` }/>
              </Match>
              <Match when={ state() === 'invalid' }>
                <use href={ `${checkOrX}#x` }/>
              </Match>
              <Match when={ state() === 'valid' }>
                <use href={ `${checkOrX}#check` }/>
              </Match>
            </Switch>
          </svg>
        </div>
      </Show>
      <div class={ styles.error }>
        <Show when={ errors().length }>
          <ul>
            <For each={ errors() }>
              { err => (
                <li>{ err }</li>
              ) }
            </For>
          </ul>
        </Show>
      </div>
    </div>
  )
}

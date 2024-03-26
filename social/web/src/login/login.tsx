import { For, Show, createMemo, createSignal, createComputed } from 'solid-js'
import { FormField, PasswordInput, ValidIndication } from '../form/form_field'
import { GradientAnim } from '../gradient_anim'
import { formId } from '../form/form'
import { useClient } from '../client_provider'

import styles from './login.module.css'
import fieldStyles from '../form/form_field.module.css'
import form from '../form/form_field.module.css'

export function Login() {

  const client = useClient()

  let formRef: HTMLFormElement | undefined

  const [ signup, setSignup ] = createSignal(false)
  const [ errors, setErrors ] = createSignal<string[]>([])

  createComputed(() => {
    signup()
    setErrors([])
  })

  const onInput = (input: string, id?: string): string[] | undefined => {
    switch(id) {
    case formId('password'):
    case formId('confirm'):
    {
      const errors: string[] = []
      { /[A-Z]+/.test(input) ? '' : errors.push('Password requires at least one uppercase') }
      { /\d+/.test(input) ? '' : errors.push('Password requires at least one number') }
      { /[\W_]+/.test(input) ? '' : errors.push('Password requires at least one special character') }
      return errors
    }
    }
    return
  }

  const required = createMemo(() => { return { ...signup() && { required: true } } })
  const requiredPassword = createMemo(() => {
    return { ...signup() && { ...required(), minLength: 8 } }
  })

  const doSignup = async () => {
    if (!formRef) { return }
    const formData = new FormData(formRef)
    if (!formRef.checkValidity()) {
      return
    }

    const username = formData.get('username')
    const email = formData.get('email')
    const password = formData.get('password')
    if (!username || !email || !password) {
      setErrors([ 'All fields are required' ])
      return
    }

    try {
      await client.createPerson(username.toString(), email.toString(), password.toString())
      client.loginPerson(email.toString(), password.toString())
    } catch (err) {
      setErrors([ (err as Error).message ])
    }
  }

  const doSignin = async () => {
    if (!formRef) { return }
    const formData = new FormData(formRef)

    const email = formData.get('email')
    const password = formData.get('password')
    if (!email || !password) {
      setErrors([ 'All fields are required' ])
      return
    }

    try {
      await client.loginPerson(email.toString(), password.toString())
    } catch (err) {
      setErrors([ (err as Error).message ])
    }
  }

  return (
    <div class="full-page flex center">
      <form ref={ formRef } class={ `${styles.loginForm} ${form.form}` }>
        <GradientAnim 
          colors={ [ [ 255, 128, 64 ], [ 275, 200, 28 ], [ 255, 90, 10 ], [ 190, 100, 250 ] ] } 
          class={ `${styles.side} overflow hidden` }
          speedMultiplier={ 2 }
        />
        <div class={ `overflow hidden rounded box-shadow ${styles.inputs}` }>
          <FormField name="email" class={ styles.email }>
            <label>Email</label>
            <ValidIndication enabled={ signup() } validation={ onInput }>
              <input { ...required } type="email" onInput={ () => { setErrors([]) } }/>
            </ValidIndication>
          </FormField>
          <Show when={ signup() }>
            <FormField name="username" class={ styles.username }>
              <label>Username</label>
              <ValidIndication enabled={ signup() } validation={ onInput }>
                <input { ...required } minLength={ 1 } type="text" onInput={ () => { setErrors([]) } }/>
              </ValidIndication>
            </FormField>
          </Show>
          <FormField name="password" class={ styles.password }>
            <label>Password</label>
            <ValidIndication enabled={ signup() } validation={ onInput }>
              <PasswordInput { ...requiredPassword } onInput={ () => { setErrors([]) } }/>
            </ValidIndication>
          </FormField>
          <Show when={ errors().length > 0 }>
            <div 
              class={ `${fieldStyles.error}` }
              style={ { '--border-col': 'red' } }
            >
              <ul>
                <For each={ errors() }>
                  { err => <li>{ err }</li> }
                </For>
              </ul>
            </div>
          </Show>
          <div class={ `flex column ${styles.signin}` }>
            <button 
              class="primary"
              onClick={ evt => { 
                evt.preventDefault()
                if (signup()) {
                  doSignup()
                  return
                } 
                doSignin()
              } }
            >
              <Show when={ !signup() } fallback="Create">Launch</Show>
            </button>
            <button
              type="button" 
              class="no-fill secondary de-emphasize"
              onClick={ () => { setSignup(!signup()) } }
            >
              <Show when={ !signup() } fallback="Back">Sign Up</Show>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

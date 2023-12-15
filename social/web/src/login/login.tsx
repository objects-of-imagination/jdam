import { Show, createMemo, createSignal } from 'solid-js'
import { FormField, PasswordInput, ValidIndication } from '../form/form_field'
import { GradientAnim } from '../gradient_anim'
import { formId } from '../form/form'

import styles from './login.module.css'
import form from '../form/form_field.module.css'

export function Login() {

  const [ signup, setSignup ] = createSignal(false)

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

  return (
    <div class="full-page flex center">
      <form class={ `${styles.loginForm} ${form.form}` }>
        <GradientAnim 
          colors={ [ [ 255, 128, 64 ], [ 275, 200, 28 ], [ 255, 90, 10 ], [ 190, 100, 250 ] ] } 
          class={ `${styles.side} overflow hidden` }
          speedMultiplier={ 2 }
        />
        <div class={ `overflow hidden rounded box-shadow ${styles.inputs}` }>
          <FormField name="email" class={ styles.email }>
            <label>Email</label>
            <ValidIndication enabled={ signup() } validation={ onInput }>
              <input { ...required } type="email"/>
            </ValidIndication>
          </FormField>
          <Show when={ signup() }>
            <FormField name="username" class={ styles.username }>
              <label>Username</label>
              <ValidIndication enabled={ signup() } validation={ onInput }>
                <input { ...required } minLength={ 1 } type="text"/>
              </ValidIndication>
            </FormField>
          </Show>
          <FormField name="password" class={ styles.password }>
            <label>Password</label>
            <ValidIndication enabled={ signup() } validation={ onInput }>
              <PasswordInput { ...requiredPassword }/>
            </ValidIndication>
          </FormField>
          <Show when={ signup() }>
            <FormField name="confirm" class={ styles.confirm }>
              <label>Confirm Password</label>
              <ValidIndication enabled={ signup() } validation={ onInput }>
                <PasswordInput { ...requiredPassword }/>
              </ValidIndication>
            </FormField>
          </Show>
          <div class={ `flex column ${styles.signin}` }>
            <button class="primary">
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

export function formId(name: string) {
  return `form-input-${name}`
}

export function stateError(state: ValidityState, inputConfig?: { 
  input?: string
  type?: string
  minLength?: number
  maxLength?: number
  pattern?: string
}) {
  const errors: string[] = []
  switch(true) {
  case state.badInput:
    errors.push('Could not convert to correct value')
    break
  case state.patternMismatch:
    errors.push('Does meet complexity requirements')
    break
  case state.tooLong:
    errors.push(`Too long${ inputConfig?.input? ` (${inputConfig.input.length})` : '' }. Max length is ${ inputConfig?.maxLength ?? '' }`)
    break
  case state.tooShort:
    errors.push(`Too short${ inputConfig?.input? ` (${inputConfig.input.length})` : '' }. Min length is ${ inputConfig?.minLength ?? '' }`)
    break
  case state.typeMismatch:
    errors.push(`Not a valid ${ inputConfig?.type ?? 'type'}`)
    break
  case state.valueMissing:
    errors.push('A value is required')
  }

  return errors
}

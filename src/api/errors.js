export class ApiError extends Error {
  constructor(status, message, code = 'ERROR', details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Error codes the UI reacts to. The real backend should return { code, message, details } with these values.
export const ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  HANDLE_TAKEN: 'HANDLE_TAKEN',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  OFF_THEME: 'OFF_THEME',
  BASKET_LIMIT: 'BASKET_LIMIT',
  ACCOUNT_REQUIRED: 'ACCOUNT_REQUIRED',
  MIN_INVESTMENT: 'MIN_INVESTMENT',
}

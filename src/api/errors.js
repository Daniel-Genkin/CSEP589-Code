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
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_SYMBOL: 'UNKNOWN_SYMBOL',
  SCAN_LIMIT_REACHED: 'SCAN_LIMIT_REACHED',
  SYMBOL_LIMIT_EXCEEDED: 'SYMBOL_LIMIT_EXCEEDED',
  PLAN_REQUIRED: 'PLAN_REQUIRED',
}

// Security utilities for handling sensitive data
export class SecurityUtils {
  /**
   * Masks a token for safe logging/debugging
   * @param token - The token to mask
   * @returns Masked token showing only first 4 and last 4 characters
   */
  static maskToken(token: string): string {
    if (!token || token.length < 8) {
      return '***'
    }
    
    const prefix = token.substring(0, 4)
    const suffix = token.substring(token.length - 4)
    const middle = '*'.repeat(Math.min(token.length - 8, 20))
    
    return `${prefix}${middle}${suffix}`
  }

  /**
   * Redacts sensitive information from error messages
   * @param error - Error object or string
   * @returns Sanitized error message
   */
  static sanitizeError(error: Error | string | unknown): string {
    let message = error instanceof Error ? error.message : String(error)
    
    // Remove any potential token patterns
    message = message.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***')
    message = message.replace(/ghs_[a-zA-Z0-9]{36}/g, 'ghs_***')
    message = message.replace(/Bearer [a-zA-Z0-9_-]+/g, 'Bearer ***')
    
    return message
  }

  /**
   * Validates that a string looks like a GitHub token
   * @param token - The token to validate
   * @returns True if token format is valid
   */
  static isValidGitHubToken(token: string): boolean {
    // GitHub Personal Access Tokens start with ghp_, ghs_, etc.
    return /^gh[ps]_[a-zA-Z0-9]{36}$/.test(token) || /^[a-zA-Z0-9]{40}$/.test(token)
  }
}

import { useState, useEffect } from 'react'
import GitHubEnterpriseAPI from './githubApi'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  api: GitHubEnterpriseAPI
}

export const useGitHubAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    api: new GitHubEnterpriseAPI()
  })

  useEffect(() => {
    // Check for stored credentials on mount
    const initAuth = async () => {
      try {
        const hasStoredCreds = authState.api.hasStoredCredentials()
        if (hasStoredCreds) {
          // Wait a moment for credentials to load asynchronously
          setTimeout(async () => {
            if (authState.api.isAuthenticated()) {
              setAuthState(prev => ({
                ...prev,
                isAuthenticated: true,
                isLoading: false
              }))
            } else {
              setAuthState(prev => ({
                ...prev,
                isLoading: false
              }))
            }
          }, 100)
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }))
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Authentication check failed',
          isLoading: false
        }))
      }
    }

    initAuth()
  }, [])

  const login = async (enterpriseName: string, token: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const success = await authState.api.authenticate(enterpriseName.trim(), token.trim())
      
      if (success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }))
        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials or insufficient permissions'
        }))
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      }))
      return false
    }
  }

  const logout = () => {
    authState.api.logout()
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      error: null
    }))
  }

  return {
    ...authState,
    login,
    logout
  }
}

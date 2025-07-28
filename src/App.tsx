import { useState, useEffect, useCallback } from 'react'
import UserManagement from './components/UserManagement'
import Header from './components/Header'
import Footer from './components/Footer'
import LoginForm from './components/LoginForm'
import { useGitHubAuth } from './services/useGitHubAuth'
import type { User } from './services/githubApi'

function App() {
  const { isAuthenticated, isLoading: authLoading, error: authError, api, login, logout } = useGitHubAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<string>('')

  // Load users when authenticated
  const loadUsers = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoadingUsers(true)
    setUserError(null)
    setLoadingProgress('Connecting to GitHub Enterprise...')

    try {
      const fetchedUsers = await api.getAllUsers()
      setUsers(fetchedUsers)
      setLoadingProgress('')
    } catch (error) {
      console.error('Failed to load users:', error)
      setUserError(error instanceof Error ? error.message : 'Failed to load users')
      setLoadingProgress('')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [isAuthenticated, api])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUsers()
    }
  }, [isAuthenticated, authLoading, loadUsers])

  const handleToggleEnterpriseOwner = async (userId: string, currentIsOwner: boolean) => {
    try {
      let success: boolean
      if (currentIsOwner) {
        success = await api.removeEnterpriseOwner(userId)
      } else {
        success = await api.assignEnterpriseOwner(userId)
      }

      if (success) {
        // Get updated user data to ensure we have the latest information
        const updatedUser = await api.getUpdatedUser(userId)
        if (updatedUser) {
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? updatedUser : user
            )
          )
        } else {
          // Fallback to simple toggle if we can't fetch updated data
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId
                ? { ...user, isEnterpriseOwner: !currentIsOwner }
                : user
            )
          )
        }
      } else {
        throw new Error('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      setUserError(error instanceof Error ? error.message : 'Failed to update user role')
    }
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const success = await api.changeUserRole(userId, newRole)

      if (success) {
        // Get updated user data to ensure we have the latest information
        const updatedUser = await api.getUpdatedUser(userId)
        if (updatedUser) {
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? updatedUser : user
            )
          )
        } else {
          // Fallback: refresh all users if we can't fetch updated data
          await loadUsers()
        }
      } else {
        throw new Error('Failed to change user role')
      }
    } catch (error) {
      console.error('Error changing user role:', error)
      setUserError(error instanceof Error ? error.message : 'Failed to change user role')
    }
  }

  const handleLogin = async (enterpriseName: string, token: string): Promise<boolean> => {
    const success = await login(enterpriseName, token)
    return success
  }

  const handleLogout = () => {
    logout()
    setUsers([])
    setUserError(null)
    setLoadingProgress('')
  }

  const handleRefresh = async () => {
    await loadUsers()
  }

  // Show loading during initial authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center shadow-2xl backdrop-blur-sm bg-opacity-80">
            <div className="w-10 h-10 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#e6edf3] text-lg font-medium">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col">
        <div className="flex-1">
          <LoginForm
            onLogin={handleLogin}
            isLoading={authLoading}
            error={authError}
          />
        </div>
        <Footer />
      </div>
    )
  }

  // Show main application
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <Header onLogout={handleLogout} />
      <main className="flex-1 pt-4">
        <UserManagement 
          users={users}
          isLoading={isLoadingUsers}
          error={userError}
          onToggleEnterpriseOwner={handleToggleEnterpriseOwner}
          onChangeUserRole={handleChangeUserRole}
          onRefresh={handleRefresh}
          loadingProgress={loadingProgress}
        />
      </main>
      <Footer />
    </div>
  )
}

export default App

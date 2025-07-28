import React, { useState } from 'react'
import type { User } from '../services/githubApi'

interface UserCardProps {
  user: User
  onToggleEnterpriseOwner: (userId: string, currentIsOwner: boolean) => Promise<void>
  onChangeUserRole: (userId: string, newRole: string) => Promise<void>
}

const UserCard: React.FC<UserCardProps> = ({ user, onToggleEnterpriseOwner, onChangeUserRole }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)

  // Available roles for role changing
  const availableRoles = [
    { value: 'user', display: 'User' },
    { value: 'guest_collaborator', display: 'Guest Collaborator' },
    { value: 'enterprise_owner', display: 'Enterprise Owner' },
    { value: 'billing_manager', display: 'Billing Manager' }
  ]

  const handleRoleToggle = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowConfirmation(false)
    
    try {
      await onToggleEnterpriseOwner(user.id, user.isEnterpriseOwner)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (newRole: string) => {
    if (newRole === user.currentRole?.toLowerCase() || 
        (newRole === 'enterprise_owner' && user.currentRole === 'Enterprise Owner')) {
      setShowRoleSelector(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowRoleSelector(false)
    
    try {
      await onChangeUserRole(user.id, newRole)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change role'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelConfirmation = () => {
    setShowConfirmation(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayUsername = user.login || user.email.split('@')[0]

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#58a6ff] transition-all duration-200 hover:shadow-lg hover:shadow-[#58a6ff]/10 group">
      {/* Perfect Square Container */}
      <div className="aspect-square flex flex-col">
        {/* Header with Avatar and Role Badge */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              user.isEnterpriseOwner ? 'bg-gradient-to-br from-[#f97316] to-[#ea580c]' : 'bg-[#7d8590]'
            }`}>
              {getInitials(user.name)}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
              user.isEnterpriseOwner 
                ? 'bg-[#f97316] text-white shadow-lg' 
                : 'bg-[#21262d] text-[#e6edf3] border border-[#30363d]'
            }`}>
              {user.currentRole || (user.isEnterpriseOwner ? 'Owner' : 'User')}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-1">
            <h3 className="text-[#e6edf3] font-semibold text-sm leading-tight line-clamp-2 group-hover:text-[#58a6ff] transition-colors">
              {user.name}
            </h3>
            <p className="text-[#7d8590] text-xs font-mono">
              @{displayUsername}
            </p>
            <div className="mt-2">
              <span className="text-[#7d8590] text-xs block">Last Activity</span>
              <span className="text-[#e6edf3] text-xs">{formatDate(user.lastLogin)}</span>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="px-4 pb-4 flex-1 flex flex-col justify-end">
          {error && (
            <div className="mb-3 p-2 bg-[#490202] border border-[#f85149] rounded text-xs">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-[#f85149] mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-[#f85149] text-xs">{error}</span>
              </div>
            </div>
          )}

          {showConfirmation ? (
            <div className="space-y-2">
              <p className="text-xs text-[#e6edf3] text-center mb-2">
                {user.isEnterpriseOwner ? 'Remove Enterprise Owner role?' : 'Assign Enterprise Owner role?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRoleToggle}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                    user.isEnterpriseOwner
                      ? 'bg-[#da3633] hover:bg-[#f85149] text-white border border-[#da3633] hover:border-[#f85149]'
                      : 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[#238636] hover:border-[#2ea043]'
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      Wait...
                    </div>
                  ) : (
                    'Confirm'
                  )}
                </button>
                <button
                  onClick={cancelConfirmation}
                  disabled={isLoading}
                  className="flex-1 px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : showRoleSelector ? (
            <div className="space-y-2">
              <p className="text-xs text-[#e6edf3] text-center mb-2">
                Change role to:
              </p>
              <div className="space-y-1">
                {availableRoles.map(role => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    disabled={isLoading || role.display === user.currentRole}
                    className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 text-left ${
                      role.display === user.currentRole
                        ? 'bg-[#30363d] text-[#7d8590] border border-[#30363d] cursor-not-allowed'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d]'
                    } disabled:opacity-50`}
                  >
                    {role.display} {role.display === user.currentRole ? '(Current)' : ''}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRoleSelector(false)}
                disabled={isLoading}
                className="w-full px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Enterprise Owner Toggle Button */}
              <button
                onClick={handleRoleToggle}
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  user.isEnterpriseOwner || user.currentRole === 'Enterprise Owner'
                    ? 'bg-[#21262d] hover:bg-[#da3633] text-[#e6edf3] hover:text-white border border-[#30363d] hover:border-[#da3633]'
                    : 'bg-[#21262d] hover:bg-[#238636] text-[#e6edf3] hover:text-white border border-[#30363d] hover:border-[#238636]'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    {user.isEnterpriseOwner || user.currentRole === 'Enterprise Owner' ? (
                      <>
                        <svg className="w-3 h-3 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Remove Owner Role
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Assign Owner Role
                      </>
                    )}
                  </>
                )}
              </button>
              
              {/* Role Selector Button - show for all users */}
              <button
                onClick={() => setShowRoleSelector(true)}
                disabled={isLoading}
                className="w-full px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] transition-colors duration-200 disabled:opacity-50"
              >
                <svg className="w-3 h-3 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                Change Role
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserCard

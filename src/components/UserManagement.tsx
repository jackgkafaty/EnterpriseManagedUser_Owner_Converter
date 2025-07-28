import React, { useState, useMemo } from 'react'
import UserCard from './UserCard'
import DisclaimerBanner from './DisclaimerBanner'
import type { User } from '../services/githubApi'

interface UserManagementProps {
  users: User[]
  isLoading: boolean
  error: string | null
  onToggleEnterpriseOwner: (userId: string, currentIsOwner: boolean) => Promise<void>
  onChangeUserRole: (userId: string, newRole: string) => Promise<void>
  onRefresh: () => Promise<void>
  loadingProgress?: string
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  isLoading, 
  error, 
  onToggleEnterpriseOwner, 
  onChangeUserRole,
  onRefresh,
  loadingProgress
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterByRole, setFilterByRole] = useState<'all' | 'owners' | 'non-owners'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const usersPerPage = 16 // 4 rows of 4 cards each

  // Enhanced role change handler with success feedback
  const handleToggleEnterpriseOwnerWithFeedback = async (userId: string, currentIsOwner: boolean) => {
    const user = users.find(u => u.id === userId)
    const userName = user?.name || 'User'
    
    await onToggleEnterpriseOwner(userId, currentIsOwner)
    
    // Show success message
    const action = currentIsOwner ? 'removed from' : 'assigned to'
    setSuccessMessage(`${userName} has been successfully ${action} Enterprise Owner role`)
    
    // Clear message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleChangeUserRoleWithFeedback = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId)
    const userName = user?.name || 'User'
    
    // Get role display name
    const roleDisplayMap: Record<string, string> = {
      'user': 'User',
      'guest_collaborator': 'Guest Collaborator',
      'enterprise_owner': 'Enterprise Owner',
      'billing_manager': 'Billing Manager'
    }
    const roleDisplayName = roleDisplayMap[newRole] || newRole
    
    await onChangeUserRole(userId, newRole)
    
    // Show success message
    setSuccessMessage(`${userName}'s role has been successfully changed to ${roleDisplayName}`)
    
    // Clear message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.login && user.login.toLowerCase().includes(searchLower)) ||
        (user.department && user.department.toLowerCase().includes(searchLower))
      
      const matchesFilter = filterByRole === 'all' ||
                           (filterByRole === 'owners' && user.isEnterpriseOwner) ||
                           (filterByRole === 'non-owners' && !user.isEnterpriseOwner)
      
      return matchesSearch && matchesFilter
    })
  }, [users, searchTerm, filterByRole])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

  // Reset to first page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: 'all' | 'owners' | 'non-owners') => {
    setFilterByRole(value)
    setCurrentPage(1)
  }

  // Count enterprise owners - use the isEnterpriseOwner flag as the primary source of truth
  const enterpriseOwnerCount = users.filter(user => user.isEnterpriseOwner).length

  // Debug logging to help identify count discrepancies
  React.useEffect(() => {
    if (users.length > 0) {
      const ownersFromFlag = users.filter(user => user.isEnterpriseOwner).length
      const ownersFromRole = users.filter(user => user.currentRole === 'Enterprise Owner').length
      const totalUsers = users.length
      
      console.log('User Count Debug:', {
        totalUsers,
        ownersFromFlag,
        ownersFromRole,
        regularUsers: totalUsers - ownersFromFlag,
        discrepancy: ownersFromFlag !== ownersFromRole ? 'YES' : 'NO'
      })
      
      // Log sample of users with mismatched data
      const mismatchedUsers = users.filter(user => 
        (user.isEnterpriseOwner && user.currentRole !== 'Enterprise Owner') ||
        (!user.isEnterpriseOwner && user.currentRole === 'Enterprise Owner')
      )
      
      if (mismatchedUsers.length > 0) {
        console.log('Users with mismatched isEnterpriseOwner vs currentRole:', 
          mismatchedUsers.slice(0, 5).map(user => ({
            name: user.name,
            isEnterpriseOwner: user.isEnterpriseOwner,
            currentRole: user.currentRole,
            roles: user.roles
          }))
        )
      }
    }
  }, [users])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <DisclaimerBanner />
      
      {/* Success Banner */}
      {successMessage && (
        <div className="mb-6 bg-gradient-to-r from-[#0f5132] to-[#1a5a3a] border border-[#2ea043] rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-[#2ea043] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#e6edf3] font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-[#7d8590] hover:text-[#e6edf3] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#161b22] to-[#1f2428] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff]/50 transition-all duration-200 shadow-lg">
          <h3 className="text-sm font-medium text-[#7d8590] uppercase tracking-wider">Total Users</h3>
          <p className="text-3xl font-bold text-[#e6edf3] mt-2">{users.length}</p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-[#58a6ff] rounded-full mr-2"></div>
            <span className="text-xs text-[#7d8590]">All Enterprise Members</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#161b22] to-[#1f2428] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff]/50 transition-all duration-200 shadow-lg">
          <h3 className="text-sm font-medium text-[#7d8590] uppercase tracking-wider">Enterprise Owners</h3>
          <p className="text-3xl font-bold text-[#58a6ff] mt-2">{enterpriseOwnerCount}</p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-[#58a6ff] rounded-full mr-2"></div>
            <span className="text-xs text-[#7d8590]">Administrative Access</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#161b22] to-[#1f2428] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff]/50 transition-all duration-200 shadow-lg">
          <h3 className="text-sm font-medium text-[#7d8590] uppercase tracking-wider">Regular Users</h3>
          <p className="text-3xl font-bold text-[#2ea043] mt-2">{users.length - enterpriseOwnerCount}</p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-[#2ea043] rounded-full mr-2"></div>
            <span className="text-xs text-[#7d8590]">Standard Members</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-r from-[#161b22] to-[#1f2428] border border-[#30363d] rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d1117] border-2 border-[#30363d] rounded-lg text-[#e6edf3] placeholder-[#7d8590] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-all duration-200 hover:border-[#58a6ff]/50"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d8590] hover:text-[#f85149] transition-colors duration-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Filter */}
            <div className="relative">
              <select
                value={filterByRole}
                onChange={(e) => handleFilterChange(e.target.value as 'all' | 'owners' | 'non-owners')}
                className="appearance-none px-4 py-3 pr-10 bg-gradient-to-r from-[#0d1117] to-[#161b22] border-2 border-[#30363d] rounded-lg text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-all duration-200 hover:border-[#58a6ff]/50 min-w-[180px] cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="owners">Enterprise Owners</option>
                <option value="non-owners">Regular Users</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] border border-[#238636] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-[#238636]/25 disabled:hover:from-[#238636] disabled:hover:to-[#2ea043]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Results Info */}
        {filteredUsers.length !== users.length && (
          <div className="mt-4 pt-4 border-t border-[#30363d]">
            <p className="text-sm text-[#7d8590]">
              Showing <span className="text-[#58a6ff] font-medium">{filteredUsers.length}</span> of <span className="text-[#e6edf3] font-medium">{users.length}</span> users
              {searchTerm && <span className="text-[#f85149]"> matching "{searchTerm}"</span>}
              {filterByRole !== 'all' && <span className="text-[#a855f7]"> filtered by {filterByRole === 'owners' ? 'Enterprise Owners' : 'Regular Users'}</span>}
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#490202] border border-[#f85149] rounded-md p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-[#f85149] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-[#f85149] font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin mb-4"></div>
          <p className="text-[#e6edf3] text-lg font-medium mb-2">Loading Users</p>
          <p className="text-[#7d8590]">{loadingProgress || 'Fetching users from GitHub Enterprise...'}</p>
        </div>
      ) : (
        <>
          {/* Users Grid */}
          {currentUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggleEnterpriseOwner={handleToggleEnterpriseOwnerWithFeedback}
                  onChangeUserRole={handleChangeUserRoleWithFeedback}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-[#30363d] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-[#e6edf3] mb-2">No users found</h3>
              <p className="text-[#7d8590] mb-4">
                {users.length === 0 
                  ? 'No users have been loaded yet.' 
                  : 'No users match your current search criteria.'
                }
              </p>
              {(searchTerm || filterByRole !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterByRole('all')
                    setCurrentPage(1)
                  }}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-[#7d8590]">
                Showing {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-[#e6edf3] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        currentPage === page 
                          ? 'bg-[#58a6ff] text-white' 
                          : 'text-[#e6edf3] bg-[#21262d] border border-[#30363d] hover:bg-[#30363d]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-[#e6edf3] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UserManagement

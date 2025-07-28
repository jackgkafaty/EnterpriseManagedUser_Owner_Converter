import CredentialManager from './encryption'
import { SecurityUtils } from '../utils/security'

// GitHub API configuration and authentication
export interface GitHubConfig {
  enterprise: string
  token: string
  apiUrl?: string // For GitHub Enterprise Server
}

export interface User {
  id: string
  name: string
  email: string
  isEnterpriseOwner: boolean
  department: string
  lastLogin: string
  login?: string
  avatarUrl?: string
  roles?: string[]
  currentRole?: string
}

interface ScimUser {
  id: string
  externalId?: string
  userName: string
  displayName: string
  emails: Array<{ value: string; primary: boolean }>
  active: boolean
  name?: {
    givenName?: string
    familyName?: string
  }
  'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
    department?: string
  }
  roles?: Array<{
    value: string
    display?: string
    type?: string
    primary?: boolean
  }>
  meta?: {
    created?: string
    lastModified?: string
  }
}

interface PaginatedResponse<T> {
  Resources: T[]
  totalResults: number
  startIndex: number
  itemsPerPage: number
}

class GitHubEnterpriseAPI {
  private enterpriseName: string = ''
  private token: string = ''
  private baseUrl: string = ''

  constructor() {
    // Load credentials immediately on construction
    this.loadCredentials()
  }

  private async loadCredentials(): Promise<void> {
    try {
      const credentials = await CredentialManager.decryptCredentials()
      if (credentials) {
        this.enterpriseName = credentials.enterpriseName
        this.token = credentials.token
        this.baseUrl = `https://api.github.com/scim/v2/enterprises/${this.enterpriseName}`
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
    }
  }

  async authenticate(enterpriseName: string, token: string): Promise<boolean> {
    try {
      // Store credentials securely
      await CredentialManager.encryptCredentials(enterpriseName, token)
      
      this.enterpriseName = enterpriseName
      this.token = token
      this.baseUrl = `https://api.github.com/scim/v2/enterprises/${enterpriseName}`

      // Test authentication with a simple request
      const response = await this.makeRequest(`${this.baseUrl}/Users?count=1`)
      return response.ok
    } catch (error) {
      console.error('Authentication failed:', SecurityUtils.sanitizeError(error))
      return false
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/scim+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/scim+json',
      ...options.headers
    }

    return fetch(url, {
      ...options,
      headers
    })
  }

  // Parallel paginated loading of all users
  async getAllUsers(): Promise<User[]> {
    try {
      if (!this.token || !this.enterpriseName) {
        await this.loadCredentials()
        if (!this.token || !this.enterpriseName) {
          throw new Error('No authentication credentials found')
        }
      }

      // First, get the total count of users
      const initialResponse = await this.makeRequest(`${this.baseUrl}/Users?count=1`)
      if (!initialResponse.ok) {
        throw new Error(`Failed to fetch users: ${initialResponse.statusText}`)
      }
      
      const initialData: PaginatedResponse<ScimUser> = await initialResponse.json()
      const totalUsers = initialData.totalResults
      const usersPerPage = 100 // GitHub's maximum
      const totalPages = Math.ceil(totalUsers / usersPerPage)

      // Create parallel requests for all pages
      const pagePromises: Promise<ScimUser[]>[] = []
      
      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * usersPerPage + 1
        pagePromises.push(this.fetchUsersPage(startIndex, usersPerPage))
      }

      // Execute all requests in parallel
      const pageResults = await Promise.all(pagePromises)
      
      // Flatten all results
      const allScimUsers = pageResults.flat()
      
      // Convert SCIM users to our User interface with role information
      return allScimUsers.map(scimUser => this.convertScimUser(scimUser))
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  private async fetchUsersPage(startIndex: number, count: number): Promise<ScimUser[]> {
    try {
      const url = `${this.baseUrl}/Users?startIndex=${startIndex}&count=${count}`
      const response = await this.makeRequest(url)
      
      if (!response.ok) {
        console.warn(`Failed to fetch page starting at ${startIndex}: ${response.statusText}`)
        return []
      }
      
      const data: PaginatedResponse<ScimUser> = await response.json()
      return data.Resources || []
    } catch (error) {
      console.error(`Error fetching page starting at ${startIndex}:`, error)
      // Return empty array to avoid breaking other parallel requests
      return []
    }
  }

  private convertScimUser(scimUser: ScimUser): User {
    const primaryEmail = scimUser.emails?.find(email => email.primary)?.value || 
                        scimUser.emails?.[0]?.value || 
                        scimUser.userName

    const fullName = scimUser.displayName || 
                    (scimUser.name?.givenName && scimUser.name?.familyName 
                      ? `${scimUser.name.givenName} ${scimUser.name.familyName}`
                      : scimUser.userName)

    const department = scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']?.department || 'Unknown'
    
    // Extract roles from SCIM user
    const roles = scimUser.roles?.map(role => role.value) || []
    
    // Convert role UUID to human-readable name
    const getRoleDisplayName = (roleValue: string): string => {
      const roleMap: Record<string, string> = {
        'user': 'User',
        '27d9891d-2c17-4f45-a262-781a0e55c80a': 'User',
        'guest_collaborator': 'Guest Collaborator',
        '1ebc4a02-e56c-43a6-92a5-02ee09b90824': 'Guest Collaborator',
        'enterprise_owner': 'Enterprise Owner',
        '981df190-8801-4618-a08a-d91f6206c954': 'Enterprise Owner',
        'ba4987ab-a1c3-412a-b58c-360fc407cb10': 'Enterprise Owner',
        'billing_manager': 'Billing Manager',
        '0e338b8c-cc7f-498a-928d-ea3470d7e7e3': 'Billing Manager',
        'e6be2762-e4ad-4108-b72d-1bbe884a0f91': 'Billing Manager'
      }
      return roleMap[roleValue] || roleValue
    }

    const primaryRole = scimUser.roles?.find(role => role.primary)?.value || 
                       roles.find(role => role.toLowerCase().includes('enterprise') || role === '981df190-8801-4618-a08a-d91f6206c954') ||
                       roles[0] || 
                       'user'

    // Check if user is enterprise owner by role value only (since REST API calls removed)
    const isEnterpriseOwnerByRole = roles.some(role => 
      role === 'enterprise_owner' || role === '981df190-8801-4618-a08a-d91f6206c954' || role === 'ba4987ab-a1c3-412a-b58c-360fc407cb10'
    )
    const isEnterpriseOwner = isEnterpriseOwnerByRole

    return {
      id: scimUser.id,
      name: fullName,
      email: primaryEmail,
      login: scimUser.userName,
      isEnterpriseOwner: isEnterpriseOwner,
      department: department,
      lastLogin: scimUser.meta?.lastModified || scimUser.meta?.created || new Date().toISOString().split('T')[0],
      roles: roles,
      currentRole: getRoleDisplayName(primaryRole)
    }
  }

  async assignEnterpriseOwner(userId: string): Promise<boolean> {
    return this.changeUserRole(userId, 'enterprise_owner')
  }

  async removeEnterpriseOwner(userId: string): Promise<boolean> {
    return this.changeUserRole(userId, 'user')
  }

  async changeUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
      // Use PATCH with operations format as specified in GitHub SCIM documentation
      // https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/scim?apiVersion=2022-11-28#update-an-attribute-for-a-scim-enterprise-user
      const response = await this.makeRequest(
        `${this.baseUrl}/Users/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/scim+json',
          },
          body: JSON.stringify({
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations: [
              {
                op: "replace",
                path: "roles",
                value: [
                  {
                    value: newRole,
                    primary: true
                  }
                ]
              }
            ]
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SCIM API Error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to update user role: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Error changing user role:', error)
      throw error
    }
  }

  // Get updated user data after role change
  async getUpdatedUser(userId: string): Promise<User | null> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/Users/${userId}`)
      if (!response.ok) {
        console.error('Failed to fetch updated user data:', response.statusText)
        return null
      }
      
      const scimUser: ScimUser = await response.json()
      return this.convertScimUser(scimUser)
    } catch (error) {
      console.error('Error fetching updated user:', error)
      return null
    }
  }

  // Get available roles with display names
  getAvailableRoles(): Array<{ value: string; display: string }> {
    return [
      { value: 'user', display: 'User' },
      { value: 'guest_collaborator', display: 'Guest Collaborator' },
      { value: 'enterprise_owner', display: 'Enterprise Owner' },
      { value: 'billing_manager', display: 'Billing Manager' }
    ]
  }

  logout(): void {
    CredentialManager.clearCredentials()
    this.enterpriseName = ''
    this.token = ''
    this.baseUrl = ''
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.enterpriseName)
  }

  hasStoredCredentials(): boolean {
    return CredentialManager.hasStoredCredentials()
  }
}

export default GitHubEnterpriseAPI

import React, { useState } from 'react'
import DisclaimerBanner from './DisclaimerBanner'

interface LoginFormProps {
  onLogin: (enterpriseName: string, token: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, error }) => {
  const [enterpriseName, setEnterpriseName] = useState('')
  const [token, setToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enterpriseName.trim() && token.trim()) {
      await onLogin(enterpriseName.trim(), token.trim())
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <DisclaimerBanner />
        
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#e6edf3] mb-2">Login</h2>
            <p className="text-[#7d8590] text-sm">GitHub Enterprise Managed Users - Role Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="enterpriseName" className="block text-sm font-medium text-[#e6edf3] mb-2">
                Enterprise Name
              </label>
              <input
                id="enterpriseName"
                type="text"
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                placeholder="my-enterprise"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#7d8590] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[#7d8590] mt-1">
                Enter your GitHub Enterprise slug or full URL
              </p>
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-[#e6edf3] mb-2">
                Personal Access Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#7d8590] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[#7d8590] mt-1">
                🔒 Your token will be encrypted and stored securely locally
              </p>
            </div>

            {error && (
              <div className="bg-[#490202] border border-[#f85149] rounded-md p-3">
                <div className="flex items-center">
                  <span className="text-[#f85149] mr-2">⚠️</span>
                  <span className="text-[#f85149] text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !enterpriseName.trim() || !token.trim()}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#238636] flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </>
              ) : (
                'Connect to GitHub Enterprise'
              )}
            </button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="border-t border-[#30363d] pt-6">
              <h3 className="text-sm font-medium text-[#e6edf3] mb-3">Security Features</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-[#58a6ff] mr-3 mt-0.5">🔐</span>
                  <div>
                    <div className="text-sm font-medium text-[#e6edf3]">Secure Storage</div>
                    <div className="text-xs text-[#7d8590]">Credentials are encrypted using AES-256 encryption before local storage</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[#58a6ff] mr-3 mt-0.5">️</span>
                  <div>
                    <div className="text-sm font-medium text-[#e6edf3]">Enterprise Permissions</div>
                    <div className="text-xs text-[#7d8590]">Requires admin:enterprise scope for role management</div>
                  </div>
                </div>
              </div>
            </div>

            <details className="bg-[#0d1117] border border-[#30363d] rounded-md p-4">
              <summary className="text-sm font-medium text-[#58a6ff] cursor-pointer hover:text-[#79c0ff]">
                How to create a Personal Access Token
              </summary>
              <div className="mt-3 text-xs text-[#7d8590]">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to GitHub.com → Settings → Developer settings → Personal access tokens</li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>Select these scopes:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                      <li><code className="bg-[#161b22] px-1 rounded text-[#e6edf3]">admin:enterprise</code> - Manage enterprise roles</li>
                      <li><code className="bg-[#161b22] px-1 rounded text-[#e6edf3]">read:user</code> - Read user information</li>
                      <li><code className="bg-[#161b22] px-1 rounded text-[#e6edf3]">user:email</code> - Access user email addresses</li>
                    </ul>
                  </li>
                  <li>Copy the generated token immediately</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm

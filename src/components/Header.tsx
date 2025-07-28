import React from 'react'

interface HeaderProps {
  enterprise?: string
  onLogout: () => void
}

const Header: React.FC<HeaderProps> = ({ enterprise, onLogout }) => {
  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-[#e6edf3] text-lg font-semibold mb-0.5">GitHub Enterprise Manager Users - Role Manager</h1>
            <p className="text-[#7d8590] text-sm leading-tight">
              {enterprise ? `Connected to: ${enterprise}` : 'Manage Enterprise Owner role assignments'}
            </p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={onLogout} 
              className="bg-[#f85149] hover:bg-[#da3633] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border border-[#f85149] hover:border-[#da3633]"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
